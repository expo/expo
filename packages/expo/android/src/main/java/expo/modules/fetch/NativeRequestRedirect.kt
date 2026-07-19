package expo.modules.fetch

import expo.modules.kotlin.types.Enumerable

internal enum class NativeRequestRedirect(val value: String) : Enumerable {
  FOLLOW("follow"),
  ERROR("error"),
  MANUAL("manual")
}
