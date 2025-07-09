// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.graphics.Color
import java.lang.Exception

object ColorParser {
  @JvmStatic fun isValid(color: String?): Boolean {
    return try {
      Color.parseColor(color)
      true
    } catch (e: Exception) {
      false
    }
  }
}
