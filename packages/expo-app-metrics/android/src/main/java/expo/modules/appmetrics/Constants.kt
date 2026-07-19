package expo.modules.appmetrics

internal const val TAG = "ExpoAppMetrics"
internal const val DEVICE_OS = "Android"

// https://sqlite.org/limits.html#:~:text=SQLITE_MAX_VARIABLE_NUMBER%2C%20which%20defaults%20to%20999%20for%20SQLite
// 900 is a safe number slightly below the default limit to avoid hitting the limit
internal const val SQLITE_MAX_BIND_VARIABLES = 900
