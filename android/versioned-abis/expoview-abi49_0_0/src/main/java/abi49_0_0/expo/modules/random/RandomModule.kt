package abi49_0_0.expo.modules.random

import android.util.Base64
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition
import java.security.SecureRandom

class RandomModule : Module() {
  private val secureRandom by lazy { SecureRandom() }

  override fun definition() = ModuleDefinition {
    Name("ExpoRandom")

    Function("getRandomBase64String", this@RandomModule::getRandomBase64String)
    AsyncFunction("getRandomBase64StringAsync", this@RandomModule::getRandomBase64String)
  }

  private fun getRandomBase64String(randomByteCount: Int): String {
    val output = ByteArray(randomByteCount)
    secureRandom.nextBytes(output)
    return Base64.encodeToString(output, Base64.NO_WRAP)
  }
}
