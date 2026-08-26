## 2026-08-26 02:33 — Use global state for `useNavigationState`

**Asked:** Implement ENG-26198 from the supplied preview on top of `main` and open a pull request.
**Did / why:** Replaced the per-navigator subscription mirror with render-time context so the hook reads the same global navigation state as its navigator. Memoized declared-route filtering to keep the context value stable when the effective screen list is unchanged, and added coverage for memoized consumers.
