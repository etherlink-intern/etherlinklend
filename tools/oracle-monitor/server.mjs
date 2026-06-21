#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const repoRoot = path.resolve(moduleDir, "../..");
const DEFAULT_CONFIG_PATH = path.join(repoRoot, "config/oracles/etherlink-price-sources.json");
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8789;
const DEFAULT_TIMEOUT_MS = 15000;

const LATEST_ROUND_DATA_SELECTOR = "0xfeaf968c";
const DECIMALS_SELECTOR = "0x313ce567";

export function unitsToFloat(value, decimals) {
  const bigint = typeof value === "bigint" ? value : BigInt(value);
  const sign = bigint < 0n ? "-" : "";
  const abs = bigint < 0n ? -bigint : bigint;
  const raw = abs.toString();
  const scale = Number(decimals);

  if (scale === 0) {
    return Number(`${sign}${raw}`);
  }

  const padded = raw.padStart(scale + 1, "0");
  const whole = padded.slice(0, -scale);
  const fraction = padded.slice(-scale).replace(/0+$/, "");
  return Number(`${sign}${whole}${fraction ? `.${fraction}` : ""}`);
}

export function signedWordToBigInt(word) {
  const value = BigInt(`0x${word}`);
  const signBit = 1n << 255n;
  const uintMax = 1n << 256n;
  return value >= signBit ? value - uintMax : value;
}

export function decodeChainlinkLatestRoundData(result) {
  const hex = result.startsWith("0x") ? result.slice(2) : result;
  if (hex.length < 64 * 5) {
    throw new Error("latestRoundData response is too short");
  }

  const words = [];
  for (let offset = 0; offset < 64 * 5; offset += 64) {
    words.push(hex.slice(offset, offset + 64));
  }

  return {
    roundId: BigInt(`0x${words[0]}`).toString(),
    answer: signedWordToBigInt(words[1]),
    startedAt: Number(BigInt(`0x${words[2]}`)),
    updatedAt: Number(BigInt(`0x${words[3]}`)),
    answeredInRound: BigInt(`0x${words[4]}`).toString()
  };
}

export function median(values) {
  const numbers = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const mid = Math.floor(numbers.length / 2);
  return numbers.length % 2 === 1 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
}

export function deviationBps(price, referencePrice) {
  if (!Number.isFinite(price) || !Number.isFinite(referencePrice) || referencePrice === 0) {
    return null;
  }
  return ((price - referencePrice) / referencePrice) * 10000;
}

function roundNumber(value, decimals = 10) {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function nowUnixSeconds() {
  return Math.floor(Date.now() / 1000);
}

async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "etherlinklend-oracle-monitor/0.1",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function ethCall(rpcUrl, to, data, timeoutMs) {
  const response = await fetchJson(
    rpcUrl,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to, data }, "latest"]
      })
    },
    timeoutMs
  );

  if (response.error) {
    throw new Error(response.error.message || JSON.stringify(response.error));
  }
  if (!response.result || response.result === "0x") {
    throw new Error("empty eth_call response");
  }
  return response.result;
}

function configuredRpcUrl(source, config) {
  const envName = source.rpcEnv || config.network?.rpcEnv;
  return (
    (envName && process.env[envName]) ||
    source.rpcUrl ||
    source.defaultRpc ||
    config.network?.defaultRpc
  );
}

async function fetchEvmChainlinkLatestRound(source, config) {
  const rpcUrl = configuredRpcUrl(source, config);
  if (!rpcUrl) throw new Error("missing RPC URL");

  const decimalsResult = await ethCall(rpcUrl, source.address, DECIMALS_SELECTOR, source.timeoutMs);
  const decimals = Number(BigInt(decimalsResult));
  const roundResult = await ethCall(
    rpcUrl,
    source.address,
    LATEST_ROUND_DATA_SELECTOR,
    source.timeoutMs
  );
  const round = decodeChainlinkLatestRoundData(roundResult);
  if (round.answer <= 0n) {
    throw new Error(`non-positive oracle answer ${round.answer.toString()}`);
  }

  return {
    price: unitsToFloat(round.answer, decimals),
    updatedAt: round.updatedAt,
    metadata: {
      address: source.address,
      decimals,
      roundId: round.roundId,
      answeredInRound: round.answeredInRound,
      startedAt: round.startedAt
    }
  };
}

