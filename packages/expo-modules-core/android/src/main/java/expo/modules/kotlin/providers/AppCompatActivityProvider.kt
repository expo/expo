package expo.modules.kotlin.providers

import androidx.appcompat.app.AppCompatActivity

/**
 * A class that provides the accessor to the [AppCompatActivity]. It enables accessing
 * AndroidX/Android Jetpack features in Expo libraries, like [AppCompatActivity.registerForActivityResult], etc.
 *
 * Ideally we would have [ReactActivityProvider] that would allow us to access [ReactActivity]
 * (and all it's superclasses) directly, but due to decision that `expo-modules-core` should not
 * depend on `react-native` dependency directly, we provide accessor to the closest superclass.
 *
 * @see ReactActivity
 * @see AppCompatActivity
*/
interface AppCompatActivityProvider {
  /**
   * Returns the current activity that should be an instance of [AppCompatActivity].
   * As each React Native application must run using [ReactAcitivity] then it's always true.
   *
   * @returns null if the Activity is not yet available
   */
  val appCompatActivity: AppCompatActivity?
}
