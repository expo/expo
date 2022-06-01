@file:OptIn(ExperimentalContracts::class)

package expo.modules.imagepicker

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.core.errors.ModuleNotFoundException
import android.os.OperationCanceledException
import expo.modules.imagepicker.contracts.CropImageContract
import expo.modules.imagepicker.contracts.ImagePickerContract
import expo.modules.imagepicker.contracts.ImagePickerContractResult
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO(@bbarthec): rename to ExpoImagePicker
private const val moduleName = "ExponentImagePicker"

class ImagePickerModule : Module() {

  override fun definition() = ModuleDefinition {

    Name(moduleName)

    // region JS API

    AsyncFunction("requestMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, *getMediaLibraryPermissions(writeOnly))
    }

    AsyncFunction("getMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, *getMediaLibraryPermissions(writeOnly))
    }

    AsyncFunction("requestCameraPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    AsyncFunction("getCameraPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    AsyncFunction("launchCameraAsync") Coroutine { options: ImagePickerOptions ->
      ensureTargetActivityIsAvailable(options)
      ensureCameraPermissionsAreGranted()

      val mediaFile = createOutputFile(context.cacheDir, options.mediaTypes.toFileExtension())
      val uri = mediaFile.toContentUri(context)
      val contract = options.toCameraContract(uri)

      launchContractWithPromise(contract, options, PickingSource.CAMERA)
    }

    AsyncFunction("launchImageLibraryAsync") Coroutine { options: ImagePickerOptions ->
      val contract = options.toImageLibraryContract()
      launchContractWithPromise(contract, options, PickingSource.IMAGE_LIBRARY)
    }

    AsyncFunction("getPendingResultAsync") Coroutine { _: Promise -> // TODO (@bbarthec): without parameter there's an error: "Overload resolution ambiguity. All these functions match. <lists all Coroutine functions>"
      val (bareResult, options) = pendingMediaPickingResult ?: return@Coroutine null

      pendingMediaPickingResult = null

      mediaHandler.readExtras(bareResult, options)
    }

    // endregion
  }

  // TODO (@bbarthec): generalize it as almost every module re-declares this approach
  val context: Context
    get() = requireNotNull(appContext.reactContext) { "React Application Context is null" }

  private val currentActivity
    get() = appContext.activityProvider?.currentActivity ?: throw MissingCurrentActivityException()

  private val mediaHandler = MediaHandler(this)

  /**
   * Stores result for an operation that has been interrupted by the activity destruction.
   * The results are stored only for successful, non-cancelled-by-user scenario.
   * Each new picking operation overrides previous state (for cancelled operation `null` is set).
   * The user can retrieve the data using exported `getPendingResultAsync` method.
   */
  private var pendingMediaPickingResult: PendingMediaPickingResult? = null

  /**
   * Calls [launchPicker] and unifies flow shared between "launchCameraAsync" and "launchImageLibraryAsync"
   */
  private suspend fun launchContractWithPromise(
    contract: ImagePickerContract,
    options: ImagePickerOptions,
    pickingSource: PickingSource,
  ): Any? {
    try {
      val bareResult = launchPicker(contract, options, pickingSource)
      return mediaHandler.readExtras(bareResult, options)
    } catch (cause: OperationCanceledException) {
      return ImagePickerCancelledResponse()
    } catch (cause: ActivityDestroyedException) {
      pendingMediaPickingResult = cause.data?.let { PendingMediaPickingResult(it, options) }
    }
    return null
  }

  /**
   * Launches picker (image library or camera) and possibly edit the picked assets.
   * There are two flows that might happen depending on fact whether launching Activity is still alive:
   *   1. launching Activity is alive -> all the media assets are processed (possibly edited) unless
   *      a user cancels any operation (picking or editing) at any point of time.
   *      If cancellation happens then the whole operation (even for multiple assets) is cancelled.
   *   2. launching Activity is destroyed -> the operation proceeds to the end and picked
   *      (and possibly edited) assets are preserved in [pendingMediaPickingResult] to be retrieved later
   *      unless any single operation is cancelled, because then nothing is preserved.
   *
   * TODO(@bbarthec): Right now I'm launching this using [Dispatchers.Main] to properly call [UiThread]/[MainThread] underlying functions
   *                  I need to find out what's our intentional way to dispatch some code on UI/Main Thread using coroutines
   */
  private suspend fun launchPicker(
    contract: ImagePickerContract,
    options: ImagePickerOptions,
    pickingSource: PickingSource
  ): Pair<MediaType, Uri> = withContext(Dispatchers.Main) {
    val (rawPickingResult, activityDestroyedWhenPicking) = appContext.launchForActivityResult(contract)

    // Keep track of possible Activity destruction since the bare picking operation
    var activityDestroyed = activityDestroyedWhenPicking

    /**
     * Picking cancelled:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     */
    checkOperationCancelled(activityDestroyed, rawPickingResult)

    /**
     * Editing not required:
     * - signal Activity destruction with picked media assets
     * - or return picked media assets
     */
    if (!options.allowsEditing) {
      if (activityDestroyed) {
        throw ActivityDestroyedException(rawPickingResult.data)
      }
      return@withContext rawPickingResult.data
    }

    /**
     * Editing required
     */
    if (rawPickingResult.data.first == MediaType.VIDEO) {
      // We do not edit video assets
      return@withContext rawPickingResult.data
    }

    val (editedResult, activityDestroyedWhenEditing) = appContext.launchForActivityResult(CropImageContract(
      rawPickingResult.data.second,
      options,
      pickingSource
    ))
    activityDestroyed = activityDestroyed && activityDestroyedWhenEditing

    /**
     * Editing cancelled:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     */
    checkOperationCancelled(activityDestroyed, editedResult)

    /**
     * Editing succeeded:
     * - signal Activity destruction with edited image
     * - or simply return edited image
     */
    if (activityDestroyed) {
      throw ActivityDestroyedException(editedResult.data)
    }
    editedResult.data
  }

  /**
   * If [operationResult] is [ImagePickerContractResult.Cancelled] then this function would throw
   * @throws [ActivityDestroyedException]
   * @throws [OperationCanceledException]
   */
  private fun checkOperationCancelled(activityDestroyed: Boolean, operationResult: ImagePickerContractResult) {
    contract {
      returns() implies (operationResult is ImagePickerContractResult.Success)
    }
    if (activityDestroyed) {
      throw ActivityDestroyedException(null)
    }
    throw OperationCanceledException()
  }

  // endregion

  // region Utils

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> =
    if (writeOnly) {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE)
    }

