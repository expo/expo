package expo.modules.kotlin.providers

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Provides access the Android's [Context].
 * It is almost sure that the returned [Context] would be an instance of [ReactApplicationContext],
 * but die to the fact that we don't want to expose `react-native` symbols in `expo-module-core`
 * public API, we return more generic type here.
 */
interface ContextProvider {
  /**
   * [Context] reference. If it's not possible to access the [Context] (because it's null),
   * then it's an invalid situation and should result in throwing descriptive error.
   */
  val context: Context
}
