package dev.expo.payments

import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  override fun onCreate(savedInstanceState: Bundle?) {
    // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
    // https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
    super.onCreate(null)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {
        override fun onCreate(savedInstanceState: Bundle?) {
          super.onCreate(savedInstanceState)

          // Hacky way to prevent onboarding DevMenuActivity breaks detox testing,
          // we do this by setting the dev-menu internal setting.
          val intent: Intent = getIntent()
          val action: String? = intent.action
          val initialUri: Uri? = intent.data
          if (action == Intent.ACTION_VIEW &&
            initialUri != null &&
            initialUri.host == "test-suite"
          ) {
            val devMenuPrefKey = "expo.modules.devmenu.sharedpreferences"
            val pref: SharedPreferences =
              applicationContext.getSharedPreferences(devMenuPrefKey, MODE_PRIVATE)
            pref.edit().putBoolean("isOnboardingFinished", true).apply()
          }
        }
      }
    )
  }
}
