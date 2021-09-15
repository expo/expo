package expo.modules.random

import android.util.Base64

import java.security.SecureRandom

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RandomModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val secureRandom by lazy { SecureRandom() }

  override fun getName() = "ExpoRandom"

  @ReactMethod
  fun getRandomBase64StringAsync(randomByteCount: Int, promise: Promise) =
    promise.resolve(getRandomBase64String(randomByteCount))

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getRandomBase64String(randomByteCount: Int): String {
    val output = ByteArray(randomByteCount)
    secureRandom.nextBytes(output)
    return Base64.encodeToString(output, Base64.NO_WRAP)
  }
}
