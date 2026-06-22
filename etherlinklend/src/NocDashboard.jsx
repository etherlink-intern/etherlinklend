import { useEffect, useMemo, useState } from "react";

const SWEEP_INTERVAL_MINUTES = 15;
const SWEEP_INTERVAL_MS = SWEEP_INTERVAL_MINUTES * 60 * 1000;

const feedRows = [
  {
    lane: "Protocol oracle",
    source: "Morpho WXTZ/USDC",
    venue: "Adapter target",
    pair: "WXTZ / USDC",
    price: 1.1784,
    unit: "USDC",
    driftBps: 0,
    ageSeed: 4,
    status: "watch",
    detail: "1e36 output pending deployment",
  },
  {
    lane: "Protocol oracle",
    source: "RedStone XTZ/USD",
    venue: "Etherlink adapter",
    pair: "XTZ / USD",
    price: 1.1812,
    unit: "USD",
    driftBps: 24,
    ageSeed: 7,
    status: "clear",
    detail: "Primary v0 WXTZ leg",
  },
  {
    lane: "Protocol oracle",
    source: "Pyth XTZ/USD",
    venue: "Hermes pull feed",
    pair: "XTZ / USD",
    price: 1.1769,
    unit: "USD",
    driftBps: -13,
    ageSeed: 9,
    status: "clear",
    detail: "Cross-check source",
  },
  {
    lane: "Protocol oracle",
    source: "Pyth USDC/USD",
    venue: "Feed to verify",
    pair: "USDC / USD",
    price: 0.9998,
    unit: "USD",
    driftBps: -2,
    ageSeed: 12,
    status: "watch",
    detail: "Use if reliable on Etherlink",
  },
  {
    lane: "Protocol oracle",
    source: "RedStone USDC/USD",
    venue: "Etherlink adapter",
    pair: "USDC / USD",
    price: null,
    unit: "USD",
    driftBps: null,
    ageSeed: 99,
    status: "blocked",
    detail: "Current adapter rejects USDC",
  },
  {
    lane: "DEX execution",
    source: "Curve Cryptoswap",
    venue: "Etherlink pool",
    pair: "WXTZ -> USDC",
    price: 1.164,
    unit: "USDC",
    driftBps: -122,
    ageSeed: 6,
    status: "watch",
    detail: "$1k executable quote",
  },
  {
    lane: "DEX execution",
    source: "KyberSwap route",
    venue: "Aggregator",
    pair: "WXTZ -> USDC",
    price: 1.158,
    unit: "USDC",
    driftBps: -173,
    ageSeed: 8,
    status: "watch",
    detail: "$5k liquidation route",
  },
  {
    lane: "DEX execution",
    source: "Oku route",
    venue: "Etherlink pool",
    pair: "WXTZ -> USDC",
    price: 1.1626,
    unit: "USDC",
    driftBps: -134,
    ageSeed: 16,
    status: "watch",
    detail: "Staleness gate active",
  },
  {
    lane: "CEX reference",
    source: "Coinbase XTZ-USD",
    venue: "Centralized venue",
    pair: "XTZ / USD",
    price: 1.1795,
    unit: "USD",
    driftBps: 9,
    ageSeed: 2,
    status: "clear",
    detail: "Off-chain reference",
  },
  {
    lane: "CEX reference",
    source: "Kraken XTZ/USD",
    venue: "Centralized venue",
    pair: "XTZ / USD",
    price: 1.1778,
    unit: "USD",
    driftBps: -5,
    ageSeed: 3,
    status: "clear",
    detail: "Off-chain reference",
  },
  {
    lane: "CEX reference",
    source: "Binance XTZ/USDT",
    venue: "Centralized venue",
    pair: "XTZ / USDT",
    price: 1.1801,
    unit: "USDT",
    driftBps: 14,
    ageSeed: 2,
    status: "clear",
    detail: "USDT-adjusted reference",
  },
  {
    lane: "Stablecoin peg",
    source: "USDC/USDT DEX peg",
    venue: "Curve/Oku monitor",
    pair: "USDC / USDT",
    price: 1.0003,
    unit: "USDT",
    driftBps: 3,
    ageSeed: 10,
    status: "clear",
    detail: "Loan-asset peg signal",
  },
];

const deviationBands = [
  { label: "RedStone vs Pyth XTZ", value: "36 bps", state: "clear" },
  { label: "DEX executable vs oracle", value: "-122 bps", state: "watch" },
  { label: "CEX median vs oracle", value: "+8 bps", state: "clear" },
  { label: "USDC peg drift", value: "3 bps", state: "clear" },
  { label: "Largest-size route", value: "adapter pending", state: "blocked" },
];

