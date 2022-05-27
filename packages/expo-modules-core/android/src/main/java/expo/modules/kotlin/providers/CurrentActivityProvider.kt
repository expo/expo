package expo.modules.kotlin.providers

import androidx.appcompat.app.AppCompatActivity

/**
 * A class that provides the accessor to the [com.facebook.react.ReactActivity]. It enables accessing
 * AndroidX/Android Jetpack features in Expo libraries coming from all subclassing chain:
 * [AppCompatActivity], [androidx.fragment.app.FragmentActivity], [androidx.core.app.ComponentActivity], [android.app.Activity]
*/
interface CurrentActivityProvider {
  /**
   * Returns the current [android.app.Activity] that should be an instance of [AppCompatActivity].
   * This activity is most likely also an instance of [com.facebook.react.ReactActivity] that subclasses
   * [AppCompatActivity], but it's been decided not to expose `react-native` symbols via `expo-module-core` public API.
   * @returns null if the [android.app.Activity] is not yet available (eg. Application has not yet fully started)
   */
  val currentActivity: AppCompatActivity?
}
