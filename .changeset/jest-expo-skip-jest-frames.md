---
'jest-expo': patch
---

Skip Jest's own stack frames when looking up native module mocks. On Jest 30 this lookup reread Jest's runtime source for every native module and slowed down test runs.
