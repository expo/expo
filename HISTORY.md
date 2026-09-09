## 2026-09-09 08:42 — Clarify Expo Router prefetch terminology

**Asked:** Check whether Expo Router uses `preload` and `prefetch` consistently across its APIs, implementation, tests, and documentation.

**Did / why:** Standardized Expo Router-facing requests on `prefetch` while retaining `preload` for React Navigation's underlying action and the resulting route state. This keeps the public vocabulary consistent without renaming upstream concepts or breaking APIs.
