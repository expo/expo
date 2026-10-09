---
'expo-sqlite': patch
---

[Web] Fix database closing: finalize only statements that `expo-sqlite` prepared, so virtual tables such as FTS5 no longer make the close fail. Keep the connection open after a failed close so it can be cleaned up and retried, and keep a shared connection open until its last handle closes.