async function fetchPythHermesPrice(source) {
  const url = new URL(source.endpoint);
  url.searchParams.append("ids[]", source.feedId);
  url.searchParams.set("parsed", "true");

  const response = await fetchJson(url.toString(), {}, source.timeoutMs);
  const parsed = response.parsed?.[0];
  const priceData = parsed?.price;
  if (!priceData) throw new Error("missing parsed Pyth price");

  const price = Number(priceData.price) * 10 ** Number(priceData.expo);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`invalid Pyth price ${priceData.price}e${priceData.expo}`);
  }

  return {
    price,
    updatedAt: Number(priceData.publish_time),
    metadata: {
      feedId: parsed.id || source.feedId,
      confidence: Number(priceData.conf) * 10 ** Number(priceData.expo),
      expo: Number(priceData.expo)
    }
  };
}

async function fetchBinanceTicker(source) {
  const url = new URL(source.endpoint);
  url.searchParams.set("symbol", source.symbol);
  const response = await fetchJson(url.toString(), {}, source.timeoutMs);
  const rawPrice = response.lastPrice ?? response.price;
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`invalid Binance price ${rawPrice}`);
  }

  return {
    price,
    metadata: {
      symbol: source.symbol,
      quoteProxy: source.quoteProxy,
      weightedAvgPrice: response.weightedAvgPrice ? Number(response.weightedAvgPrice) : undefined,
      volume: response.volume ? Number(response.volume) : undefined,
      quoteVolume: response.quoteVolume ? Number(response.quoteVolume) : undefined
    }
  };
}

async function fetchCoinGeckoTokenPrice(source) {
  const url = new URL(source.endpoint);
  url.searchParams.set("contract_addresses", source.contract);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_last_updated_at", "true");

  const response = await fetchJson(url.toString(), {}, source.timeoutMs);
  const token = response[source.contract.toLowerCase()];
  if (!token) throw new Error("CoinGecko token price missing");
  const price = Number(token.usd);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`invalid CoinGecko price ${token.usd}`);
  }

  return {
    price,
    updatedAt: token.last_updated_at ? Number(token.last_updated_at) : undefined,
    metadata: {
      platform: source.platform,
      contract: source.contract
    }
  };
}

async function fetchBlockscoutToken(source) {
  const response = await fetchJson(source.endpoint, {}, source.timeoutMs);
  const price = Number(response.exchange_rate);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`invalid Blockscout exchange_rate ${response.exchange_rate}`);
  }

  return {
    price,
    metadata: {
      symbol: response.symbol,
      name: response.name,
      decimals: response.decimals ? Number(response.decimals) : undefined
    }
  };
}

function collectProtocols(value, protocols = new Set()) {
  if (!value || typeof value !== "object") return protocols;
  if (typeof value.exchange === "string") protocols.add(value.exchange);
  if (typeof value.poolType === "string") protocols.add(value.poolType);
  if (Array.isArray(value)) {
    for (const item of value) collectProtocols(item, protocols);
    return protocols;
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectProtocols(child, protocols);
  }
  return protocols;
}

async function fetchKyberRoute(source) {
  const url = new URL(source.endpoint);
  url.searchParams.set("tokenIn", source.tokenIn);
  url.searchParams.set("tokenOut", source.tokenOut);
  url.searchParams.set("amountIn", source.amountIn);

  const response = await fetchJson(url.toString(), {}, source.timeoutMs);
  const summary = response.data?.routeSummary || response.routeSummary;
  if (!summary) throw new Error("missing Kyber routeSummary");

  const amountInHuman = unitsToFloat(summary.amountIn || source.amountIn, source.tokenInDecimals);
  const amountOutHuman = unitsToFloat(summary.amountOut, source.tokenOutDecimals);
  const price = amountOutHuman / amountInHuman;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`invalid Kyber route price ${price}`);
  }

  return {
    price,
    metadata: {
      tokenIn: source.tokenInSymbol,
      tokenOut: source.tokenOutSymbol,
      amountIn: amountInHuman,
      amountOut: amountOutHuman,
      amountInUsd: summary.amountInUsd ? Number(summary.amountInUsd) : undefined,
      amountOutUsd: summary.amountOutUsd ? Number(summary.amountOutUsd) : undefined,
      protocols: [...collectProtocols(summary.route)]
    }
  };
}

async function fetchSource(source, config) {
  switch (source.kind) {
    case "evm-chainlink-latest-round":
      return await fetchEvmChainlinkLatestRound(source, config);
    case "pyth-hermes-price":
      return await fetchPythHermesPrice(source);
    case "binance-ticker":
      return await fetchBinanceTicker(source);
    case "coingecko-token-price":
      return await fetchCoinGeckoTokenPrice(source);
    case "blockscout-token":
      return await fetchBlockscoutToken(source);
    case "kyber-route":
      return await fetchKyberRoute(source);
    default:
      throw new Error(`unsupported source kind ${source.kind}`);
  }
}

