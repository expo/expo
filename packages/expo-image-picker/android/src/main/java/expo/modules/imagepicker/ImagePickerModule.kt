package expo.modules.imagepicker

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.core.errors.ModuleNotFoundException
import android.os.OperationCanceledException
import expo.modules.imagepicker.contracts.CameraContract
import expo.modules.imagepicker.contracts.CameraContractOptions
import expo.modules.imagepicker.contracts.CropImageContract
import expo.modules.imagepicker.contracts.CropImageContractOptions
import expo.modules.imagepicker.contracts.ImageLibraryContract
import expo.modules.imagepicker.contracts.ImageLibraryContractOptions
import expo.modules.imagepicker.contracts.ImagePickerContractResult
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
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
      val contractOptions = options.toCameraContractOptions(uri)

      launchContract({ cameraLauncher.launch(contractOptions) }, options)
    }

    AsyncFunction("launchImageLibraryAsync") Coroutine { options: ImagePickerOptions ->
      val contractOptions = options.toImageLibraryContractOptions()
      launchContract({ imageLibraryLauncher.launch(contractOptions) }, options)
    }

    AsyncFunction("getPendingResultAsync") Coroutine { ->
      val (bareResult, options) = pendingMediaPickingResult ?: return@Coroutine null

      pendingMediaPickingResult = null

      mediaHandler.readExtras(bareResult, options)
    }

    // endregion

    OnCreate {
      coroutineScope.launch {
        withContext(Dispatchers.Main) {
          cameraLauncher = appContext.registerForActivityResult(
            CameraContract(this@ImagePickerModule),
          ) { input, result -> handleResultUponActivityDestruction(result, input.options) }
          imageLibraryLauncher = appContext.registerForActivityResult(
            ImageLibraryContract(this@ImagePickerModule),
          ) { input, result -> handleResultUponActivityDestruction(result, input.options) }
          cropImageLauncher = appContext.registerForActivityResult(
            CropImageContract(this@ImagePickerModule),
          ) { input, result -> handleResultUponActivityDestruction(result, input.options) }
        }
      }
    }
  }

  // TODO (@bbarthec): generalize it as almost every module re-declares this approach
  val context: Context
    get() = requireNotNull(appContext.reactContext) { "React Application Context is null" }

  private val currentActivity
    get() = appContext.activityProvider?.currentActivity ?: throw MissingCurrentActivityException()

  private val mediaHandler = MediaHandler(this)

  private lateinit var cameraLauncher: AppContextActivityResultLauncher<CameraContractOptions, ImagePickerContractResult>
  private lateinit var imageLibraryLauncher: AppContextActivityResultLauncher<ImageLibraryContractOptions, ImagePickerContractResult>
  private lateinit var cropImageLauncher: AppContextActivityResultLauncher<CropImageContractOptions, ImagePickerContractResult>

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
  private suspend fun launchContract(
    pickerLauncher: suspend () -> ImagePickerContractResult,
    options: ImagePickerOptions,
  ): Any {
    return try {
      var result = launchPicker(pickerLauncher)
      if (
        !options.allowsMultipleSelection &&
        options.allowsEditing &&
        result.data.size == 1 &&
        result.data[0].first == MediaType.IMAGE
      ) {
        result = launchPicker {
          cropImageLauncher.launch(CropImageContractOptions(result.data[0].second, options))
        }
      }
      mediaHandler.readExtras(result.data, options)
    } catch (cause: OperationCanceledException) {
      ImagePickerCancelledResponse()
    }
  }

  /**
   * Function that would store the results coming from 3-rd party Activity in case Android decides to
   * destroy the launching application that is backgrounded.
   */
  private fun handleResultUponActivityDestruction(result: ImagePickerContractResult, options: ImagePickerOptions) {
    if (result is ImagePickerContractResult.Success) {
      pendingMediaPickingResult = PendingMediaPickingResult(result.data, options)
    }
  }

  /**
   * Launches picker (image library or camera)
   */
  private suspend fun launchPicker(
    pickerLauncher: suspend () -> ImagePickerContractResult,
  ): ImagePickerContractResult.Success = withContext(Dispatchers.Main) {
    when (val pickingResult = pickerLauncher()) {
      is ImagePickerContractResult.Success -> pickingResult
      is ImagePickerContractResult.Cancelled -> throw OperationCanceledException()
    }
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

    permissions.askForPermissions(
      { permissionsResponse ->
        if (
          permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
          permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
        ) {
          continuation.resume(Unit)
        } else {
          continuation.resumeWithException(UserRejectedPermissionsException())
        }
      },
      Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA
    )
  }

  // endregion
}

/**
 * Simple data structure to hold the data that has to be preserved after the Activity is destroyed.
 */
internal data class PendingMediaPickingResult(
  val data: List<Pair<MediaType, Uri>>,
  val options: ImagePickerOptions
)
