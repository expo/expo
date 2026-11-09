---
"@expo/env": patch
---

Compare protected and local-only dotenv keys case-insensitively so mixed-case entries cannot bypass denylist checks on Windows.

Match original-environment backups and loaded-key markers case-insensitively on Windows so alternate key casing cannot expose dotenv values to protected lookups or subprocesses.
