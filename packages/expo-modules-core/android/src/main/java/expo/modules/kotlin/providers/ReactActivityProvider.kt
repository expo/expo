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
interface ReactActivityProvider {
  /**
   * Returns the current activity that should be an instance of [ReactActivity].
   * @returns null if the [Activity] is not yet available (eg. Application has not yet fully started)
   */
  val reactActivity: ReactActivity?
}
