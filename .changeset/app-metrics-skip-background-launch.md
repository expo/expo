---
'expo-app-metrics': patch
---

[iOS] Skip startup metrics for launches that start in the background (for example a background fetch or a silent push notification), and drop TTR and TTI longer than 3 minutes. Before, their TTR and TTI included the whole time until the user opened the app.