function normalizeRow(source, result, observedAt) {
  const updatedAt = result.updatedAt || observedAt;
  const ageSeconds = Math.max(0, observedAt - updatedAt);
  const stale =
    Number.isFinite(source.staleAfterSeconds) && ageSeconds > Number(source.staleAfterSeconds);

  return {
    id: source.id,
    label: source.label,
    pair: source.pair,
    sourceClass: source.sourceClass,
    role: source.role,
    required: Boolean(source.required),
    price: roundNumber(result.price, 12),
    observedAt,
    updatedAt,
    ageSeconds,
    stale,
    status: stale ? "stale" : "ok",
    metadata: result.metadata || {}
  };
}

function errorRow(source, error, observedAt) {
  return {
    id: source.id,
    label: source.label,
    pair: source.pair,
    sourceClass: source.sourceClass,
    role: source.role,
    required: Boolean(source.required),
    observedAt,
    updatedAt: null,
    ageSeconds: null,
    stale: false,
    status: "error",
    error: error.message || String(error)
  };
}

export function buildPairReferences(rows, config) {
  const policy = config.referencePolicy || {};
  const includeClasses = new Set(policy.includeSourceClasses || []);
  const pairIds = new Set([...(config.pairs || []).map((pair) => pair.id), ...rows.map((row) => row.pair)]);
  const references = {};

  for (const pairId of pairIds) {
    if (pairId === "WXTZ/USDC") continue;
    const eligiblePrices = rows
      .filter((row) => {
        return (
          row.pair === pairId &&
          row.status === "ok" &&
          Number.isFinite(row.price) &&
          (includeClasses.size === 0 || includeClasses.has(row.sourceClass))
        );
      })
      .map((row) => row.price);
    const referencePrice = median(eligiblePrices);
    references[pairId] = {
      pair: pairId,
      referencePrice,
      referenceMethod: referencePrice == null ? "unavailable" : `${policy.method || "median"}:direct`,
      eligibleSourceCount: eligiblePrices.length
    };
  }

  if (
    references["XTZ/USD"]?.referencePrice != null &&
    references["USDC/USD"]?.referencePrice != null
  ) {
    references["WXTZ/USDC"] = {
      pair: "WXTZ/USDC",
      referencePrice: references["XTZ/USD"].referencePrice / references["USDC/USD"].referencePrice,
      referenceMethod: "derived:XTZ/USD divided by USDC/USD",
      eligibleSourceCount:
        references["XTZ/USD"].eligibleSourceCount + references["USDC/USD"].eligibleSourceCount
    };
  } else if (pairIds.has("WXTZ/USDC")) {
    references["WXTZ/USDC"] = {
      pair: "WXTZ/USDC",
      referencePrice: null,
      referenceMethod: "unavailable",
      eligibleSourceCount: 0
    };
  }

  return references;
}

export function attachDeviationFields(rows, references, config) {
  const warnBps = Number(config.referencePolicy?.warnDeviationBps ?? 100);
  const criticalBps = Number(config.referencePolicy?.criticalDeviationBps ?? 250);

  return rows.map((row) => {
    const reference = references[row.pair];
    const signedDeviationBps = deviationBps(row.price, reference?.referencePrice);
    const absDeviationBps =
      signedDeviationBps == null ? null : Math.abs(roundNumber(signedDeviationBps, 4));
    const roundedSigned = signedDeviationBps == null ? null : roundNumber(signedDeviationBps, 4);
    let severity = "none";
    if (absDeviationBps != null && absDeviationBps >= criticalBps) severity = "critical";
    else if (absDeviationBps != null && absDeviationBps >= warnBps) severity = "warn";

    return {
      ...row,
      referencePrice:
        reference?.referencePrice == null ? null : roundNumber(reference.referencePrice, 12),
      referenceMethod: reference?.referenceMethod || null,
      deviationBps: roundedSigned,
      absDeviationBps,
      severity
    };
  });
}

