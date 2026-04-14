

# Fix Invoicing "% Work Delivered" and Vacation Date UX

## Changes

### 1. Invoicing Schedule: Fix "% Work Delivered" and cap total at 100%

**Problem**: "% Work Delivered" currently equals "% of Total" (it's just `workingDays / totalWorkingDays * 100`, which mirrors the input). It should reflect cumulative time elapsed up to each invoice date relative to project duration.

**Fix in `src/components/InvoicingSchedule.tsx`**:
- For each invoice row (sorted by date), calculate how many working days have elapsed from project start to that invoice's date, divided by total project working days. This gives the cumulative "% of work delivered" at each milestone.
- Use `eachDayOfInterval` from project start to invoice date, filtering out weekends, holidays, and program vacation weeks, to count elapsed working days.
- Cap "% of Total" input: when user types a value, clamp it so that the sum of all rows never exceeds 100%. Show a warning or auto-clamp to `100 - sumOfOtherRows`.
- Show the total row's "% of Total" in red if it exceeds 100%.

### 2. Resource Vacation Calendar: Disable program vacation dates

**Problem**: Users can currently select dates that fall within program-level vacation weeks, leading to double-counting.

**Fix in `src/components/ResourceManager.tsx`**:
- Pass `programVacationWeeks` and `weeks` (project weeks) to `ResourceCard`.
- Compute a set of disabled dates: all weekdays that fall within program vacation weeks.
- Pass these as `disabled` dates to the `Calendar` component so they appear greyed out and unclickable.
- Add a small legend/note below the calendar: "Greyed-out dates are program vacation weeks."
- If a resource already has vacation dates that overlap with program vacation weeks (from before), filter them out on render.

## Files to Edit
- `src/components/InvoicingSchedule.tsx` — calculate cumulative work delivered based on elapsed working days; cap % of total at 100%
- `src/components/ResourceManager.tsx` — disable program vacation week dates in calendar, add legend

