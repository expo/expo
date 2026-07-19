package expo.modules.notifications.notifications.presentation.builders

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import java.net.URL

suspend fun downloadImage(imageUrl: Uri, connectTimeout: Long = 8000, readTimeout: Long = 8000): Bitmap? {
  return runCatching {
    withTimeout(connectTimeout + readTimeout) {
      withContext(Dispatchers.IO) {
        val url = URL(imageUrl.toString())
        val connection = url.openConnection()
        connection.connectTimeout = connectTimeout.toInt()
        connection.readTimeout = readTimeout.toInt()
        BitmapFactory.decodeStream(connection.inputStream)
      }
    }
  }.getOrNull()
}
