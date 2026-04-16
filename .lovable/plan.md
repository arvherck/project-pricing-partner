

# All Suggested Improvements — Implementation Plan

## 1. Multi-Project Management

**What**: Let users save, load, and switch between named project configurations. A dropdown in the header lists saved projects. "New Project" and "Delete" actions are available.

**How**:
- Store an array of project slots in `localStorage` under a separate key (`pricing-calculator-projects`), each with a unique ID, a name, and the full state blob.
- Add `saveProject`, `loadProject`, `deleteProject`, `newProject` functions to `ProjectContext`.
- Add a `Select` dropdown + "Save" / "New" / "Delete" buttons in the header area of `Index.tsx`.
- When saving, serialize current state into the projects array. When loading, replace all context state with the selected project's data.

**Files**: `src/context/ProjectContext.tsx`, `src/pages/Index.tsx`

## 2. Duplicate Resource Button

**What**: Add a "Duplicate" icon button next to the delete button on each resource card. Clicking it clones the resource with a new ID and appended " (copy)" name.

**How**:
- In `ResourceManager.tsx`, add a `duplicateResource` function that copies the resource, assigns `crypto.randomUUID()`, and appends " (copy)" to the name.
- Add a `Copy` icon button next to the `Trash2` button.

**Files**: `src/components/ResourceManager.tsx`

## 3. Collapsible Sections

**What**: Wrap each major section (Rate Card, Resources, Weekly Breakdown, Holiday Display, Price Adjustments, Summary, Invoicing) in a collapsible container so users can collapse sections they're not working on.

**How**:
- Use the existing `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`.
- In `Index.tsx`, wrap each component in a `Collapsible` with a header trigger containing the section title and a chevron icon. Default all sections to open.
- Move the `CardHeader` into the `CollapsibleTrigger` for each section, adding a `ChevronDown`/`ChevronUp` icon.

**Files**: `src/pages/Index.tsx`

## 4. Scenario Comparison

**What**: Let users create named "scenarios" within a project (e.g., "Lean Team" vs "Full Team") and compare them side-by-side. Each scenario has its own resources, rate card, and adjustments.

**How**:
- Add a `scenarios` array to context, each scenario containing `{ id, name, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent }`.
- Default to one scenario ("Base").
- Add a tab bar at the top of the main content for switching/adding/renaming scenarios.
- Add a "Compare Scenarios" dialog that shows a side-by-side summary table (scenario name, total days, total cost, grand total).
- Context changes: add `scenarios`, `activeScenarioId`, `setActiveScenarioId`, `addScenario`, `removeScenario`, `renameScenario`.

**Files**: `src/lib/types.ts` (add `Scenario` interface), `src/context/ProjectContext.tsx`, `src/pages/Index.tsx`, new `src/components/ScenarioCompare.tsx`

## 5. Excel/CSV Export

**What**: Add an "Export Excel" button next to the existing CSV and PDF buttons in the Summary section.

**How**:
- Install `xlsx` (SheetJS) package.
- In `SummaryView.tsx`, add an `exportExcel` function that creates a workbook with sheets: "Summary", "Weekly Breakdown", "Invoicing Schedule", "Exchange Rates".
- Each sheet mirrors the corresponding PDF section as a formatted table.
- Add a button with a spreadsheet icon.

**Files**: `src/components/SummaryView.tsx`, `package.json`

## 6. Input Validation & Warnings

**What**: Show inline warnings for common issues — 0% allocation, no resources, invoice dates outside project range, missing project name/dates.

**How**:
- In `ResourceCard`, show an amber warning badge if `allocationPercent === 0`.
- In `InvoicingSchedule`, highlight rows where the date falls outside `[startDate, endDate]` with a red border and tooltip.
- In `ProjectSetup`, show a subtle warning if name is empty or dates are missing when resources exist.
- In `SummaryView`, show an alert banner if total invoice % ≠ 100%.
- Use the existing `Alert` component with `variant="destructive"` or a custom amber variant.

**Files**: `src/components/ResourceManager.tsx`, `src/components/InvoicingSchedule.tsx`, `src/components/ProjectSetup.tsx`, `src/components/SummaryView.tsx`

## 7. Dark Mode Toggle

**What**: Add a sun/moon toggle button in the header that switches between light and dark themes.

**How**:
- The app already has dark mode CSS variables defined in `index.css` and `darkMode: "class"` in Tailwind config.
- Add a `theme` state to `localStorage` and a toggle button in the header (`Index.tsx`).
- On toggle, add/remove the `dark` class on `document.documentElement`.
- Persist preference in `localStorage` under `pricing-calculator-theme`.

**Files**: `src/pages/Index.tsx`

---

## Files Summary

| File | Changes |
|------|---------|
| `src/context/ProjectContext.tsx` | Multi-project save/load, scenario state |
| `src/pages/Index.tsx` | Header with project switcher, dark mode toggle, collapsible sections |
| `src/components/ResourceManager.tsx` | Duplicate button, 0% allocation warning |
| `src/components/SummaryView.tsx` | Excel export, invoice % warning |
| `src/components/InvoicingSchedule.tsx` | Out-of-range date warning |
| `src/components/ProjectSetup.tsx` | Missing fields warning |
| `src/components/ScenarioCompare.tsx` | New — side-by-side scenario comparison dialog |
| `src/lib/types.ts` | `Scenario` interface |
| `package.json` | Add `xlsx` dependency |

