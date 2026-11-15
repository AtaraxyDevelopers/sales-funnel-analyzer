import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
// Increase recorded sales in the first cohort from 10 to 15.
// This changes a copy of fictional data; no files or external services are changed.
const workspace = structuredClone(example);
Object.assign(workspace.records[0], { sales: 15 });
const valid = validateState(workspace, config);
const report = analyze(valid.records, valid.settings, config.asOf);
const actual = report.metrics.find(
  (metric) => metric.label === "Lead-to-sale rate (%)",
).value;
assert.equal(actual, 14.29);
console.log("Lead-to-sale rate (%): " + actual);
