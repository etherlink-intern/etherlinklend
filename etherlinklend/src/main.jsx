import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const e = React.createElement;
    const market = {
      wxtzPrice: 1.18,
      liquidationLtv: 72,
      maxBorrowLtv: 63,
      borrowApy: 6.8,
      oracle: "Medianized",
      utilization: 41,
    };

    function formatUsd(value, maximumFractionDigits = 0) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits,
      }).format(value);
    }

    function App() {
      const [collateral, setCollateral] = useState(4200);
      const [riskMode, setRiskMode] = useState("balanced");
      const [visibleSections, setVisibleSections] = useState(new Set(["hero"]));

      const loan = useMemo(() => {
        const collateralValue = collateral * market.wxtzPrice;
        const modeLtv = riskMode === "conservative" ? 38 : riskMode === "balanced" ? 50 : 61;
        const borrow = Math.round(collateralValue * (modeLtv / 100));
        const liquidationAt = borrow / (market.liquidationLtv / 100);
        const buffer = Math.max(0, Math.round(((collateralValue - liquidationAt) / collateralValue) * 100));
        const monthlyInterest = borrow * (market.borrowApy / 100) / 12;
        return { collateralValue, modeLtv, borrow, liquidationAt, buffer, monthlyInterest };
      }, [collateral, riskMode]);

      useEffect(() => {
        const sections = Array.from(document.querySelectorAll("[data-reveal]"));
        const observer = new IntersectionObserver((entries) => {
          setVisibleSections((current) => {
            const next = new Set(current);
            entries.forEach((entry) => {
              if (entry.isIntersecting) next.add(entry.target.dataset.reveal);
            });
            return next;
          });
        }, { threshold: 0.18 });
        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
      }, []);

      function revealClass(id) {
        return `fade-in${visibleSections.has(id) ? " visible" : ""}`;
      }

      return e("main", { className: "app-shell" },
        e(Header),
        e("section", { className: "hero", id: "top" },
          e("div", { className: "hero-inner" },
            e("div", { className: "hero-copy" },
              e("div", { className: "eyebrow" }, "Etherlink lending market"),
              e("h1", null, "Borrow USDC against WXTZ with risk controls in view."),
              e("p", { className: "hero-lede" }, "EtherLinkLend brings isolated-market lending to Etherlink with a retail-first path to WXTZ-backed USDC borrowing."),
              e("div", { className: "hero-actions" },
                e("a", { className: "btn btn-primary", href: "#coming-soon" }, "Coming soon", e("span", { "aria-hidden": "true" }, "->")),
                e("a", { className: "btn btn-secondary", href: "#preview" }, "Preview app")
              ),
              e("div", { className: "proof-row", "aria-label": "Market highlights" },
                e(ProofItem, { value: "WXTZ", label: "Collateral asset" }),
                e(ProofItem, { value: "USDC", label: "Borrow asset" }),
                e(ProofItem, { value: "Isolated", label: "First market design" })
              )
            ),
            e("div", { className: "terminal-wrap", "aria-label": "EtherLinkLend app preview" },
              e(AppPreview, { loan })
            )
          )
        ),
        e("section", { className: "section", id: "preview", "data-reveal": "preview" },
          e("div", { className: `section-inner teaser-layout ${revealClass("preview")}` },
            e("div", null,
              e("div", { className: "section-kicker" }, "App teaser"),
              e("h2", { className: "section-heading" }, "Size a borrow position before connecting a wallet."),
              e("p", { className: "section-copy" }, "Use the preview to model collateral value, borrowing power, and liquidation buffer with the same labels the app will use."),
              e("div", { className: "controls-panel" },
                e("div", { className: "control-group" },
                  e("div", { className: "control-label" },
                    e("span", null, "WXTZ collateral"),
                    e("strong", null, collateral.toLocaleString("en-US"), " WXTZ")
                  ),
                  e("input", {
                    type: "range",
                    min: "500",
                    max: "10000",
                    step: "100",
                    value: collateral,
                    "aria-label": "WXTZ collateral amount",
                    onChange: (event) => setCollateral(Number(event.target.value)),
                  })
                ),
                e("div", { className: "control-group" },
                  e("div", { className: "control-label" },
                    e("span", null, "Risk posture"),
                    e("strong", null, `${loan.modeLtv}% LTV`)
                  ),
                  e("div", { className: "segmented", role: "tablist", "aria-label": "Risk posture" },
                    ["conservative", "balanced", "active"].map((mode) =>
                      e("button", {
                        key: mode,
                        className: `segment${riskMode === mode ? " active" : ""}`,
                        type: "button",
                        onClick: () => setRiskMode(mode),
                      }, mode[0].toUpperCase() + mode.slice(1))
                    )
                  )
                )
              )
            ),
            e(LoanCard, { collateral, loan })
          )
        ),
        e("section", { className: "section", id: "safety", "data-reveal": "safety" },
          e("div", { className: `section-inner ${revealClass("safety")}` },
            e("div", { className: "section-kicker" }, "Market safeguards"),
            e("h2", { className: "section-heading" }, "Designed around transparency before leverage."),
            e("p", { className: "section-copy" }, "The first market keeps the scope narrow: one collateral asset, one borrow asset, visible oracle state, and health data where borrowers need it."),
            e("div", { className: "safety-grid" },
              e(SafetyItem, { index: "01", title: "Isolated WXTZ market", body: "Borrowing risk is contained to the WXTZ/USDC market instead of pooled across unrelated collateral types." }),
              e(SafetyItem, { index: "02", title: "Health-first interface", body: "Collateral ratio, borrow limit, liquidation threshold, and buffer are surfaced before confirmation." }),
              e(SafetyItem, { index: "03", title: "Oracle visibility", body: "Market status includes oracle mode, utilization, and risk parameters as first-class data points." })
            )
          )
        ),
        e("section", { className: "dark-band", id: "flow", "data-reveal": "flow" },
          e("div", { className: `section-inner dark-grid ${revealClass("flow")}` },
            e("div", null,
              e("div", { className: "section-kicker" }, "Borrowing flow"),
              e("h2", { className: "section-heading" }, "A focused path from collateral to stablecoin liquidity."),
              e("p", { className: "section-copy" }, "EtherLinkLend will prioritize a small number of critical decisions instead of hiding risk behind a generic borrow button.")
            ),
            e("div", { className: "steps" },
              e(Step, { n: "1", title: "Deposit WXTZ", body: "Choose collateral amount and see its current oracle value on Etherlink." }),
              e(Step, { n: "2", title: "Select USDC borrow size", body: "Review borrowing power, liquidation threshold, and buffer before any transaction." }),
              e(Step, { n: "3", title: "Monitor position health", body: "Track debt, collateral value, utilization, and risk state from a single market view." })
            )
          )
        ),
        e("section", { className: "coming-soon", id: "coming-soon", "data-reveal": "coming-soon" },
          e("div", { className: `section-inner coming-soon-box ${revealClass("coming-soon")}` },
            e("div", null,
              e("div", { className: "section-kicker" }, "Coming soon"),
              e("h2", null, "The first WXTZ-backed USDC market is in preparation."),
              e("p", null, "EtherLinkLend is moving toward a focused launch with borrow previews, market health, and risk controls ready before launch.")
            ),
            e("div", { className: "soon-panel", role: "status", "aria-label": "Launch status" },
              e("span", { className: "soon-label" }, "Launch status"),
              e("strong", { className: "soon-value" }, "Coming soon"),
              e("p", { className: "soon-note" }, "The app teaser remains available so users can understand the intended WXTZ to USDC borrowing experience before launch."),
              e("ul", { className: "soon-list" },
                e("li", null, e("span", null, "Market"), e("strong", null, "WXTZ / USDC")),
                e("li", null, e("span", null, "Network"), e("strong", null, "Etherlink")),
                e("li", null, e("span", null, "Access"), e("strong", null, "Not live yet"))
              )
            )
          )
        ),
        e("footer", { className: "footer" },
          e("div", { className: "footer-inner" },
            e("span", null, "EtherLinkLend"),
            e("span", null, "Security-first lending market on Etherlink")
          )
        )
      );
    }

    function Header() {
      return e("header", { className: "site-header" },
        e("div", { className: "header-inner" },
          e("a", { className: "brand", href: "#top", "aria-label": "EtherLinkLend home" },
            e("img", { className: "brand-mark", src: "resources/etherlinklend-mark.svg", alt: "" }),
            e("span", null, "EtherLinkLend")
          ),
          e("nav", { className: "nav-links", "aria-label": "Primary navigation" },
            e("a", { href: "#preview" }, "Preview"),
            e("a", { href: "#safety" }, "Risk"),
            e("a", { href: "#flow" }, "Flow")
          ),
          e("div", { className: "header-actions" },
            e("span", { className: "network-pill" }, "Shadownet"),
            e("span", { className: "network-pill" }, e("span", { className: "status-dot" }), "Etherlink"),
            e("a", { className: "btn btn-primary", href: "#coming-soon" }, "Coming soon")
          )
        )
      );
    }

    function ProofItem({ value, label }) {
      return e("div", { className: "proof-item" },
        e("span", { className: "proof-value" }, value),
        e("span", { className: "proof-label" }, label)
      );
    }

    function AppPreview({ loan }) {
      return e("div", { className: "app-preview" },
        e("div", { className: "preview-topbar" },
          e("div", { className: "window-dots", "aria-hidden": "true" }, e("span"), e("span"), e("span")),
          e("div", { className: "preview-title" }, "Borrow console"),
          e("div", { className: "preview-title" }, "Testnet preview")
        ),
        e("div", { className: "preview-body" },
          e("div", { className: "market-head" },
            e("div", null,
              e("div", { className: "pair-label" }, "Isolated market"),
              e("div", { className: "pair-title" }, "WXTZ / USDC")
            ),
            e("div", { className: "health-badge" }, e("span", { className: "status-dot" }), "Healthy")
          ),
          e("div", { className: "preview-grid" },
            e(DarkMetric, { label: "Borrow APY", value: `${market.borrowApy.toFixed(1)}%` }),
            e(DarkMetric, { label: "Utilization", value: `${market.utilization}%` }),
            e(DarkMetric, { label: "Oracle", value: market.oracle }),
            e(DarkMetric, { label: "Max LTV", value: `${market.maxBorrowLtv}%` })
          ),
          e("div", { className: "borrow-panel" },
            e("div", { className: "field-row" },
              e("div", { className: "field-copy" }, e("span", null, "Collateral"), e("strong", null, formatUsd(loan.collateralValue))),
              e("div", { className: "token-pill" }, "WXTZ")
            ),
            e("div", { className: "field-row" },
              e("div", { className: "field-copy" }, e("span", null, "Borrowing"), e("strong", null, formatUsd(loan.borrow))),
              e("div", { className: "token-pill" }, "USDC")
            ),
            e("div", { className: "risk-bar" },
              e("div", { className: "risk-meta" },
                e("span", null, "Position LTV"),
                e("span", null, `${loan.modeLtv}%`)
              ),
              e("div", { className: "bar-track" }, e("div", { className: "bar-fill", style: { width: `${loan.modeLtv}%` } }))
            )
          ),
          e("div", { className: "preview-foot" },
            e("span", null, "Liquidation LTV ", market.liquidationLtv, "%"),
            e("span", null, "Buffer ", loan.buffer, "%")
          )
        )
      );
    }

    function DarkMetric({ label, value }) {
      return e("div", { className: "metric-cell" },
        e("div", { className: "metric-label" }, label),
        e("div", { className: "metric-value" }, value)
      );
    }

    function LoanCard({ collateral, loan }) {
      return e("div", { className: "loan-card" },
        e("div", { className: "loan-top" },
          e("div", null, e("strong", null, "Borrow preview"), e("br"), e("span", null, "Retail flow prototype")),
          e("span", { className: "health-badge" }, e("span", { className: "status-dot" }), "Model only")
        ),
        e("div", { className: "loan-body" },
          e("div", { className: "loan-summary" },
            e(LightMetric, { label: "Collateral value", value: formatUsd(loan.collateralValue) }),
            e(LightMetric, { label: "USDC borrow", value: formatUsd(loan.borrow) })
          ),
          e("div", { className: "position-table" },
            e(Row, { label: "WXTZ supplied", value: `${collateral.toLocaleString("en-US")} WXTZ` }),
            e(Row, { label: "Borrow LTV", value: `${loan.modeLtv}%` }),
            e(Row, { label: "Liquidation value", value: formatUsd(loan.liquidationAt) }),
            e(Row, { label: "Estimated monthly interest", value: formatUsd(loan.monthlyInterest, 2) }),
            e(Row, { label: "Health buffer", value: `${loan.buffer}%` })
          )
        )
      );
    }

    function LightMetric({ label, value }) {
      return e("div", { className: "light-metric" },
        e("span", null, label),
        e("strong", null, value)
      );
    }

    function Row({ label, value }) {
      return e("div", { className: "table-row" },
        e("span", null, label),
        e("strong", null, value)
      );
    }

    function SafetyItem({ index, title, body }) {
      return e("article", { className: "safety-item" },
        e("span", { className: "safety-index" }, index),
        e("h3", null, title),
        e("p", null, body)
      );
    }

    function Step({ n, title, body }) {
      return e("div", { className: "step" },
        e("div", { className: "step-num" }, n),
        e("div", null, e("h3", null, title), e("p", null, body))
      );
    }

    createRoot(document.getElementById("root")).render(e(App));
