---
"expo-background-task": patch
---

Fix iOS scheduling a newly registered task 12 hours ahead instead of after `minimumInterval`.
