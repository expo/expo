## 2026-08-21 00:00 — Standard navigation migration

**Asked:** Implement ENG-26105 as one branch stacked on PR #49204 without opening a pull request.
**Did / why:** Migrated Slot, JavaScript Stack, and ExperimentalStack to the standard-navigation adapter, keeping existing public Slot props to avoid the plan's optional type-level breaking change. Shared the parent-tab pop-to-top subscription to preserve navigator behavior consistently.
