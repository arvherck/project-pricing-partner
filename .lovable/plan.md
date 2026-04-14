

# Rate Card Per Hour, Country Visibility, Weekly Breakdown, Invoicing Schedule

## Changes

### 1. Rate card per hour (not per day)
- Update `RateCardEditor` title to "Rate Card (per hour, local currency)"
- Update `rateCardDefaults.ts` values to hourly rates (divide current daily rates by 8)
- Update `calculations.ts`: change `billableDays * dailyRate` to `billableHours * hourlyRate` where billableHours = billableDays * 8
- Rename variables/labels from "daily rate" to "hourly rate" across types and UI

### 2. Show/hide countries in rate card
- Add a `visibleCountries: Country[]` state to `ProjectContext` (default: all countries), persisted in localStorage
- Add a multi-select checkbox dropdown in `RateCardEditor` header to toggle country visibility
- Filter the rate card table rows by `visibleCountries`

### 3. Weekly breakdown
- New `WeeklyBreakdown` component showing a table with columns: Week label, then one sub-column per resource showing billable days and cost that week
- Placed between Resources and Holiday Display sections
- Includes row totals per week and column totals per resource

### 4. Invoicing schedule
- New `InvoicingSchedule` component with an editable table matching the uploaded reference image
- Columns: Label (optional, e.g. "Start"), Invoicing Date (date picker), % of Total, Amount (auto-calculated from grand total × %), Working Days (auto-calculated from project data proportionally), Percentage of work delivered (auto-calculated or editable)
- "Add row" / "Remove row" buttons
- A totals row at the bottom summing % and Amount
- State stored in `ProjectContext` as `invoiceRows: { label: string, date: string, percentOfTotal: number }[]`
- Amount = afterBuffer (grand total post-adjustments) × percentOfTotal
- Working days distributed proportionally across invoice periods based on calendar weeks falling in each period

### Files to edit
- `src/lib/rateCardDefaults.ts` — divide rates by 8
- `src/lib/types.ts` — add `InvoiceRow` interface
- `src/lib/calculations.ts` — multiply billableDays by 8 for hours, compute price as hours × hourlyRate
- `src/context/ProjectContext.tsx` — add `visibleCountries`, `invoiceRows` state
- `src/components/RateCardEditor.tsx` — update title, add country visibility toggle
- `src/components/SummaryView.tsx` — update "daily" labels to "hourly"
- `src/components/WeeklyBreakdown.tsx` — new component
- `src/components/InvoicingSchedule.tsx` — new component
- `src/pages/Index.tsx` — add new components

