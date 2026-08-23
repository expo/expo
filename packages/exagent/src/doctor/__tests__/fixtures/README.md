# Recorded `expo-doctor` output

The `.txt` files here are what `expo-doctor` prints, ANSI codes already removed. They are what the
best-effort parser of `src/doctor/parseDoctorOutput.ts` is written against, because `expo-doctor`
has no `--json` and its prose is the whole contract.

| File | Provenance |
| --- | --- |
| `verbose-five-failed.txt` | **Recorded.** `node packages/expo-doctor/bin/expo-doctor.js --verbose` in `apps/minimal-tester` of this monorepo, expo-doctor 1.20.1, 2026-08-23. stdout followed by stderr, with the absolute project path replaced by `/project`. |
| `plain-five-failed.txt` | **Recorded.** The same run without `--verbose`, so no check is named unless it failed. This is what the parser degrades to `best-effort` on. |
| `all-passed.txt` | **Derived**, not recorded: no project in this repository passes every check. Assembled from the exact strings `packages/expo-doctor/src/doctor.ts` prints on the all-passing path (`startSpinner`, the per-check lines of `printCheckResultSummaryOnComplete`, and the `N/N checks passed. No issues detected!` line), with the check descriptions taken from the recorded run above. |

A recorded file must not be hand-edited. Re-record it by running the command in its provenance row.
