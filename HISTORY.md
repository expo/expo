## 2026-09-15 02:47 — Remove React Navigation resolution overwrite

**Asked:** Remove Expo CLI's `@react-navigation` compatibility logic.

**Did / why:** Removed the compatibility errors, the `@react-navigation/core` rewrite, and the environment flag that disabled those checks. Added resolver regression coverage for the affected React Navigation packages.
