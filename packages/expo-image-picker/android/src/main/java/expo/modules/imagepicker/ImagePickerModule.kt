package expo.modules.imagepicker

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.OperationCanceledException
import expo.modules.core.utilities.ifNull
import expo.modules.imagepicker.crop.CropImageContract
import expo.modules.imagepicker.crop.MediaPickerContract
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.ModuleNotFoundException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO(@bbarthec): rename to ExpoImagePicker
private const val moduleName = "ExponentImagePicker"

@ExperimentalCoroutinesApi
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

    AsyncFunction("launchCameraAsync") { options: ImagePickerOptions, promise: Promise ->
      coroutineScope.launchWithPromiseExceptionHandler(promise) {
        ensureTargetActivityIsAvailable(options)
        ensureCameraPermissionsAreGranted()

        val mediaFile = createOutputFile(context.cacheDir, options.mediaTypes.toFileExtension())
        val uri = mediaFile.toContentUri(context)
        val contract = options.toCameraContract(uri)

        launchContractWithPromise(contract, options, PickingSource.CAMERA, promise)
      }
    }

    AsyncFunction("launchImageLibraryAsync") { options: ImagePickerOptions, promise: Promise ->
      coroutineScope.launchWithPromiseExceptionHandler(promise) {
        val contract = options.toImageLibraryContract()

        launchContractWithPromise(contract, options, PickingSource.IMAGE_LIBRARY, promise)
      }
    }

    AsyncFunction("getPendingResultAsync") { promise: Promise ->
      coroutineScope.launchWithPromiseExceptionHandler(promise) {
        val (bareResult, options) = pendingMediaPickingResult.ifNull {
          return@launchWithPromiseExceptionHandler promise.resolve(null)
        }.also { pendingMediaPickingResult = null }

        val resultWithExtras = mediaHandler.readExtras(bareResult, options)

        promise.resolve(resultWithExtras)
      }
    }

    // endregion
  }

  private val mediaHandler = MediaHandler(this, this)

  private val currentActivity
    get() = appContext.activityProvider?.currentActivity.ifNull {
      throw MissingCurrentActivityException()
    }

  /**
   * Holds result for an operation that has been interrupted by the activity destruction.
   * The results are stored only for successful, non-cancelled-by-user scenario.
   * Each new picking operation would override previous state (setting `null` for cancelled picking).
   * The user can retrieve the data using exported `getPendingResultAsync` method.
   */
  private var pendingMediaPickingResult: PendingMediaPickingResult? = null

  /**
   * Calls [launchPicker] and unifies flow shared between "launchCameraAsync" and "launchImageLibraryAsync"
   */
  private suspend fun launchContractWithPromise(
    contract: MediaPickerContract,
    options: ImagePickerOptions,
    pickingSource: PickingSource,
    promise: Promise
  ) {
    try {
      val bareResult = launchPicker(contract, options, pickingSource)
      val resultWithExtras = mediaHandler.readExtras(bareResult, options)

      promise.resolve(resultWithExtras)
    } catch (cause: OperationCanceledException) {
      promise.resolve(ImagePickerCancelledResponse())
    } catch (cause: ActivityDestroyedException) {
      pendingMediaPickingResult = cause.data?.let { PendingMediaPickingResult(it, options) }
    }
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
   * TODO(@bbarthec): I'm launching this using [Dispatchers.Main] to properly call [UiThread]/[MainThread] underlying functions
   */
  private suspend fun launchPicker(
    contract: MediaPickerContract,
    options: ImagePickerOptions,
    pickingSource: PickingSource
  ): List<Pair<MediaType, Uri>> = withContext(Dispatchers.Main) {
    val (pickingResult, activityDestroyedWhenPicking) = appContext.launchForActivityResult(contract)

    // Keep track of possible Activity destruction since the picking operation
    var activityDestroyed = activityDestroyedWhenPicking

    /**
     * Picking cancelled:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     */

    /**
     * Picking cancelled:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     */
    if (pickingResult.cancelled) {
      if (activityDestroyed) {
        throw ActivityDestroyedException(null)
      }
      throw OperationCanceledException()
    }

    /**
     * Editing not required:
     * - signal Activity destruction with picked media assets
     * - or return picked media assets
     */

    /**
     * Editing not required:
     * - signal Activity destruction with picked media assets
     * - or return picked media assets
     */
    if (!options.allowsEditing) {
      if (activityDestroyed) {
        throw ActivityDestroyedException(pickingResult.data)
      }
      return@withContext pickingResult.data
    }


    /**
     * Editing required - loop through every picked media asset and possibly edit it.
     * If at some point operation is cancelled then interrupt the loop and immediately:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     * Otherwise:
     * - signal Activity destruction with edited media assets
     * - or return edited media assets
     */


    /**
     * Editing required - loop through every picked media asset and possibly edit it.
     * If at some point operation is cancelled then interrupt the loop and immediately:
     * - signal Activity destruction with no data to be preserved
     * - or signal cancellation
     * Otherwise:
     * - signal Activity destruction with edited media assets
     * - or return edited media assets
     */


    val editedResult = mutableListOf<Pair<MediaType, Uri>>()

    for (pickedMedia in pickingResult.data) {
      // We do not edit video assets
      if (pickedMedia.first == MediaType.VIDEO) {
        editedResult.add(pickedMedia)
        continue
      }

      val (singleEditedResult, activityDestroyedWhenEditing) = appContext.launchForActivityResult(CropImageContract(
        pickedMedia.second,
        options,
        pickingSource
      ))
      activityDestroyed = activityDestroyed && activityDestroyedWhenEditing

      if (singleEditedResult.cancelled) {
        if (activityDestroyed) {
          throw ActivityDestroyedException(null)
        }
        throw OperationCanceledException()
      }

      editedResult.addAll(singleEditedResult.data)
    }

    if (activityDestroyed) {
      throw ActivityDestroyedException(editedResult)
    }
    return@withContext editedResult
  }

  // endregion

  // region Utils

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> {
    return if (writeOnly) {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE)
    }
  }

  private fun ensureTargetActivityIsAvailable(options: ImagePickerOptions) {
    val cameraIntent = Intent(options.mediaTypes.toCameraIntentAction())
    if (cameraIntent.resolveActivity(currentActivity.application.packageManager) == null) {
      throw MissingActivityToHandleIntent(cameraIntent.type)
    }
  }

  private suspend fun ensureCameraPermissionsAreGranted(): Unit = suspendCancellableCoroutine { continuation ->
    val permissions = appContext.permissions.ifNull {
      throw ModuleNotFoundException("Permissions")
    }

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
 * Signalling [Exception] that might holds the optional data that should be preserved for later retrieval.
 * @see [ImagePickerModule.pendingMediaPickingResult]
 */
internal class ActivityDestroyedException(val data: List<Pair<MediaType, Uri>>?): Exception()

/**
 * Simple data structure to hold the data that has to be preserved after the Activity is destroyed.
 */
internal data class PendingMediaPickingResult(
  val data: List<Pair<MediaType, Uri>>,
  val options: ImagePickerOptions
)
