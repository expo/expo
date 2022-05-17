package expo.modules.kotlin.providers

import android.content.Context

/**
 * Provides access the Android's [Context]
 */
interface ContextProvider {
  /**
   * Non nullable [Context] reference.
   */
  val context: Context
}
