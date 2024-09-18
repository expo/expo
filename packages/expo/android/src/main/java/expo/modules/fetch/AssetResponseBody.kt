// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import android.content.Context
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okio.buffer
import okio.source
import java.io.IOException
import java.io.InputStream

/**
 * Creates a `ResponseBody` from Android asset
 */
@Throws(IOException::class)
fun createAssetResponseBody(context: Context, fileName: String): ResponseBody {
  val assetManager = context.assets
  val inputStream: InputStream = assetManager.open(fileName)
  return inputStream.source().buffer().asResponseBody()
}