function summarizePairs(rows, references) {
  const pairs = Object.values(references).map((reference) => {
    const pairRows = rows.filter((row) => row.pair === reference.pair);
    const deviations = pairRows
      .map((row) => row.absDeviationBps)
      .filter((value) => Number.isFinite(value));
    return {
      pair: reference.pair,
      referencePrice:
        reference.referencePrice == null ? null : roundNumber(reference.referencePrice, 12),
      referenceMethod: reference.referenceMethod,
      eligibleSourceCount: reference.eligibleSourceCount,
      healthySourceCount: pairRows.filter((row) => row.status === "ok").length,
      totalSourceCount: pairRows.length,
      maxDeviationBps: deviations.length ? roundNumber(Math.max(...deviations), 4) : null
    };
  });

  return pairs.sort((a, b) => a.pair.localeCompare(b.pair));
}

export function formatTableRows(rows) {
  return rows.map((row) => ({
    pair: row.pair,
    source: row.id,
    class: row.sourceClass,
    role: row.role,
    price: row.price ?? null,
    referencePrice: row.referencePrice ?? null,
    deviationBps: row.deviationBps ?? null,
    status: row.status,
    severity: row.severity ?? "none",
    ageSeconds: row.ageSeconds,
    required: row.required
  }));
}

function snapshotStatus(rows, pairs) {
  if (rows.some((row) => row.required && row.status !== "ok")) return "degraded";
  if (pairs.some((pair) => pair.referencePrice == null)) return "degraded";
  if (rows.some((row) => row.severity === "critical")) return "alert";
  if (rows.some((row) => row.severity === "warn")) return "watch";
  return "ok";
}

export async function createSnapshot(config) {
  const observedAt = nowUnixSeconds();
  const enabledSources = (config.sources || []).filter((source) => source.enabled !== false);
  const rows = await Promise.all(
    enabledSources.map(async (source) => {
      try {
        const result = await fetchSource(source, config);
        return normalizeRow(source, result, observedAt);
      } catch (error) {
        return errorRow(source, error, observedAt);
      }
    })
  );

  const references = buildPairReferences(rows, config);
  const rowsWithDeviations = attachDeviationFields(rows, references, config);
  const pairs = summarizePairs(rowsWithDeviations, references);
  const status = snapshotStatus(rowsWithDeviations, pairs);
  const alerts = rowsWithDeviations
    .filter((row) => row.status !== "ok" || row.severity === "warn" || row.severity === "critical")
    .map((row) => ({
      source: row.id,
      pair: row.pair,
      status: row.status,
      severity: row.severity,
      required: row.required,
      deviationBps: row.deviationBps ?? null,
      error: row.error
    }));

  return {
    schemaVersion: 1,
    name: config.name,
    network: config.network,
    observedAt,
    observedAtIso: new Date(observedAt * 1000).toISOString(),
    refreshIntervalSeconds: Number(config.refreshIntervalSeconds || 900),
    status,
    referencePolicy: config.referencePolicy,
    pairs,
    rows: rowsWithDeviations,
    table: formatTableRows(rowsWithDeviations),
    alerts
  };
}

export class SnapshotCache {
  constructor(config) {
    this.config = config;
    this.refreshIntervalSeconds = Number(
      process.env.ORACLE_MONITOR_REFRESH_SECONDS || config.refreshIntervalSeconds || 900
    );
    this.cachedSnapshot = null;
    this.cachedAtMs = 0;
    this.inFlight = null;
  }

  async getSnapshot({ force = false } = {}) {
    const nowMs = Date.now();
    const fresh =
      this.cachedSnapshot &&
      nowMs - this.cachedAtMs < this.refreshIntervalSeconds * 1000;
    if (!force && fresh) {
      return {
        ...this.cachedSnapshot,
        cache: {
          hit: true,
          cachedAtIso: new Date(this.cachedAtMs).toISOString(),
          nextRefreshAtIso: new Date(
            this.cachedAtMs + this.refreshIntervalSeconds * 1000
          ).toISOString()
        }
      };
    }

    if (this.inFlight) return await this.inFlight;
    this.inFlight = createSnapshot({
      ...this.config,
      refreshIntervalSeconds: this.refreshIntervalSeconds
    })
      .then((snapshot) => {
        this.cachedSnapshot = snapshot;
        this.cachedAtMs = Date.now();
        return {
          ...snapshot,
          cache: {
            hit: false,
            cachedAtIso: new Date(this.cachedAtMs).toISOString(),
            nextRefreshAtIso: new Date(
              this.cachedAtMs + this.refreshIntervalSeconds * 1000
            ).toISOString()
          }
        };
      })
      .finally(() => {
        this.inFlight = null;
      });
    return await this.inFlight;
  }
}