const laneOrder = ["Protocol oracle", "DEX execution", "CEX reference", "Stablecoin peg"];

export function NocDashboard({ revealClass = "" }) {
  const [lastSweep, setLastSweep] = useState(() => Date.now() - 4 * 60 * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      setLastSweep((previous) => current - previous >= SWEEP_INTERVAL_MS ? current : previous);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const elapsedMinutes = Math.max(0, Math.floor((now - lastSweep) / 60000));
  const nextSweepAt = lastSweep + SWEEP_INTERVAL_MS;
  const remainingSeconds = Math.max(0, Math.ceil((nextSweepAt - now) / 1000));
  const rows = useMemo(
    () => feedRows.map((feed) => ({ ...feed, ageMinutes: feed.ageSeed + elapsedMinutes })),
    [elapsedMinutes]
  );
  const summary = rows.reduce(
    (counts, row) => {
      const state = feedState(row);
      counts[state] += 1;
      return counts;
    },
    { clear: 0, watch: 0, blocked: 0 }
  );

  return (
    <section className="noc-section" id="noc" data-reveal="noc">
      <div className={`section-inner noc-shell ${revealClass}`}>
        <div className="noc-heading">
          <div>
            <div className="section-kicker">NOC dashboard</div>
            <h2 className="noc-title">Oracle, DEX, and CEX price watch.</h2>
            <p className="noc-copy">
              First-pass operations board for the WXTZ/USDC market. Every source is grouped by role, sampled on a 15 minute cadence, and flagged for staleness or unresolved adapter work.
            </p>
          </div>
          <div className="sweep-panel" aria-label="15 minute sweep status">
            <span>Cadence</span>
            <strong>{SWEEP_INTERVAL_MINUTES} min</strong>
            <small>Next sweep in {formatDuration(remainingSeconds)}</small>
          </div>
        </div>

        <div className="noc-status-grid" aria-label="Feed status summary">
          <NocStat label="Clear feeds" value={summary.clear} state="clear" />
          <NocStat label="Watch feeds" value={summary.watch} state="watch" />
          <NocStat label="Blocked feeds" value={summary.blocked} state="blocked" />
          <NocStat label="Last sweep" value={formatClock(lastSweep)} state="neutral" />
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
            {laneOrder.map((lane) => (
              <div className="feed-lane" key={lane}>
                <div className="feed-lane-title">{lane}</div>
                {rows.filter((row) => row.lane === lane).map((row) => (
                  <FeedRow key={`${row.lane}-${row.source}`} row={row} />
                ))}
              </div>
            ))}
          </div>

          <aside className="noc-side" aria-label="Deviation and incident watch">
            <div className="side-panel">
              <div className="side-panel-label">Deviation bands</div>
              {deviationBands.map((band) => (
                <div className="deviation-row" key={band.label}>
                  <span>{band.label}</span>
                  <strong className={`text-${band.state}`}>{band.value}</strong>
                </div>
              ))}
            </div>
            <div className="side-panel">
              <div className="side-panel-label">P0 watch list</div>
              <ul className="watch-list">
                <li>RedStone/Pyth freshness and XTZ spread.</li>
                <li>WXTZ to USDC executable liquidity at $1k, $5k, and $10k sizes.</li>
                <li>USDC/USD feed availability or explicit peg-assumption drift.</li>
                <li>Unsupported RedStone USDC path until adapter coverage changes.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function FeedRow({ row }) {
  const state = feedState(row);

  return (
    <div className={`feed-row feed-row-${state}`}>
      <div>
        <strong>{row.source}</strong>
        <small>{row.venue}</small>
      </div>
      <div>{row.pair}</div>
      <div className="feed-price">{formatPrice(row.price, row.unit)}</div>
      <div>{formatDrift(row.driftBps)}</div>
      <div>{row.ageMinutes}m</div>
      <div>
        <span className={`feed-state feed-state-${state}`}>{state}</span>
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

function feedState(row) {
  if (row.status === "blocked") return "blocked";
  if (row.ageMinutes > SWEEP_INTERVAL_MINUTES || Math.abs(row.driftBps ?? 0) >= 100) return "watch";
  return row.status;
}

function formatPrice(price, unit) {
  if (price === null) return "No feed";
  return `${price.toLocaleString("en-US", {
    minimumFractionDigits: price >= 10 ? 2 : 4,
    maximumFractionDigits: price >= 10 ? 2 : 4,
  })} ${unit}`;
}

function formatDrift(driftBps) {
  if (driftBps === null) return "n/a";
  const sign = driftBps > 0 ? "+" : "";
  return `${sign}${driftBps} bps`;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatClock(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}
