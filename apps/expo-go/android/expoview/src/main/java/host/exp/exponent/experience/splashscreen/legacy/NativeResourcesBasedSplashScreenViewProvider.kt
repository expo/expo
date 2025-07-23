@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package host.exp.exponent.experience.splashscreen.legacy

import android.content.Context

/**
 * Default implementation that uses native resources.
 */
class NativeResourcesBasedSplashScreenViewProvider(
  private val resizeMode: SplashScreenImageResizeMode
) : SplashScreenViewProvider {

  override fun createSplashScreenView(context: Context) = SplashScreenView(context)
}
