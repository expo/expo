package expo.modules.ai

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.prompt.Content
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.ImagePart
import com.google.mlkit.genai.prompt.SystemInstruction
import com.google.mlkit.genai.prompt.TextPart
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.json.JSONObject

internal class MlKitLanguageModelBackend(
  private val model: GenerativeModel = Generation.getClient(),
  private val decodeImage: (uri: String) -> Bitmap? = ::decodeImageFile
) : LanguageModelBackend {
  override suspend fun status() = when (model.checkStatus()) {
    FeatureStatus.AVAILABLE -> ModelStatus.AVAILABLE
    FeatureStatus.DOWNLOADABLE -> ModelStatus.DOWNLOADABLE
    FeatureStatus.DOWNLOADING -> ModelStatus.DOWNLOADING
    else -> ModelStatus.UNAVAILABLE
  }

  // Metadata failure does not make an otherwise available model unusable.
  override suspend fun modelName(): String? = optionalMetadata { model.getBaseModelName().takeIf { it.isNotBlank() } }
  override suspend fun tokenLimit(): Int? = optionalMetadata { model.getTokenLimit().takeIf { it > 0 } }

  override suspend fun download(onProgress: (Double?) -> Unit) {
    var totalBytes: Long? = null
    var completed = false
    model.download().collect { status ->
      currentCoroutineContext().ensureActive()
      when (status) {
        is DownloadStatus.DownloadStarted -> {
          totalBytes = status.bytesToDownload.takeIf { it > 0 }
          onProgress(
            if (totalBytes == null) {
              null
            } else {
              0.0
            }
          )
        }
        is DownloadStatus.DownloadProgress -> onProgress(
          totalBytes?.let { (status.totalBytesDownloaded.toDouble() / it).coerceIn(0.0, 1.0) }
        )
        DownloadStatus.DownloadCompleted -> {
          completed = true
          onProgress(1.0)
        }
        is DownloadStatus.DownloadFailed -> throw LanguageModelException.from(status.e, "ERR_PREPARATION_FAILED")
      }
    }
    if (!completed) {
      throw LanguageModelException("ERR_PREPARATION_FAILED", "The model download ended without completion.")
    }
  }

  override suspend fun generate(
    prompt: String,
    instructions: String?,
    options: LanguageModelRequestOptions,
    onText: (String) -> Unit
  ): String {
    when (status()) {
      ModelStatus.AVAILABLE -> Unit
      ModelStatus.DOWNLOADABLE, ModelStatus.DOWNLOADING -> throw LanguageModelException("ERR_MODEL_NOT_READY", "Prepare the ML Kit model before generating.")
      ModelStatus.UNAVAILABLE -> throw LanguageModelException("ERR_MODEL_UNAVAILABLE", "ML Kit is not available on this device.")
    }
    val nativeInstructions = instructions != null && model.isSystemPromptAvailable()
    val input = if (instructions != null && !nativeInstructions) {
      "Instructions:\n$instructions\n\nRequest:\n$prompt"
    } else {
      prompt
    }
    val bitmaps = withContext(Dispatchers.IO) {
      options.images.map {
        ensureActive()
        decode(it)
      }
    }
    val content = Content.Builder().addPart(TextPart(input)).apply {
      options.images.zip(bitmaps).forEach { (image, bitmap) ->
        addPart(TextPart("Image ${JSONObject.quote(image.label)}:"))
        addPart(ImagePart(bitmap))
      }
    }.build()
    val request = GenerateContentRequest.Builder(content).apply {
      if (nativeInstructions) {
        systemInstruction = SystemInstruction(requireNotNull(instructions))
      }
      options.maximumOutputTokens?.let { maxOutputTokens = it }
      candidateCount = 1
    }.build()
    return try {
      if (options.stream) {
        streamText(request, onText)
      } else {
        model.generateContent(request).candidates.firstOrNull()?.text
          ?: throw LanguageModelException("ERR_RESPONSE_INVALID", "The model returned no text candidate.")
      }
    } catch (error: GenAiException) {
      if (options.images.isNotEmpty() && error.errorCode == GenAiException.ErrorCode.INVALID_INPUT_IMAGE) {
        val labels = options.images.joinToString { JSONObject.quote(it.label) }
        throw LanguageModelException(
          "ERR_INVALID_ARGUMENT",
          "The on-device model rejected the images $labels. Try a smaller or different image, or retry without images.",
          error
        )
      }
      throw error
    }
  }

  private suspend fun streamText(request: GenerateContentRequest, onText: (String) -> Unit): String {
    val text = StringBuilder()
    var hasCandidate = false
    model.generateContentStream(request).collect { chunk ->
      currentCoroutineContext().ensureActive()
      chunk.candidates.firstOrNull()?.let {
        hasCandidate = true
        text.append(it.text)
        onText(text.toString())
      }
    }
    if (!hasCandidate) {
      throw LanguageModelException("ERR_RESPONSE_INVALID", "The model returned no text candidate.")
    }
    return text.toString()
  }

  private fun decode(image: LanguageModelImage): Bitmap =
    decodeImage(image.uri) ?: throw LanguageModelException.invalid(
      "The image \"${image.label}\" could not be decoded. The file may be missing, unreadable by the app, or in an image format Android cannot decode. Pass a file:// URL to a readable image file in a format Android can decode (for example JPEG, PNG or WebP)."
    )

  override fun close() = model.close()

  private suspend fun <T> optionalMetadata(body: suspend () -> T?): T? = try {
    body()
  } catch (error: CancellationException) {
    throw error
  } catch (_: Exception) {
    null
  }
}

private const val MAX_IMAGE_EDGE = 2048

private fun decodeImageFile(uri: String): Bitmap? {
  val path = Uri.parse(uri).path ?: return null
  val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
  BitmapFactory.decodeFile(path, bounds)
  if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
    return null
  }
  var sampleSize = 1
  while ((maxOf(bounds.outWidth, bounds.outHeight) + sampleSize - 1) / sampleSize > MAX_IMAGE_EDGE) {
    sampleSize *= 2
  }
  val bitmap = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sampleSize }) ?: return null
  return bitmap.withExifOrientation(path)
}

/** Applies the EXIF orientation, because BitmapFactory ignores it and camera photos often rely on it. */
private fun Bitmap.withExifOrientation(path: String): Bitmap {
  val orientation = try {
    ExifInterface(path).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
  } catch (_: Exception) {
    return this
  }
  val matrix = Matrix()
  when (orientation) {
    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
    ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.setScale(1f, -1f)
    ExifInterface.ORIENTATION_TRANSPOSE -> {
      matrix.setRotate(90f)
      matrix.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
    ExifInterface.ORIENTATION_TRANSVERSE -> {
      matrix.setRotate(-90f)
      matrix.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
    else -> return this
  }
  val oriented = Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
  if (oriented !== this) {
    recycle()
  }
  return oriented
}
