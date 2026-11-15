import test from "node:test";
import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
test("Documented sample results match independently specified expectations", () => {
  const report = analyze(example.records, example.settings, config.asOf);
  for (const [label, value] of [
    ["Visitors", 1200],
    ["Lead-to-sale rate (%)", 10.71],
    ["Recorded revenue", "17500.00"],
  ])
    assert.equal(
      report.metrics.find((m) => m.label === label).value,
      value,
      label,
    );
});
test("Business edge cases", () => {
  (function edge(records, s, analyze, validate) {
    assert.equal(
      analyze(
        [
          {
            ...records[0],
            visitors: 0,
            leads: 0,
            qualified: 0,
            quotes: 0,
            sales: 0,
            revenue: 0,
          },
        ],
        s,
      ).rows[0]["Lead → sale (%)"],
      "N/A",
    );
    assert.throws(
      () =>
        validate(
          { ...example, records: [{ ...records[0], quotes: 200 }] },
          config,
        ),
      /Funnel/,
    );
  })(example.records, example.settings, analyze, validateState);
});