  private fun ensureTargetActivityIsAvailable(options: ImagePickerOptions) {
    val cameraIntent = Intent(options.mediaTypes.toCameraIntentAction())
    if (cameraIntent.resolveActivity(currentActivity.application.packageManager) == null) {
      throw MissingActivityToHandleIntent(cameraIntent.type)
    }
  }

  private suspend fun ensureCameraPermissionsAreGranted(): Unit = suspendCancellableCoroutine { continuation ->
    val permissions = appContext.permissions ?: throw ModuleNotFoundException("Permissions")

    permissions.askForPermissions({ permissionsResponse ->
      if (
        permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED
        && permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
      ) {
        continuation.resume(Unit)
      } else {
        continuation.resumeWithException(UserRejectedPermissionsException())
      }
    }, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA)
  }

  // endregion
}

internal enum class PickingSource {
  CAMERA,
  IMAGE_LIBRARY
}

/**
 * [Exception] that signals the launching Activity has been destroyed by the OS.
 * It stores optional data that should be preserved for possible later retrieval.
 * @see [ImagePickerModule.pendingMediaPickingResult]
 */
internal class ActivityDestroyedException(val data: Pair<MediaType, Uri>?): Exception()

/**
 * Simple data structure to hold the data that has to be preserved after the Activity is destroyed.
 */
internal data class PendingMediaPickingResult(
  val data: Pair<MediaType, Uri>,
  val options: ImagePickerOptions
)
