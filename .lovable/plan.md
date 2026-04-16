

# Visual Polish, Default Countries, Invoice Prefill, Decimal Rates, and Comprehensive PDF Export

## 1. Visual Improvements

**Theme update** (`src/index.css`): Shift to a modern, professional color scheme with a subtle blue-tinted primary, softer card borders, and slightly warmer backgrounds. Add subtle shadow to cards.

**Header redesign** (`src/pages/Index.tsx`): Add a gradient accent bar or colored header background. Improve spacing and typography hierarchy throughout.

**Card styling** (`src/index.css` + components): Add subtle `shadow-sm` and `hover:shadow` transitions to all Card components via a global CSS class or by updating the card component defaults.

**Spacing and typography polish**: Increase vertical spacing between sections, improve label/heading hierarchy, add section dividers.

## 2. Default Visible Countries: Sweden and Netherlands Only

**File**: `src/context/ProjectContext.tsx`

Change the default `visibleCountries` from `[...COUNTRIES]` to `['Netherlands', 'Sweden']`. Bump `STATE_VERSION` to 7 so existing users get the new default. Users can still toggle other countries on via the Countries popover in the Rate Card.

## 3. Prefill Invoicing Schedule

**File**: `src/components/InvoicingSchedule.tsx`

When `invoiceRows` is empty and both `startDate` and `endDate` are set, auto-generate invoice rows:
- One on the start date (or next working day)
- One on the 1st of each subsequent month within the project range (adjusted to next working day if it falls on weekend/holiday)
- One on the end date (or previous working day)

Working day adjustment checks weekends and public holidays of **all countries used by resources** in the project. The `percentOfTotal` is distributed evenly across rows (e.g., 6 invoices = ~16.67% each, rounded to sum to 100%).

This prefill runs once when the component detects empty rows + valid dates. Users can still add/remove/edit rows freely.

## 4. Allow 2 Decimal Places in Rate Card

**File**: `src/components/RateCardEditor.tsx`

- Change `parseInt(value) || 0` to `parseFloat(value) || 0` in `updateRate`
- Add `step="0.01"` to the rate card `Input` elements
- The rate card type is already `number`, so no type changes needed

## 5. Comprehensive PDF Export

**File**: `src/components/SummaryView.tsx`

Expand `exportPDF` to include multiple sections using `jspdf-autotable`:

1. **Project Setup**: Name, dates, total weeks, project currency
2. **Resources**: Table with name, seniority, country, allocation %, vacation days count, hourly rate
3. **Weekly Breakdown**: Table with weeks as rows, resources as columns showing days and cost (converted to target currency)
4. **Summary**: Current resource cost table + subtotal/COLA/buffer/grand total
5. **Invoicing Schedule**: Table with label, date, % of total, amount, working days, % work delivered
6. **Exchange Rates**: Table showing EUR-based rates for all currencies in use, marking custom overrides

Each section starts with a heading. Page breaks are inserted between major sections to avoid overflow.

## Files to Edit

| File | Changes |
|------|---------|
| `src/index.css` | Updated color palette, card shadows, subtle gradients |
| `src/context/ProjectContext.tsx` | Default `visibleCountries` = `['Netherlands', 'Sweden']`, bump version to 7 |
| `src/pages/Index.tsx` | Header visual refresh, card gap/spacing |
| `src/components/RateCardEditor.tsx` | `parseFloat` + `step="0.01"` for decimal rates |
| `src/components/InvoicingSchedule.tsx` | Auto-prefill logic when rows empty + dates set |
| `src/components/SummaryView.tsx` | Expanded PDF with all 6 sections |

## Technical Details

**Invoice prefill working-day logic**: Collect holidays from all resource countries. For start-of-month dates, shift forward to the next weekday that is not a holiday in any project country. For the end date, shift backward similarly. Use `eachDayOfInterval`, `isWeekend`, and `isHoliday` from existing utils.

**PDF layout**: Use `jspdf-autotable` for all tables. Track `doc.lastAutoTable.finalY` to position each section. Call `doc.addPage()` when `finalY` exceeds ~250 to prevent overflow.