export async function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
  return JSON.parse(await fs.readFile(configPath, "utf8"));
}

function rpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

async function handleRpcCall(call, cache, config) {
  if (!call || call.jsonrpc !== "2.0" || typeof call.method !== "string") {
    return rpcError(call?.id ?? null, -32600, "Invalid Request");
  }

  try {
    switch (call.method) {
      case "rpc.discover":
        return rpcResult(call.id, {
          methods: ["rpc.discover", "oracle.sources", "oracle.snapshot", "oracle.table"],
          refreshIntervalSeconds: cache.refreshIntervalSeconds
        });
      case "oracle.sources":
        return rpcResult(call.id, {
          network: config.network,
          referencePolicy: config.referencePolicy,
          pairs: config.pairs,
          sources: config.sources
        });
      case "oracle.snapshot": {
        const params = call.params && typeof call.params === "object" ? call.params : {};
        return rpcResult(call.id, await cache.getSnapshot({ force: Boolean(params.force) }));
      }
      case "oracle.table": {
        const params = call.params && typeof call.params === "object" ? call.params : {};
        const snapshot = await cache.getSnapshot({ force: Boolean(params.force) });
        return rpcResult(call.id, {
          observedAt: snapshot.observedAt,
          observedAtIso: snapshot.observedAtIso,
          status: snapshot.status,
          cache: snapshot.cache,
          pairs: snapshot.pairs,
          rows: snapshot.table
        });
      }
      default:
        return rpcError(call.id, -32601, `Method not found: ${call.method}`);
    }
  } catch (error) {
    return rpcError(call.id, -32000, error.message || String(error));
  }
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export function createJsonRpcServer(config) {
  const cache = new SnapshotCache(config);
  return http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/healthz") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ ok: true, name: config.name }));
        return;
      }

      if (request.method === "GET") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            name: config.name,
            jsonrpc: "2.0",
            methods: ["rpc.discover", "oracle.sources", "oracle.snapshot", "oracle.table"]
          })
        );
        return;
      }

      if (request.method !== "POST") {
        response.writeHead(405, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "method not allowed" }));
        return;
      }

      const body = await readRequestBody(request);
      const payload = JSON.parse(body);
      const result = Array.isArray(payload)
        ? await Promise.all(payload.map((call) => handleRpcCall(call, cache, config)))
        : await handleRpcCall(payload, cache, config);

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify(rpcError(null, -32700, error.message || "Parse error")));
    }
  });
}

function parseArgs(argv) {
  const args = {
    mode: "serve",
    configPath: process.env.ORACLE_MONITOR_CONFIG || DEFAULT_CONFIG_PATH,
    host: process.env.ORACLE_MONITOR_HOST || DEFAULT_HOST,
    port: Number(process.env.ORACLE_MONITOR_PORT || DEFAULT_PORT)
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--once") args.mode = "once";
    else if (arg === "--table") args.mode = "table";
    else if (arg === "--serve") args.mode = "serve";
    else if (arg === "--config") args.configPath = argv[++index];
    else if (arg === "--host") args.host = argv[++index];
    else if (arg === "--port") args.port = Number(argv[++index]);
    else if (arg === "--help") args.mode = "help";
    else throw new Error(`unknown argument ${arg}`);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node tools/oracle-monitor/server.mjs [--serve|--once|--table]

Options:
  --config <path>  Price source config path
  --host <host>    JSON-RPC host, default ${DEFAULT_HOST}
  --port <port>    JSON-RPC port, default ${DEFAULT_PORT}

Environment:
  ETHERLINK_MAINNET_RPC_URL        Dedicated Etherlink RPC for on-chain feed reads
  ORACLE_MONITOR_REFRESH_SECONDS   Cache refresh interval, default 900
`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.mode === "help") {
    printHelp();
    return;
  }

  const config = await loadConfig(args.configPath);
  if (args.mode === "once") {
    const snapshot = await createSnapshot(config);
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  if (args.mode === "table") {
    const snapshot = await createSnapshot(config);
    console.table(snapshot.table);
    if (snapshot.alerts.length > 0) {
      console.error(JSON.stringify({ status: snapshot.status, alerts: snapshot.alerts }, null, 2));
    }
    return;
  }

  const server = createJsonRpcServer(config);
  server.listen(args.port, args.host, () => {
    console.log(
      `Oracle monitor JSON-RPC listening on http://${args.host}:${args.port} with ${config.refreshIntervalSeconds || 900}s refresh`
    );
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
