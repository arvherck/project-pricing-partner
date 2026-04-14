

# Expand Countries, Add Flags, Transpose Rate Card, Program Vacation, Holiday Display, Currency Rates

## Overview
Six enhancements to the pricing calculator: expand to 17 countries with flags, transpose the rate card, add program-level vacation, display public holidays, show currency rates, and expand currency support.

## Changes

### 1. Expand Countries & Currencies (`src/lib/types.ts`)
- Add all 17 countries: Netherlands, Sweden, Denmark, Switzerland, UK, France, Italy, Spain, Portugal, Poland, Belgium, Germany, Russia, US, Canada, Mexico, India, China
- Add currencies: DKK, CHF, RUB, CAD, MXN, INR, CNY
- Update `COUNTRY_CURRENCY`, `CURRENCY_SYMBOLS`, `ALL_CURRENCIES`
- Add a `COUNTRY_FLAGS` map using emoji flags (🇳🇱, 🇸🇪, 🇩🇰, 🇨🇭, 🇬🇧, 🇫🇷, 🇮🇹, 🇪🇸, 🇵🇹, 🇵🇱, 🇧🇪, 🇩🇪, 🇷🇺, 🇺🇸, 🇨🇦, 🇲🇽, 🇮🇳, 🇨🇳)

### 2. Expand Holidays (`src/lib/holidays.ts`)
- Add holiday definitions for Denmark, Switzerland, France, Italy, Spain, Portugal, Poland, Russia, Canada, Mexico, India, China
- Export a `getHolidayName` function that returns `{ date, name }[]` so holidays can be displayed by name (e.g., "Midsommar", "Bastille Day")

### 3. Expand Default Rate Card (`src/lib/rateCardDefaults.ts`)
- Add default daily rates for all 17 countries in their local currencies

### 4. Expand Currency Rates (`src/lib/currencyRates.ts`)
- Add DKK, CHF, RUB, CAD, MXN, INR, CNY to fallback rates and fetch logic

### 5. Transpose Rate Card (`src/components/RateCardEditor.tsx`)
- Rows = countries (with flag emoji), Columns = seniority levels
- Each cell shows the rate in the country's local currency

### 6. Program-Level Vacation (`src/context/ProjectContext.tsx`, `src/components/ProjectSetup.tsx` or new `ProgramVacation` component)
- Add `programVacationWeeks: number[]` to context/state
- Add a vacation week selector in the Project Setup or a dedicated section below it
- In `calculations.ts`, merge program vacation weeks with per-resource vacation weeks when computing billable days

### 7. Public Holiday Display (new `src/components/HolidayDisplay.tsx`)
- Show a collapsible section listing public holidays per country within the project date range
- Display holiday name and date, grouped by country with flag
- Only show countries that are used by at least one resource

### 8. Currency Rates Display (new section or component in Summary)
- Show a small table of applied exchange rates (base EUR) for all currencies in use
- Display the rates fetched from the API (or fallback rates)

### 9. Update Resource Manager & Summary
- Show flag emoji next to country in resource cards, summary table, and dropdowns
- Ensure the country dropdown includes all 17 countries with flags

### 10. LocalStorage Migration
- Clear/reset saved state when country list changes (detect via validation in `loadState`)

## Files to Create/Edit
- `src/lib/types.ts` — expand types and constants
- `src/lib/holidays.ts` — add 11 new country holiday sets + named holidays
- `src/lib/rateCardDefaults.ts` — expand defaults
- `src/lib/currencyRates.ts` — expand currencies
- `src/lib/calculations.ts` — merge program vacation
- `src/context/ProjectContext.tsx` — add `programVacationWeeks` state
- `src/components/RateCardEditor.tsx` — transpose table, add flags
- `src/components/ProjectSetup.tsx` — add program vacation selector
- `src/components/ResourceManager.tsx` — add flags to dropdowns
- `src/components/SummaryView.tsx` — add flags, currency rates display
- `src/components/HolidayDisplay.tsx` — new component for holiday list
- `src/pages/Index.tsx` — add HolidayDisplay component

