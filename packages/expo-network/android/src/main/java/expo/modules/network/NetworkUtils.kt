package expo.modules.network

internal fun frontPadWithZeros(inputArray: ByteArray): ByteArray {
  val newByteArray = byteArrayOf(0, 0, 0, 0)
  System.arraycopy(inputArray, 0, newByteArray, 4 - inputArray.size, inputArray.size)
  return newByteArray
}
