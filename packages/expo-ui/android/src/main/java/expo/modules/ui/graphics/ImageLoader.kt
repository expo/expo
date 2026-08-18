package expo.modules.ui.graphics

import android.content.Context
import android.content.res.XmlResourceParser
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.util.Log
import android.util.LruCache
import android.util.Xml
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toDrawable
import androidx.core.graphics.toColorInt
import androidx.core.net.toUri
import expo.modules.kotlin.okhttp.await
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.xmlpull.v1.XmlPullParser
import java.io.File
import java.io.IOException

/**
 * Loads and parses images from various sources (HTTP, file, content provider).
 * Supports XML vector drawables (Android format) and bitmap images.
 *
 * All loading operations are suspend functions and run on appropriate dispatchers.
 */
class ImageLoader(
  private val context: Context,
  private val okHttpClient: OkHttpClient
) {
  private val imageCache = object : LruCache<String, ImageResult>(memoryCacheSizeKilobytes()) {
    override fun sizeOf(key: String, value: ImageResult): Int {
      val bitmap = (value.drawable as? BitmapDrawable)?.bitmap ?: return 1

      return (bitmap.allocationByteCount / 1024)
        .coerceAtLeast(1)
    }
  }

  /**
   * Result of an image loading operation.
   */
  data class ImageResult(
    val imageVector: ImageVector? = null,
    val drawable: Drawable? = null,
    val error: String? = null
  ) {
    val isSuccess: Boolean
      get() = imageVector != null || drawable != null
  }

  /**
   * Load an image from a URI string.
   * Returns an ImageResult containing either an ImageVector (for XML) or Drawable (for bitmaps).
   *
   * This is a suspend function that performs I/O operations on the IO dispatcher.
   */
  suspend fun loadFromUri(uriString: String?): ImageResult = withContext(Dispatchers.IO) {
    if (uriString.isNullOrEmpty()) {
      return@withContext ImageResult(error = "Image URI is empty")
    }

    val uri = try {
      uriString.toUri()
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse URI: $uriString", e)
      return@withContext ImageResult(error = "Failed to parse image URI: $uriString")
    }

    imageCache.get(uriString)?.let { return@withContext it }
    loadUncached(uri).also { result ->
      if (result.isSuccess) {
        imageCache.put(uriString, result)
      }
    }
  }

  /**
   * Clears pending work and releases decoded images held by this loader.
   */
  fun close() {
    imageCache.evictAll()
  }

  private suspend fun loadUncached(uri: Uri): ImageResult {
    return try {
      // For resource URIs, use Android's XmlResourceParser which handles compiled binary XML.
      if (uri.scheme == "res") {
        loadFromResourceId(uri)
      } else {
        val bytes = when (uri.scheme) {
          "file" -> {
            val path = uri.path ?: throw IOException("Image file URI has no path: $uri")
            File(path).readBytes()
          }

          "content", "android.resource" -> {
            context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
              ?: throw IOException("Unable to open image URI: $uri")
          }

          "http", "https" -> downloadFromHttp(uri.toString())
          else -> throw IOException("Unsupported image URI scheme: ${uri.scheme ?: "none"}")
        }
        parseImageFromBytes(bytes)
      }
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      val message = e.message ?: "Failed to load image from URI: $uri"
      Log.e(TAG, message, e)
      ImageResult(error = message)
    }
  }

  /**
   * Download an image from HTTP/HTTPS URL using OkHttp.
   * The OkHttp call is cancelled when the enclosing coroutine is cancelled.
   */
  private suspend fun downloadFromHttp(url: String): ByteArray {
    val request = Request.Builder()
      .url(url)
      .build()
    return okHttpClient.newCall(request).await().use { response ->
      if (!response.isSuccessful) {
        throw IOException("Failed to download image from $url: HTTP ${response.code}")
      }
      response.body?.bytes()
        ?: throw IOException("Image response from $url has no body")
    }
  }

  /**
   * Load an image from an Android resource ID extracted from a `res:/` URI.
   * Uses [XmlResourceParser] which handles compiled (binary) XML in release builds.
   */
  private fun loadFromResourceId(uri: Uri): ImageResult {
    val resourceId = uri.lastPathSegment?.toIntOrNull()
      ?: uri.path?.trimStart('/')?.toIntOrNull()
    if (resourceId == null || resourceId <= 0) {
      Log.w(TAG, "Invalid resource ID in URI: $uri")
      return ImageResult(error = "Invalid image resource ID: $uri")
    }

    // Try parsing as XML (handles both text and compiled binary XML)
    try {
      val xmlParser: XmlResourceParser = context.resources.getXml(resourceId)
      xmlParser.use { parser ->
        val imageVector = parseXmlToImageVector(parser)
        if (imageVector != null) {
          return ImageResult(imageVector = imageVector)
        }
      }
    } catch (e: Exception) {
      Log.d(TAG, "Resource $resourceId is not XML, trying as raw resource", e)
    }

    // Fall back to bitmap resource decoding.
    try {
      val bitmap = BitmapFactory.decodeResource(context.resources, resourceId)
        ?: return ImageResult(error = "Failed to decode image resource $resourceId")
      return ImageResult(drawable = bitmap.toDrawable(context.resources))
    } catch (e: Exception) {
      Log.e(TAG, "Failed to load resource $resourceId", e)
      return ImageResult(error = e.message ?: "Failed to load image resource $resourceId")
    }
  }

  /**
   * Parse an image from encoded bytes.
   * Detects format (XML or bitmap) and returns appropriate result.
   */
  private fun parseImageFromBytes(bytes: ByteArray): ImageResult {
    return if (isXmlContent(bytes)) {
      val imageVector = parseXmlToImageVector(bytes)
      if (imageVector != null) {
        ImageResult(imageVector = imageVector)
      } else {
        ImageResult(error = "Failed to decode XML image")
      }
    } else {
      val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        ?: return ImageResult(error = "Failed to decode bitmap image")
      ImageResult(drawable = bitmap.toDrawable(context.resources))
    }
  }

  /**
   * Detect if byte array contains XML content.
   */
  private fun isXmlContent(bytes: ByteArray): Boolean {
    if (bytes.size < 5) return false

    // Check for UTF-8 BOM
    var offset = 0
    if (bytes[0] == 0xEF.toByte() && bytes[1] == 0xBB.toByte() && bytes[2] == 0xBF.toByte()
    ) {
      offset = 3
    }

    // Check if content starts with '<' (possibly with leading whitespace)
    for (i in offset until minOf(offset + 10, bytes.size)) {
      val b = bytes[i]
      if (b == '<'.code.toByte()) return true
      if (b != ' '.code.toByte() && b != '\t'.code.toByte() &&
        b != '\n'.code.toByte() && b != '\r'.code.toByte()
      ) {
        return false
      }
    }
    return false
  }

  /**
   * Parse Android VectorDrawable XML to Compose ImageVector from raw bytes (text XML).
   */
  fun parseXmlToImageVector(bytes: ByteArray): ImageVector? {
    return try {
      val parser = Xml.newPullParser()
      parser.setInput(bytes.inputStream(), "UTF-8")
      parseXmlToImageVector(parser)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse XML to ImageVector", e)
      null
    }
  }

  /**
   * Parse Android VectorDrawable XML to Compose ImageVector from any [XmlPullParser].
   * Works with both text XML parsers and [XmlResourceParser] (compiled binary XML).
   */
  fun parseXmlToImageVector(parser: XmlPullParser): ImageVector? {
    return try {
      var eventType = parser.eventType
      while (eventType != XmlPullParser.END_DOCUMENT) {
        if (eventType == XmlPullParser.START_TAG && parser.name == "vector") {
          return parseVectorElement(parser)
        }
        eventType = parser.next()
      }
      Log.w(TAG, "No <vector> element found in XML")
      null
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse XML to ImageVector", e)
      null
    }
  }

  /**
   * Parse <vector> element and its children.
   */
  private fun parseVectorElement(parser: XmlPullParser): ImageVector? {
    return try {
      // Parse <vector> attributes
      var width = 24.dp
      var height = 24.dp
      var viewportWidth = 24f
      var viewportHeight = 24f

      for (i in 0 until parser.attributeCount) {
        when (parser.getAttributeName(i)) {
          "width" -> width = parseDimension(parser.getAttributeValue(i))
          "height" -> height = parseDimension(parser.getAttributeValue(i))
          "viewportWidth" -> viewportWidth = parser.getAttributeValue(i).toFloatOrNull() ?: 24f
          "viewportHeight" -> viewportHeight = parser.getAttributeValue(i).toFloatOrNull() ?: 24f
        }
      }

      // Build ImageVector
      val builder = ImageVector.Builder(
        defaultWidth = width,
        defaultHeight = height,
        viewportWidth = viewportWidth,
        viewportHeight = viewportHeight
      )

      // Parse child elements
      var eventType = parser.next()
      while (eventType != XmlPullParser.END_DOCUMENT) {
        when (eventType) {
          XmlPullParser.START_TAG -> {
            when (parser.name) {
              "path" -> parsePathElement(parser, builder)
              // Note: groups, clips, gradients not yet supported
            }
          }

          XmlPullParser.END_TAG -> {
            if (parser.name == "vector") {
              return builder.build()
            }
          }
        }
        eventType = parser.next()
      }

      builder.build()
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse <vector> element", e)
      null
    }
  }

  /**
   * Parse <path> element and add to ImageVector builder.
   */
  private fun parsePathElement(parser: XmlPullParser, builder: ImageVector.Builder) {
    try {
      var pathData = ""
      var fillColor: androidx.compose.ui.graphics.Color? = null
      var pathFillType = PathFillType.NonZero

      for (i in 0 until parser.attributeCount) {
        when (parser.getAttributeName(i)) {
          "pathData" -> pathData = parser.getAttributeValue(i)
          "fillColor" -> {
            fillColor = parseColor(parser.getAttributeValue(i))
          }
          "fillType" -> {
            pathFillType = when (parser.getAttributeValue(i)) {
              "evenOdd", "1" -> PathFillType.EvenOdd
              else -> PathFillType.NonZero
            }
          }
          // Note: stroke properties and opacity are not yet supported
        }
      }

      if (pathData.isNotEmpty()) {
        val nodes = PathParser().parsePathString(pathData).toNodes()
        builder.addPath(
          pathData = nodes,
          fill = fillColor?.let { SolidColor(it) },
          pathFillType = pathFillType
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse <path> element", e)
    }
  }

  /**
   * Parse dimension string (e.g., "24dp") to Compose Dp.
   */
  private fun parseDimension(value: String): Dp {
    return try {
      val numericValue = value
        .replace("dp", "")
        .replace("dip", "")
        .replace("px", "")
        .toFloat()
      numericValue.dp
    } catch (_: Exception) {
      Log.w(TAG, "Failed to parse dimension: $value, using default 24dp")
      24.dp
    }
  }

  /**
   * Parse color string to Compose Color.
   */
  private fun parseColor(colorValue: String): androidx.compose.ui.graphics.Color {
    return try {
      when {
        colorValue.startsWith("#") -> {
          androidx.compose.ui.graphics.Color(colorValue.toColorInt())
        }

        colorValue.startsWith("@android:color/") || colorValue.startsWith("?attr/") -> {
          // Theme attributes default to black (could be enhanced to resolve theme colors)
          Log.d(TAG, "Theme color attribute not resolved: $colorValue, using black")
          androidx.compose.ui.graphics.Color.Black
        }

        else -> {
          Log.w(TAG, "Unknown color format: $colorValue, using black")
          androidx.compose.ui.graphics.Color.Black
        }
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to parse color: $colorValue", e)
      androidx.compose.ui.graphics.Color.Black
    }
  }

  companion object {
    private const val TAG = "ImageLoader"

    private fun memoryCacheSizeKilobytes(): Int {
      val maxMemoryKilobytes = Runtime.getRuntime().maxMemory() / 1024
      return (maxMemoryKilobytes / 8).coerceIn(1, Int.MAX_VALUE.toLong()).toInt()
    }
  }
}
