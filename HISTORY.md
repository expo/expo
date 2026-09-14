## 2026-09-14 — Make preload-only transitions the default

**Asked:** Default the queue to preload-only transitions and let individual operations opt into transitions.

**Did / why:** Changed the default mode to `preload-only` and replaced `noTransitions` with `inTransition`. A non-preload operation can opt its batch into a transition, but every operation in that batch must independently allow transitions because the queue drains the batch through one shared React transition boundary.

## 2026-09-11 05:01 PDT — Configure router queue transitions

**Asked:** Add APIs to disable React transitions globally, preserve transitions only for preload-only batches, and opt individual router operations out of transitions.

**Did / why:** Added a global router transition mode and a per-operation `noTransitions` option. Transition mode is evaluated once for each drained batch because all operations in a batch share one React transition boundary; therefore a mixed preload/non-preload batch and a batch containing any opted-out operation both run without transitions.
