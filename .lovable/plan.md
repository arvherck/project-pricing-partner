

# Project Pricing Calculator for Consulting Projects

## Overview
A single-page application for calculating consulting project costs based on resources, seniority-based rate cards, country-specific public holidays, and adjustable price buffers.

## Pages & Layout
One main page with a clean, professional layout using a tabbed or sectioned vertical flow:

### Section 1: Project Setup
- Input fields for project name, start date (datepicker), and end date (datepicker)
- Auto-calculated display of total project weeks

### Section 2: Rate Card
- Editable table: rows = seniority levels (Junior, Mid, Senior, Principal, Partner), columns = countries (Netherlands, Belgium, Germany, UK, Sweden, USA)
- Cells show daily rates in EUR, editable inline
- Sensible defaults pre-filled

### Section 3: Resources
- "Add Resource" button to add team members
- Each resource card/row includes:
  - Name/role text input
  - Seniority dropdown
  - Country dropdown
  - Allocation % slider or input (0–100%)
  - Vacation week selector (multi-select from project week list, with week number + date range labels)
  - Calculated fields: working days, total cost
- Remove resource button

### Section 4: Price Adjustments
- Toggle switches for:
  - COLA uplift (2.5%) with before/after display
  - Fixed price buffer (10%) with before/after display

### Section 5: Summary
- Summary table: resource name, role, country, working days, total cost
- Grand total (pre-adjustments and post-adjustments)
- Total project working days across all resources
- Export buttons for CSV and PDF download

## Key Logic
- **Public holidays**: Built-in holiday data for NL, BE, DE, UK, SE, US (including Easter-based movable holidays) calculated for any year in the project range
- **Working days per resource**: For each week, calculate billable days = 5 × allocation% minus any public holidays falling in that week; skip vacation weeks entirely
- **Weekly price**: billable days in that week × daily rate
- **Total price**: sum of all weekly prices per resource
- **Adjustments**: applied on top of grand total, stackable

## Data Persistence
- All inputs saved to localStorage, restored on page reload

## Tech
- React + TypeScript + Tailwind + shadcn/ui components
- date-fns for date calculations
- jsPDF for PDF export, native CSV generation
- No backend needed — all client-side

