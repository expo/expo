package expo.modules.camera.next.analyzers

import android.media.Image
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer

typealias FrameListener = (proxy: ImageProxy) -> Unit

class FrameAnalyzer(private val listener: FrameListener) : ImageAnalysis.Analyzer {
  @OptIn(ExperimentalGetImage::class) override fun analyze(imageProxy: ImageProxy) {
    listener(imageProxy)
  }
}

private fun ByteBuffer.toByteArray(): ByteArray {
  rewind()
  val data = ByteArray(remaining())
  get(data)
  return data
}

fun Array<ImageProxy.PlaneProxy>.toByteArray() = this.fold(mutableListOf<Byte>()) { acc, plane ->
  acc.addAll(plane.buffer.toByteArray().toList())
  acc
}.toByteArray()