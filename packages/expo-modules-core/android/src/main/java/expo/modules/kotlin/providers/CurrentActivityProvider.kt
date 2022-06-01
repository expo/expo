package expo.modules.kotlin.providers

import com.facebook.react.ReactActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentActivity
import androidx.core.app.ComponentActivity
import android.app.Activity

/**
 * A class that provides the accessor to the [ReactActivity]. It enables accessing
 * AndroidX/Android Jetpack features in Expo libraries coming from all subclassing chain:
 * [AppCompatActivity], [FragmentActivity], [ComponentActivity], [Activity]
*/
interface CurrentActivityProvider {
  /**
   * Returns the current [Activity] that should be an instance of [AppCompatActivity].
   * This activity is most likely an instance of [ReactActivity], but it's been decided not to expose
   * `react-native` symbols via `expo-module-core` public API.
   * @returns null if the [Activity] is not yet available (eg. Application has not yet fully started)
   */
  val currentActivity: AppCompatActivity?
}
