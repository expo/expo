package host.exp.exponent.kernel

import com.facebook.react.ReactHost
import expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpAppInterceptor
import expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpNetworkInterceptor
import expo.modules.manifests.core.Manifest
import host.exp.exponent.Constants
import host.exp.exponent.RNObject
import okhttp3.Interceptor
import versioned.host.exp.exponent.ExpoNetworkInterceptor

/**
 * A singleton network interceptor proxy to forward okhttp requests to the versioned handlers.
 */
object KernelNetworkInterceptor {
  private var sdkVersion: String = RNObject.UNVERSIONED
  private var appInterceptor: ExpoNetworkInspectOkHttpAppInterceptor? = null
  private var networkInterceptor: ExpoNetworkInspectOkHttpNetworkInterceptor? =
    null
  private var expoNetworkInterceptor: ExpoNetworkInterceptor? = null

  fun start(manifest: Manifest, reactHost: ReactHost?) {
    sdkVersion =
      manifest.getExpoGoSDKVersion() ?: throw IllegalArgumentException("Invalid SDK version")
    // Sometime we want to release a new version without adding a new .aar. Use TEMPORARY_SDK_VERSION
    // to point to the unversioned code in ReactAndroid.
    if (Constants.TEMPORARY_SDK_VERSION == sdkVersion) {
      sdkVersion = RNObject.UNVERSIONED
    }

    appInterceptor = ExpoNetworkInspectOkHttpAppInterceptor()
    networkInterceptor = ExpoNetworkInspectOkHttpNetworkInterceptor()
    expoNetworkInterceptor = ExpoNetworkInterceptor()
    reactHost?.let {
      expoNetworkInterceptor?.start(manifest, it)
    }
  }

  val okhttpAppInterceptorProxy = Interceptor { chain ->
    appInterceptor?.intercept(chain)
      ?: chain.proceed(chain.request())
  }

  val okhttpNetworkInterceptorProxy = Interceptor { chain ->
    networkInterceptor?.intercept(chain)
      ?: chain.proceed(chain.request())
  }

  fun onResume(reactHost: ReactHost?) {
    reactHost?.let {
      expoNetworkInterceptor?.onResume(it)
    }
  }

  fun onPause() {
    expoNetworkInterceptor?.onPause()
    networkInterceptor = null
    appInterceptor = null
  }
}
