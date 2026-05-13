// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.plugin

// Starting with KSP 2.3.0, KSP is no longer tied to a specific Kotlin version.
const val latestKspVersion = "2.3.7"

// For older Kotlin versions, KSP releases were tied to specific Kotlin versions.
val KSPLookup = mapOf(
  "2.2.21" to "2.2.21-2.0.5",
  "2.2.20" to "2.2.20-2.0.4",
  "2.2.10" to "2.2.10-2.0.2",
  "2.2.0" to "2.2.0-2.0.2",
  "2.1.21" to "2.1.21-2.0.2",
  "2.1.20" to "2.1.20-2.0.1"
)
