// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkfetch

import okhttp3.Headers
import okio.Buffer
import okio.GzipSink
import okio.buffer

/**
 * An extension to convert list of header pair to [Headers]
 */
internal fun List<Pair<String, String>>.toHeaders(): Headers {
  val builder = Headers.Builder()
  for (pair in this) {
    builder.add(pair.first, pair.second)
  }
  return builder.build()
}

/**
 * An extension to gzip [ByteArray]
 */
internal fun ByteArray.toGzipByteArray(): ByteArray {
  val buffer = Buffer()
  val gzipSink = GzipSink(buffer).buffer()
  gzipSink.write(this)
  gzipSink.close()
  return buffer.readByteArray()
}
