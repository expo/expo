package expo.modules.sharing

import android.content.ContentResolver
import android.content.Intent
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.text.indexOf
import kotlin.text.substring

class ResolvingShareIntentDataParser {
  companion object {
    fun parse(context: Context, intent: Intent): List<ResolvedSharePayload> {
      val type = intent.type ?: return emptyList()

      return when (intent.action) {
        Intent.ACTION_SEND -> handleSendAction(context, intent, type)
        Intent.ACTION_SEND_MULTIPLE -> handleSendMultipleAction(context, intent, type)
        else -> emptyList()
      }
    }

    private fun handleSendAction(context: Context, intent: Intent, type: String): List<ResolvedSharePayload> {
      return if (type == "text/plain") {
        extractTextPayload(intent)
      } else {
        val uri = intent.getParcelableExtraCompat<Uri>(Intent.EXTRA_STREAM)
        listOfNotNull(uri?.let { resolveUri(context, it, type) })
      }
    }

    private fun handleSendMultipleAction(context: Context, intent: Intent, type: String): List<ResolvedSharePayload> {
      val uris = intent.getParcelableArrayListExtraCompat<Uri>(Intent.EXTRA_STREAM)
      return uris?.map { resolveUri(context, it, type) } ?: emptyList()
    }

    private fun extractTextPayload(intent: Intent): List<ResolvedSharePayload> {
      val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return emptyList()

      if (android.util.Patterns.WEB_URL.matcher(text).matches()) {
        return listOf(resolveUrlContext(text))
      }

      return listOf(
        ResolvedSharePayload().apply {
          value = text
          shareType = ShareType.Text
          mimeType = "text/plain"
        }
      )
    }

    private fun resolveUri(context: Context, uri: Uri, mimeType: String): ResolvedSharePayload {
      val contentResolver = context.contentResolver
      val fileName = getFileName(contentResolver, uri) ?: "unknown"
      val fileSize = getFileSize(contentResolver, uri)
      val specificMimeType = contentResolver.getType(uri) ?: mimeType
      val type = ShareType.fromMimeType(specificMimeType)

      // Copy to cache dir to ensure access
      val file = File(context.cacheDir, fileName)
      try {
        contentResolver.openInputStream(uri)?.use { input ->
          FileOutputStream(file).use { output ->
            input.copyTo(output)
          }
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }

      return ResolvedSharePayload().apply {
        value = uri.toString()
        shareType = type
        this.mimeType = specificMimeType
        contentUri = file.toURI().toString()
        contentType = ContentType.fromMimeType(specificMimeType)
        contentSize = fileSize
        contentMimeType = specificMimeType
        originalName = fileName
      }
    }

    private fun getFileName(resolver: ContentResolver, uri: Uri): String? {
      val cursor = resolver.query(uri, null, null, null, null)
      val name = cursor?.use { cursor ->
        val nameIndex = cursor
          .takeIf { it.moveToFirst() }
          ?.getColumnIndex(OpenableColumns.DISPLAY_NAME)

        if (nameIndex != null && nameIndex != -1) {
          cursor.getString(nameIndex)
        } else {
          null
        }
      }

      return name ?: uri.lastPathSegment
    }

    private fun getFileSize(resolver: ContentResolver, uri: Uri): Long? {
      val cursor = resolver.query(uri, null, null, null, null)
        ?: return null

      return cursor.use { cursor ->
        val sizeIndex = cursor
          .takeIf { it.moveToFirst() }
          ?.getColumnIndex(OpenableColumns.SIZE)

        if (sizeIndex != null && sizeIndex != -1) {
          cursor.getLong(sizeIndex)
        } else {
          null
        }
      }
    }

    private fun resolveUrlContext(urlString: String): ResolvedSharePayload {
      val payload = ResolvedSharePayload().apply {
        value = urlString
        shareType = ShareType.Url
        mimeType = "text/plain"
      }

      try {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection

        // Use GET instead of HEAD. Even though we want only the head, this works better with
        // redirects (e.g., https://picsum.photos/200/300), where requesting the HEAD will not redirect to the
        // final photo.
        connection.requestMethod = "GET"

        connection.instanceFollowRedirects = true
        connection.connectTimeout = 5000
        connection.readTimeout = 5000
        connection.connect()

        // Retrieve the final URL after any redirects
        val finalUrl = connection.url
        val finalUrlString = finalUrl.toString()

        val mimeType = connection.contentType ?: "text/plain"
        val size = connection.contentLengthLong
        val disposition = connection.getHeaderField("Content-Disposition")
        var fileName: String? = finalUrl.lastPathComponent

        disposition?.let {
          val index = disposition.indexOf("filename=")
          if (index > 0) {
            fileName = disposition.substring(index + 9).replace("\"", "")
          }
        }

        val contentType = ContentType.fromMimeType(mimeType)
        payload.apply {
          contentUri = finalUrlString
          this.contentType = contentType
          contentSize = if (size >= 0) size else null
          contentMimeType = mimeType
          originalName = fileName
        }

        // We only need headers, disconnect without reading the whole stream
        connection.disconnect()
      } catch (e: Exception) {
        throw FailedToResolveSharedDataException("Failed to resolve shared data: ${e.message}", e)
      }
      return payload
    }
  }
}
