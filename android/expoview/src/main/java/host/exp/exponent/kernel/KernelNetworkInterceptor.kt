package host.exp.exponent.kernel

import expo.modules.manifests.core.Manifest
import host.exp.exponent.RNObject
import okhttp3.Interceptor
import okhttp3.Response

/**
 * A singleton network interceptor proxy to forward okhttp requests to the versioned handlers.
 */
object KernelNetworkInterceptor {
  private var sdkVersion: String = RNObject.UNVERSIONED
  private var versionedAppInterceptorObject: RNObject? = null
  private var versionedNetworkInterceptorObject: RNObject? = null
  private var expoNetworkInterceptor: RNObject? = null

  fun start(manifest: Manifest, reactInstanceManager: Any?) {
    sdkVersion = manifest.getExpoGoSDKVersion() ?: throw IllegalArgumentException("Invalid SDK version")
    val sdkMajorVersion = sdkVersion.split(".")[0].toIntOrNull() ?: Int.MAX_VALUE
    if (sdkMajorVersion < 49) {
      return
    }
    versionedAppInterceptorObject = RNObject("expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpAppInterceptor")
      .loadVersion(sdkVersion)
      .construct()
    versionedNetworkInterceptorObject = RNObject("expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpNetworkInterceptor")
      .loadVersion(sdkVersion)
      .construct()
    expoNetworkInterceptor = RNObject("host.exp.exponent.ExpoNetworkInterceptor")
      .loadVersion(sdkVersion)
      .construct()
    expoNetworkInterceptor?.call("start", manifest, reactInstanceManager)
  }

  val okhttpAppInterceptorProxy = Interceptor { chain ->
    versionedAppInterceptorObject?.call("intercept", chain) as? Response
      ?: chain.proceed(chain.request())
  }

  val okhttpNetworkInterceptorProxy = Interceptor { chain ->
    versionedNetworkInterceptorObject?.call("intercept", chain) as? Response
      ?: chain.proceed(chain.request())
  }

  fun onResume(reactInstanceManager: Any?) {
    expoNetworkInterceptor?.call("onResume", reactInstanceManager)
  }

  fun onPause() {
    expoNetworkInterceptor?.call("onPause")
    versionedNetworkInterceptorObject = null
    versionedAppInterceptorObject = null
  }
}
