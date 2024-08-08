package expo.modules.audio

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.io.Closeable

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class AmplitudeProcessor : Closeable {
  @DoNotStrip
  private val mHybridData: HybridData = initHybrid()

  external fun extractAmplitudesNative(chunk: ByteArray, size: Int): FloatArray
  private external fun initHybrid(): HybridData

  override fun close() {
    mHybridData.resetNative()
  }

  companion object {
    init {
      System.loadLibrary("expo-audio")
    }
  }
}
