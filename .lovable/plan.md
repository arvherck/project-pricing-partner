

# Fix Currency Consistency and Add Editable Rates

## Problem
1. The Weekly Breakdown sums costs in mixed currencies (e.g., EUR + SEK) without converting — the "Total" column is nonsensical when resources span multiple currencies.
2. The target/invoicing currency selector is buried in the Summary section — it should be set upfront in Project Setup.
3. Users cannot manually adjust exchange rates.

## Changes

### 1. Move Target Currency to Project Setup (`src/components/ProjectSetup.tsx`)
- Add a "Project Currency" dropdown next to Project Name / dates
- This uses the existing `targetCurrency` / `setTargetCurrency` from context
- Remove the currency selector from `SummaryView.tsx` header (it stays read-only there, showing the chosen currency)

### 2. Weekly Breakdown: Convert all costs to target currency (`src/components/WeeklyBreakdown.tsx`)
- Fetch exchange rates (same `fetchECBRates` call)
- Read `targetCurrency` from context
- For each resource's weekly cost, convert from `COUNTRY_CURRENCY[resource.country]` to `targetCurrency` using `convertCurrency()`
- Display the target currency symbol in headers and totals instead of each resource's local currency
- The "Total" column now correctly sums converted amounts

### 3. Editable Exchange Rates (`src/context/ProjectContext.tsx`, new UI in `SummaryView.tsx`)
- Add `customRates: Record<string, number | null>` to context (keyed like `EUR_SEK`), persisted in localStorage
- When a custom rate is set, it overrides the fetched rate
- In `SummaryView.tsx` exchange rates section, make each rate an editable input field with a "Reset to API" button
- Pass merged rates (custom overrides on top of fetched) through to all components that use `convertCurrency`
- Create a helper in context or a hook that provides the final merged rates, so `WeeklyBreakdown`, `SummaryView`, `InvoicingSchedule`, and `PriceAdjustments` all use the same source

### 4. Update InvoicingSchedule (`src/components/InvoicingSchedule.tsx`)
- Ensure it also uses the target currency and converted grand total (it likely already does via its own calculation, but verify consistency)

## Files to Edit
- `src/context/ProjectContext.tsx` — add `customRates` state, bump state version
- `src/components/ProjectSetup.tsx` — add target currency selector
- `src/components/WeeklyBreakdown.tsx` — convert costs to target currency
- `src/components/SummaryView.tsx` — make exchange rates editable, remove currency selector from header
- `src/components/InvoicingSchedule.tsx` — ensure target currency consistency
- `src/lib/currencyRates.ts` — add a `mergeRates` helper to overlay custom rates on fetched rates

