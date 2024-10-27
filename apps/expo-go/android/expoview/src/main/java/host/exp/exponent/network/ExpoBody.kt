package host.exp.exponent.network

import java.io.IOException
import java.io.InputStream

interface ExpoBody {
  @Throws(IOException::class)
  fun string(): String

  fun byteStream(): InputStream

  @Throws(IOException::class)
  fun bytes(): ByteArray
}
