// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.types.Enumerable

internal enum class NativeRequestCredentials(val value: String) : Enumerable {
  INCLUDE("include"),
  OMIT("omit")
}
