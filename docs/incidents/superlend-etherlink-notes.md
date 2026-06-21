# Superlend Etherlink Incident Notes

## Status

Research TODO. This file intentionally does not assert final facts.

## Current Working Context

A prior Etherlink lending deployment reportedly used an Aave V3-style or Aave-friendly fork and suffered a rounding-related incident affecting BTC markets. This project is not forking Superlend.

The incident is treated as a warning that forked lending protocols can fail from configuration, rounding, oracle, token, liquidity, or market-specific assumptions even when an upstream protocol is mature.

## Research Questions

- What was the exact affected market?
- Was the root cause rounding, decimals, oracle scaling, liquidation, or another factor?
- Were repeated low-cost transactions involved?
- What assets and wrappers were involved?
- What was the wind-down process?
- What controls existed and what controls were missing?
- What test would have caught the issue?

## Required Output Before Launch

- Timeline.
- Root cause.
- Affected markets.
- Impact.
- Lessons for Morpho Blue isolated markets.
- Required invariant tests.
- Required market review changes.

## Blocking TODO

- Owner: TODO security reviewer.
- Action: collect primary incident report, credible analysis, and any wind-down notes.
- Date: TODO before external audit.
