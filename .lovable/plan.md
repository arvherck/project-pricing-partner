

# Fix Currency Recalculation, Add Currency Labels, and Date-Based Vacations

## Problem Summary
1. **Custom exchange rates don't propagate**: `mergeRates` only overwrites the `EUR_X` key, but `convertCurrency` looks up cross-rate keys like `SEK_EUR`, `GBP_USD`, etc. These aren't recalculated from the updated EUR base.
2. **PriceAdjustments lacks currency context**: The `grandTotal` passed to it is a sum of raw local-currency prices (not converted), and no currency symbol is shown.
3. **Vacation UX is week-checkbox-based**: Users want to pick specific dates (possibly non-contiguous) rather than toggling week indices.

## Changes

### 1. Fix currency rate propagation (`src/lib/currencyRates.ts`)
- Change `mergeRates` to: extract EUR-based rates from fetched, overlay custom `EUR_X` overrides, then **rebuild all cross rates** via `buildCrossRates`. This ensures changing `EUR_SEK` also updates `SEK_EUR`, `SEK_GBP`, etc.

### 2. Fix grandTotal in Index.tsx to use converted prices
- In `PricingCalculator`, fetch rates and convert each resource's local price to `targetCurrency` before summing for `grandTotal`
- Pass `targetCurrency` info to `PriceAdjustments`

### 3. Add currency symbol to PriceAdjustments (`src/components/PriceAdjustments.tsx`)
- Accept `targetCurrency` as a prop (or read from context)
- Show the currency symbol in all displayed amounts (COLA preview, buffer preview, adjusted grand total)

### 4. Date-based vacations per resource
- Change `Resource.vacationWeeks: number[]` to `Resource.vacationDates: string[]` (array of ISO date strings) in `src/lib/types.ts`
- Update `src/lib/calculations.ts`: instead of checking if a week index is in vacationWeeks, check if each working day falls on a vacation date
- Update `ResourceManager.tsx`: replace the week-checkbox popover with a multi-date calendar picker where users can click individual dates
- Keep `programVacationWeeks` as week-based (program-level shutdowns are naturally full weeks)
- Bump `STATE_VERSION` in context

### Files to Edit
- `src/lib/currencyRates.ts` — fix `mergeRates` to rebuild cross rates
- `src/lib/types.ts` — change `vacationWeeks` to `vacationDates: string[]`
- `src/lib/calculations.ts` — update vacation logic to use dates instead of week indices
- `src/context/ProjectContext.tsx` — bump version, update default resource shape
- `src/pages/Index.tsx` — compute `grandTotal` using converted prices, pass currency to PriceAdjustments
- `src/components/PriceAdjustments.tsx` — show target currency symbol everywhere
- `src/components/ResourceManager.tsx` — replace week checkboxes with a date-picker calendar for vacation dates

