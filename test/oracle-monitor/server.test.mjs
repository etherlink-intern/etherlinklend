import assert from "node:assert/strict";

import {
  attachDeviationFields,
  buildPairReferences,
  decodeChainlinkLatestRoundData,
  deviationBps,
  formatTableRows,
  median,
  unitsToFloat
} from "../../tools/oracle-monitor/server.mjs";

function word(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

assert.equal(unitsToFloat("1000000000000000000", 18), 1);
assert.equal(unitsToFloat("235137", 6), 0.235137);

assert.equal(median([3, 1, 2]), 2);
assert.equal(median([1, 2, 3, 4]), 2.5);
assert.equal(median([]), null);
assert.equal(deviationBps(1.01, 1), 100.00000000000009);

const latestRoundData =
  "0x" +
  [
    word(7),
    word(23456789),
    word(1700000000),
    word(1700000030),
    word(7)
  ].join("");
const decoded = decodeChainlinkLatestRoundData(latestRoundData);
assert.equal(decoded.roundId, "7");
assert.equal(decoded.answer, 23456789n);
assert.equal(decoded.updatedAt, 1700000030);

const config = {
  referencePolicy: {
    method: "median",
    includeSourceClasses: ["oracle", "cex", "indexer"],
    warnDeviationBps: 100,
    criticalDeviationBps: 250
  },
  pairs: [{ id: "XTZ/USD" }, { id: "USDC/USD" }, { id: "WXTZ/USDC" }]
};

const rows = [
  { id: "redstone", pair: "XTZ/USD", sourceClass: "oracle", status: "ok", price: 0.25 },
  { id: "pyth-xtz", pair: "XTZ/USD", sourceClass: "oracle", status: "ok", price: 0.251 },
  { id: "binance-xtz", pair: "XTZ/USD", sourceClass: "cex", status: "ok", price: 0.249 },
  { id: "pyth-usdc", pair: "USDC/USD", sourceClass: "oracle", status: "ok", price: 1 },
  { id: "binance-usdc", pair: "USDC/USD", sourceClass: "cex", status: "ok", price: 1.001 },
  {
    id: "kyber",
    pair: "WXTZ/USDC",
    sourceClass: "dex-executable",
    role: "essential-dex-monitor",
    status: "ok",
    price: 0.253
  }
];

const references = buildPairReferences(rows, config);
assert.equal(references["XTZ/USD"].referencePrice, 0.25);
assert.equal(references["USDC/USD"].referencePrice, 1.0005);
assert.equal(references["WXTZ/USDC"].referenceMethod, "derived:XTZ/USD divided by USDC/USD");
assert.ok(Math.abs(references["WXTZ/USDC"].referencePrice - 0.2498750624687656) < 1e-15);

const enriched = attachDeviationFields(rows, references, config);
const kyber = enriched.find((row) => row.id === "kyber");
assert.equal(kyber.referencePrice, 0.249875062469);
assert.equal(kyber.severity, "warn");

const table = formatTableRows(enriched);
assert.equal(table.length, rows.length);
assert.deepEqual(Object.keys(table[0]), [
  "pair",
  "source",
  "class",
  "role",
  "price",
  "referencePrice",
  "deviationBps",
  "status",
  "severity",
  "ageSeconds",
  "required"
]);

console.log("oracle monitor unit tests passed");
