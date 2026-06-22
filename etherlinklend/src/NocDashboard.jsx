import { useEffect, useMemo, useState } from "react";

// The oracle-snapshot GitHub Action runs the monitor (tools/oracle-monitor)
// every ~15 min and publishes snapshot.json to the `oracle-snapshot` branch.
// raw.githubusercontent serves it with permissive CORS, so the static site can
// read live data without ever touching the RPC or any API key from the browser.
// If that fetch fails (e.g. the branch doesn't exist yet), we fall back to the
// bundled seed and clearly label the board as a preview.
const SNAPSHOT_URL =
  "https://raw.githubusercontent.com/etherlink-intern/etherlinklend/oracle-snapshot/snapshot.json";
const FALLBACK_URL = "/snapshot.json";
const REFETCH_MS = 5 * 60 * 1000;

// Sources the monitor does not cover yet. Rendered as explicit "pending" rows so
// the board reflects the full intended coverage, not just what is already wired.
// To make one live: add a source entry in config/oracles/etherlink-price-sources.json
// and a fetch handler in tools/oracle-monitor/server.mjs.
const PENDING_ROWS = [
  { lane: "Protocol oracle", source: "Morpho WXTZ/USDC adapter", venue: "Adapter target", pair: "WXTZ/USDC", detail: "1e36 adapter pending deployment" },
  { lane: "Protocol oracle", source: "RedStone USDC/USD", venue: "Etherlink adapter", pair: "USDC/USD", detail: "Current adapter rejects USDC" },
  { lane: "DEX execution", source: "Curve Cryptoswap", venue: "Etherlink pool", pair: "WXTZ/USDC", detail: "Adapter pending" },
  { lane: "DEX execution", source: "Oku route", venue: "Etherlink pool", pair: "WXTZ/USDC", detail: "Adapter pending" },
  { lane: "CEX reference", source: "Coinbase XTZ-USD", venue: "Centralized venue", pair: "XTZ/USD", detail: "Adapter pending" },
  { lane: "CEX reference", source: "Kraken XTZ/USD", venue: "Centralized venue", pair: "XTZ/USD", detail: "Adapter pending" },
];

const LANE_BY_CLASS = {
  oracle: "Protocol oracle",
  "dex-executable": "DEX execution",
  cex: "CEX reference",
  indexer: "Indexer reference",
};
const laneOrder = ["Protocol oracle", "DEX execution", "CEX reference", "Indexer reference"];

