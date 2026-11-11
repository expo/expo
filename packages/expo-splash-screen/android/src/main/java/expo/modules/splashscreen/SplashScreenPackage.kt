package expo.modules.splashscreen

import android.app.Activity
import android.content.Context
import android.view.ViewGroup
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler

class SplashScreenPackage : Package {
  override fun createReactActivityHandlers(activityContext: Context): List<ReactActivityHandler> = listOf(
    object : ReactActivityHandler {
      override fun createReactRootViewContainer(activity: Activity): ViewGroup? =
        SplashScreenPrerender.createRootViewContainer(activity)
    }
  )
}
