## 2026-09-11 05:01 PDT — Configure router queue transitions

**Asked:** Add APIs to disable React transitions globally, preserve transitions only for preload-only batches, and opt individual router operations out of transitions.

**Did / why:** Added a global router transition mode and a per-operation `noTransitions` option. Transition mode is evaluated once for each drained batch because all operations in a batch share one React transition boundary; therefore a mixed preload/non-preload batch and a batch containing any opted-out operation both run without transitions.