export function NocDashboard({ revealClass = "" }) {
  const [snap, setSnap] = useState(null);
  const [origin, setOrigin] = useState("loading"); // loading | live | preview | error
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(SNAPSHOT_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) { setSnap(data); setOrigin("live"); }
      } catch {
        try {
          const res = await fetch(FALLBACK_URL, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!cancelled) { setSnap(data); setOrigin("preview"); }
        } catch {
          if (!cancelled) setOrigin("error");
        }
      }
    }

    load();
    const refetch = window.setInterval(load, REFETCH_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; window.clearInterval(refetch); window.clearInterval(tick); };
  }, []);

  const observedMs = snap?.observedAt ? snap.observedAt * 1000 : null;
  const dataAgeSeconds = observedMs ? Math.max(0, Math.floor((now - observedMs) / 1000)) : null;
  const refreshSeconds = snap?.refreshIntervalSeconds ?? 900;
  const isStale = dataAgeSeconds != null && dataAgeSeconds > refreshSeconds * 2;

  const liveRows = useMemo(() => (snap?.rows ?? []).map((row) => ({
    lane: LANE_BY_CLASS[row.sourceClass] ?? "Indexer reference",
    source: row.label ?? row.id,
    venue: row.role ?? row.sourceClass,
    pair: row.pair,
    price: row.price ?? null,
    deviationBps: row.deviationBps ?? null,
    ageSeconds: row.ageSeconds ?? null,
    detail: row.stale
      ? "stale feed"
      : row.metadata?.address
        ? `on-chain ${shortAddr(row.metadata.address)}`
        : row.role ?? "",
    state: liveState(row),
  })), [snap]);

  const rows = useMemo(
    () => [...liveRows, ...PENDING_ROWS.map((p) => ({ ...p, price: null, state: "pending" }))],
    [liveRows]
  );

  const summary = liveRows.reduce(
    (counts, row) => { counts[row.state] = (counts[row.state] ?? 0) + 1; return counts; },
    { clear: 0, watch: 0, blocked: 0 }
  );

  const bands = (snap?.pairs ?? []).map((pair) => ({
    label: `${pair.pair} spread`,
    value: pair.maxDeviationBps != null ? `${round(pair.maxDeviationBps, 1)} bps` : "n/a",
    state: (pair.maxDeviationBps ?? 0) >= 100 ? "watch" : "clear",
  }));
  const alerts = snap?.alerts ?? [];

  return (
    <section className="noc-section" id="noc" data-reveal="noc">
      <div className={`section-inner noc-shell ${revealClass}`}>
        <div className="noc-heading">
          <div>
            <div className="section-kicker">NOC dashboard</div>
            <h2 className="noc-title">Oracle, DEX, and CEX price watch.</h2>
            <p className="noc-copy">
              Operations board for the WXTZ/USDC market. Live sources are read by the oracle monitor on a {Math.round(refreshSeconds / 60)} minute cadence; sources still awaiting an adapter are marked pending.
            </p>
            <FreshnessBadge origin={origin} ageSeconds={dataAgeSeconds} isStale={isStale} observedIso={snap?.observedAtIso} />
          </div>
          <div className="sweep-panel" aria-label="Snapshot cadence">
            <span>Cadence</span>
            <strong>{Math.round(refreshSeconds / 60)} min</strong>
            <small>{origin === "live" && !isStale ? "Live snapshot" : origin === "preview" ? "Seed snapshot" : isStale ? "Snapshot stale" : "—"}</small>
          </div>
        </div>

        <div className="noc-status-grid" aria-label="Feed status summary">
          <NocStat label="Clear feeds" value={summary.clear} state="clear" />
          <NocStat label="Watch feeds" value={summary.watch} state="watch" />
          <NocStat label="Blocked feeds" value={summary.blocked} state="blocked" />
          <NocStat label="Pending adapters" value={PENDING_ROWS.length} state="neutral" />
        </div>

        <div className="noc-grid">
          <div className="feed-table-wrap" aria-label="Price feed table">
            <div className="feed-table-head">
              <span>Source</span>
              <span>Pair</span>
              <span>Price</span>
              <span>Drift</span>
              <span>Freshness</span>
              <span>Status</span>
            </div>
            {laneOrder.map((lane) => {
              const laneRows = rows.filter((row) => row.lane === lane);
              if (laneRows.length === 0) return null;
              return (
                <div className="feed-lane" key={lane}>
                  <div className="feed-lane-title">{lane}</div>
                  {laneRows.map((row) => (
                    <FeedRow key={`${row.lane}-${row.source}`} row={row} />
                  ))}
                </div>
              );
            })}
          </div>

          <aside className="noc-side" aria-label="Deviation and incident watch">
            <div className="side-panel">
              <div className="side-panel-label">Deviation bands</div>
              {bands.length === 0 ? (
                <div className="deviation-row"><span>Awaiting snapshot</span><strong>—</strong></div>
              ) : bands.map((band) => (
                <div className="deviation-row" key={band.label}>
                  <span>{band.label}</span>
                  <strong className={`text-${band.state}`}>{band.value}</strong>
                </div>
              ))}
            </div>
            <div className="side-panel">
              <div className="side-panel-label">Active alerts</div>
              {alerts.length === 0 ? (
                <ul className="watch-list"><li>No deviation or staleness alerts in the latest snapshot.</li></ul>
              ) : (
                <ul className="watch-list">
                  {alerts.map((alert) => (
                    <li key={`${alert.source}-${alert.pair}`}>
                      <span className={`text-${alert.severity === "critical" ? "blocked" : "watch"}`}>{alert.severity}</span>
                      {` ${alert.source} (${alert.pair}) ${round(alert.deviationBps, 0)} bps`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function FreshnessBadge({ origin, ageSeconds, isStale, observedIso }) {
  if (origin === "loading") return <div className="noc-freshness is-loading">Loading latest snapshot…</div>;
  if (origin === "error") return <div className="noc-freshness is-preview">Live data unavailable — showing planned coverage only.</div>;
  if (origin === "preview") return <div className="noc-freshness is-preview">Preview seed snapshot (not live) · {observedIso ?? "unknown time"}</div>;
  if (isStale) return <div className="noc-freshness is-stale">Live source stale · last updated {formatAge(ageSeconds)} ago</div>;
  return <div className="noc-freshness is-live">Live · updated {formatAge(ageSeconds)} ago</div>;
}

function FeedRow({ row }) {
  return (
    <div className={`feed-row feed-row-${row.state}`}>
      <div>
        <strong>{row.source}</strong>
        <small>{row.venue}</small>
      </div>
      <div>{row.pair}</div>
      <div className="feed-price">{formatPrice(row.price, row.pair)}</div>
      <div>{formatDrift(row.deviationBps)}</div>
      <div>{row.ageSeconds == null ? "—" : `${formatAge(row.ageSeconds)}`}</div>
      <div>
        <span className={`feed-state feed-state-${row.state}`}>{row.state}</span>
        <small>{row.detail}</small>
      </div>
    </div>
  );
}

function NocStat({ label, value, state }) {
  return (
    <div className={`noc-stat noc-stat-${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function liveState(row) {
  if (row.status && row.status !== "ok") return "blocked";
  if (row.stale || row.severity === "warn" || row.severity === "critical" || Math.abs(row.deviationBps ?? 0) >= 100) {
    return "watch";
  }
  return "clear";
}

function formatPrice(price, pair) {
  if (price == null) return "—";
  const unit = pair && pair.includes("/") ? pair.split("/")[1].trim() : "";
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: price >= 10 ? 2 : 4,
    maximumFractionDigits: price >= 10 ? 2 : 4,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatDrift(deviationBps) {
  if (deviationBps == null) return "—";
  const sign = deviationBps > 0 ? "+" : "";
  return `${sign}${round(deviationBps, 0)} bps`;
}

function formatAge(seconds) {
  if (seconds == null) return "—";
  if (seconds < 90) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 90) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function shortAddr(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function round(value, decimals) {
  if (value == null || !Number.isFinite(value)) return value;
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
