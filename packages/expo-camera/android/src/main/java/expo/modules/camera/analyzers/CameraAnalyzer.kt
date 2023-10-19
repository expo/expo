package expo.modules.camera.analyzers

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer

typealias CameraListener = (data: ByteArray, width: Int, height: Int, rotation: Int) -> Unit

class CameraAnalyzer(private val listener: CameraListener) : ImageAnalysis.Analyzer {
  override fun analyze(image: ImageProxy) {
    val data = image.planes.toByteArray()
    val width = image.width
    val height = image.height
    val rotation = image.imageInfo.rotationDegrees
    listener(data, width, height, rotation)
    image.close()
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