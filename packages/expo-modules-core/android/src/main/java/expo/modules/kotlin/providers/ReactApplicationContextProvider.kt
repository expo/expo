package expo.modules.kotlin.providers

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Provides access the [ReactApplicationContext] and thus Android's [Context].
 */
interface ReactApplicationContextProvider {
  /**
   * [ReactApplicationContext] reference. If it's not possible to access the [ReactApplicationContext],
   * because it's null then it's an invalid situation and should result in throwing descriptive error.
   */
  val reactApplicationContext: ReactApplicationContext
}
