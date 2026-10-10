---
"expo-app-metrics": patch
---

[iOS] Diagnose slow launches, not just measure them. A watchdog now samples the main thread between `didFinishLaunching` and `timeToInteractive`: when it is unresponsive for more than 150 ms its call stack is captured, symbolicated on device and stored as an `app_startup.main_thread_stall` log event (duration, offset into the launch, phase, stack); stall totals are attached to the `timeToInteractive` metric as `expo.startup.mainThreadStalls.*` params. MetricKit payloads are no longer dropped except for crashes: `MXAppLaunchMetric` / `MXAppResponsivenessMetric` histograms (OS-measured time to first draw, resume time, extended launch, hang time) become a `metrickit.app_launch` log event plus `appStartup.os*` metrics, and `MXHangDiagnostic` / `MXAppLaunchDiagnostic` call stacks become `native.hang` / `native.slow_launch` log events.
