import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "sales-funnel-analyzer",
  title: "Sales Funnel Analyzer",
  description:
    "Find the largest conversion losses across comparable sales cohorts.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Use unique people from the same cohort and measurement window. Counts must decrease or stay equal through the funnel. Rates with zero denominators are N/A. The largest loss is an absolute count, not proof of its cause.",
  port: 4424,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Cohort / campaign name",
      type: "text",
    },
    {
      key: "visitors",
      label: "Visitors",
      type: "number",
      min: 0,
      max: 100000000,
      integer: true,
    },
    {
      key: "leads",
      label: "Leads",
      type: "number",
      min: 0,
      max: 100000000,
      integer: true,
    },
    {
      key: "qualified",
      label: "Qualified leads",
      type: "number",
      min: 0,
      max: 100000000,
      integer: true,
    },
    {
      key: "quotes",
      label: "Quotes",
      type: "number",
      min: 0,
      max: 100000000,
      integer: true,
    },
    {
      key: "sales",
      label: "Sales",
      type: "number",
      min: 0,
      max: 100000000,
      integer: true,
    },
    {
      key: "revenue",
      label: "Sales revenue",
      type: "number",
      min: 0,
      max: 100000000,
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "targetLeadRate",
      label: "Target visitor-to-lead rate (%)",
      type: "number",
      min: 0,
      max: 100,
    },
  ],
  actions: [],
  document: false,
};
config.validate = function validate(records) {
  for (const r of records) {
    if (!(
      r.visitors >= r.leads &&
      r.leads >= r.qualified &&
      r.qualified >= r.quotes &&
      r.quotes >= r.sales
    ))
      throw new Error("Funnel counts must not increase at later stages");
    if (r.sales === 0 && r.revenue > 0)
      throw new Error("Revenue requires at least one sale");
  }
};
export const example = {
  schemaVersion: 1,
  project: "sales-funnel-analyzer",
  settings: {
    currency: "USD",
    targetLeadRate: 5,
  },
  records: [
    {
      id: "cohort-1",
      name: "October search cohort",
      visitors: 1000,
      leads: 100,
      qualified: 60,
      quotes: 30,
      sales: 10,
      revenue: 10000,
    },
    {
      id: "cohort-2",
      name: "October referral cohort",
      visitors: 200,
      leads: 40,
      qualified: 20,
      quotes: 10,
      sales: 5,
      revenue: 7500,
    },
  ],
};
export function analyze(records, s) {
  const visitors = sum(records.map((r) => r.visitors)),
    leads = sum(records.map((r) => r.leads)),
    sales = sum(records.map((r) => r.sales));
  return {
    metrics: [
      metric("Visitors", visitors),
      metric("Lead-to-sale rate (%)", ratio(sales, leads)),
      metric(
        "Recorded revenue",
        money(sum(records.map((r) => r.revenue))),
        s.currency,
      ),
    ],
    notices: records
      .filter(
        (r) => r.visitors > 0 && ratio(r.leads, r.visitors) < s.targetLeadRate,
      )
      .map((r) =>
        notice(
          r.id,
          `${r.name}: visitor-to-lead conversion is below your target.`,
          "warning",
        ),
      ),
    columns: [
      "Cohort",
      "Visitor → lead (%)",
      "Lead → sale (%)",
      "Largest absolute loss",
    ],
    rows: records.map((r) => {
      const losses = [
        ["Visitor → lead", r.visitors - r.leads],
        ["Lead → qualified", r.leads - r.qualified],
        ["Qualified → quote", r.qualified - r.quotes],
        ["Quote → sale", r.quotes - r.sales],
      ].sort((a, b) => b[1] - a[1]);
      return {
        id: r.id,
        Cohort: r.name,
        "Visitor → lead (%)": ratio(r.leads, r.visitors) ?? "N/A",
        "Lead → sale (%)": ratio(r.sales, r.leads) ?? "N/A",
        "Largest absolute loss": `${losses[0][0]}: ${losses[0][1]}`,
      };
    }),
  };
}
