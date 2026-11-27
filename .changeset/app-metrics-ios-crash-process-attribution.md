---
'expo-app-metrics': patch
---

[iOS] Attribute native crash reports to the session of the crashed process on iOS 17 and later. Before, all crashes in one MetricKit payload went to the same session, and only the first crash was kept. A crash of a launch that never stored a session, for example a launch that failed before the app's code ran, now gets a new session with the app version, build number and OS version of that launch. The metrics database is recreated once after the update, so data that was not yet sent is lost.
