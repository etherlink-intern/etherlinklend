# Audits And Reviews

## Purpose

Store upstream audits, fork-diff audits, internal reviews, external reviews, and incident research here. `audits/upstream/` is reserved for pointers or copies when licenses permit.

## Required Reviews Before Launch

Before mainnet launch, the Etherlink Morpho deployment MUST complete:

- Upstream audit review.
- Fork-diff review.
- Deployment-script review.
- Oracle-adapter review.
- Market-configuration review.
- External audit.

Internal review does not replace external audit for production deployment.

## Incident Research

TODO:

- Owner: TODO security reviewer.
- Action: collect and summarize the reported Superlend Etherlink incident.
- Date: TODO before external audit.

The incident summary SHOULD specifically extract lessons on:

- Rounding behavior.
- BTC market configuration.
- Repeated low-cost transactions.
- Oracle or decimals assumptions.
- Wind-down process, if available.

## Finding Tracker Format

Use this format for findings:

| ID | Severity | Component | Description | Status | Owner | Fix PR | Retest status |
|---|---|---|---|---|---|---|---|
| TODO-001 | TODO | TODO | TODO | Open | TODO | TODO | Not retested |

Severity values: critical, high, medium, low, informational.

No mainnet deployment MAY proceed with unresolved critical or high findings.
