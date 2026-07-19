package expo.modules.kotlin

import expo.modules.core.logging.LogHandlers
import expo.modules.core.logging.Logger

internal val logger = Logger(listOf(LogHandlers.createOSLogHandler("ExpoModulesCore")))
