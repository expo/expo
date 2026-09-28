package expo.modules.ai

import android.os.Build

internal fun mlKitRequiresNewerOs(osVersion: Int): Boolean = osVersion < Build.VERSION_CODES.O

// The ML Kit GenAI libraries declare minSdkVersion 26 and the backend constructor calls
// Generation.getClient(), so that call must stay inside the supported branch.
internal fun defaultLanguageModelBackend(
  osVersion: Int,
  supported: () -> LanguageModelBackend = { MlKitLanguageModelBackend() }
): LanguageModelBackend =
  if (mlKitRequiresNewerOs(osVersion)) UnsupportedOsLanguageModelBackend else supported()

internal fun unavailableSessionMessage(backend: LanguageModelBackend): String =
  backend.unavailableMessage ?: "ML Kit is not available on this device."

private const val UNSUPPORTED_OS_MESSAGE =
  "The on-device language model cannot run on this device because ML Kit GenAI requires " +
    "Android 8.0 (API level 26) or newer. Check getAvailabilityAsync() before preparing or " +
    "generating, and use a remote model on older Android versions."

internal object UnsupportedOsLanguageModelBackend : LanguageModelBackend {
  override val unavailableReason = "unsupported-os-version"
  override val unavailableMessage = UNSUPPORTED_OS_MESSAGE

  override suspend fun status() = ModelStatus.UNAVAILABLE
  override suspend fun modelName(): String? = null
  override suspend fun tokenLimit(): Int? = null

  override suspend fun download(onProgress: (Double?) -> Unit): Unit = throw unsupported()

  override suspend fun generate(
    prompt: String,
    instructions: String?,
    options: LanguageModelRequestOptions,
    onText: (String) -> Unit
  ): String = throw unsupported()

  override fun close() = Unit

  private fun unsupported() = LanguageModelException("ERR_MODEL_UNAVAILABLE", UNSUPPORTED_OS_MESSAGE)
}
