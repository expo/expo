package expo.modules.imagepicker

import android.Manifest
import android.Manifest.permission.READ_MEDIA_IMAGES
import android.Manifest.permission.READ_MEDIA_VIDEO
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.OperationCanceledException
import androidx.core.content.ContextCompat
import expo.modules.core.errors.ModuleNotFoundException
import expo.modules.imagepicker.contracts.CameraContract
import expo.modules.imagepicker.contracts.CameraContractOptions
import expo.modules.imagepicker.contracts.CropImageContract
import expo.modules.imagepicker.contracts.CropImageContractOptions
import expo.modules.imagepicker.contracts.ImageLibraryContract
import expo.modules.imagepicker.contracts.ImageLibraryContractOptions
import expo.modules.imagepicker.contracts.ImagePickerContractResult
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.weak
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO(@bbarthec): rename to ExpoImagePicker
private const val moduleName = "ExponentImagePicker"

const val ACCESS_PRIVILEGES_PERMISSION_KEY = "accessPrivileges"

class ImagePickerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(moduleName)

    // region JS API

    AsyncFunction("requestMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      val manager = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()
      val permissions = getMediaLibraryPermissions(writeOnly)
      manager.askForPermissions(createPermissionsDecorator(promise), *permissions)
    }

    AsyncFunction("getMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      val manager = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()
      val permissions = getMediaLibraryPermissions(writeOnly)
      manager.getPermissions(createPermissionsDecorator(promise), *permissions)
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

      val mediaFile = createOutputFile(cacheDirectory, options.mediaTypes.toFileExtension())
      val uri = mediaFile.toContentUri(context)
      val contractOptions = options.toCameraContractOptions(uri.toString())

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

    RegisterActivityContracts {
      cameraLauncher = registerForActivityResult(
        CameraContract(this@ImagePickerModule)
      ) { input, result -> handleResultUponActivityDestruction(result, input.options) }

      imageLibraryLauncher = registerForActivityResult(
        ImageLibraryContract(this@ImagePickerModule)
      ) { input, result -> handleResultUponActivityDestruction(result, input.options) }

      cropImageLauncher = registerForActivityResult(
        CropImageContract(this@ImagePickerModule)
      ) { input, result -> handleResultUponActivityDestruction(result, input.options) }
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

  private val cacheDirectory: File
    get() = appContext.cacheDirectory

  /**
   * Stores result for an operation that has been interrupted by the activity destruction.
   * The results are stored only for successful, non-cancelled-by-user scenario.
   * Each new picking operation overrides previous state (for cancelled operation `null` is set).
   * The user can retrieve the data using exported `getPendingResultAsync` method.
   */
  private var pendingMediaPickingResult: PendingMediaPickingResult? = null

  private var isPickerOpen = false

  private fun createPermissionsDecorator(promise: Promise): PermissionsResponseListener {
    val weakContext = appContext.reactContext.weak()
    return PermissionsResponseListener { permissionsMap ->
      val areAllGranted = permissionsMap.all { (_, response) -> response.status == PermissionsStatus.GRANTED }
      val areAllDenied = permissionsMap.isNotEmpty() && permissionsMap.all { (_, response) -> response.status == PermissionsStatus.DENIED }
      val canAskAgain = permissionsMap.all { (_, response) -> response.canAskAgain }

      val permissionsBundle =
        Bundle().apply {
          putString(PermissionsResponse.EXPIRES_KEY, PermissionsResponse.PERMISSION_EXPIRES_NEVER)
          putString(
            PermissionsResponse.STATUS_KEY,
            when {
              areAllGranted -> PermissionsStatus.GRANTED.status
              areAllDenied -> PermissionsStatus.DENIED.status
              else -> PermissionsStatus.UNDETERMINED.status
            }
          )
          putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, canAskAgain)
          putBoolean(PermissionsResponse.GRANTED_KEY, areAllGranted)
        }

      if (areAllGranted) {
        permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, "all")
        promise.resolve(permissionsBundle)
        return@PermissionsResponseListener
      }

      // On Android < 14 we always return `all` or `none`, since it doesn't support limited access
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, "none")

        promise.resolve(permissionsBundle)
        return@PermissionsResponseListener
      }

      val context = weakContext.get() ?: run {
        promise.reject(Exceptions.ReactContextLost())
        return@PermissionsResponseListener
      }

      // For photo and video access android will return DENIED status if the user selected "allow only selected"
      // We need to check if that is the case and overwrite the result.
      val hasPartialAccess = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) == PackageManager.PERMISSION_GRANTED
      if (hasPartialAccess) {
        permissionsBundle.putBoolean(PermissionsResponse.GRANTED_KEY, true)
        permissionsBundle.putBoolean(PermissionsResponse.CAN_ASK_AGAIN_KEY, true)
        permissionsBundle.putString(PermissionsResponse.STATUS_KEY, PermissionsStatus.GRANTED.status)
        permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, "limited")
      } else {
        permissionsBundle.putString(ACCESS_PRIVILEGES_PERMISSION_KEY, "none")
      }

      promise.resolve(permissionsBundle)
    }
  }

  /**
   * Calls [launchPicker] and unifies flow shared between "launchCameraAsync" and "launchImageLibraryAsync"
   */
  private suspend fun launchContract(
    pickerLauncher: suspend () -> ImagePickerContractResult,
    options: ImagePickerOptions
  ): Any {
    return try {
      if (isPickerOpen) {
        return ImagePickerResponse(canceled = true)
      }

      isPickerOpen = true
      var result = launchPicker(pickerLauncher)
      if (
        !options.allowsMultipleSelection &&
        options.allowsEditing &&
        result.data.size == 1 &&
        result.data[0].first == MediaType.IMAGE
      ) {
        result = launchPicker {
          cropImageLauncher.launch(CropImageContractOptions(result.data[0].second.toString(), options))
        }
      }
      mediaHandler.readExtras(result.data, options)
    } catch (cause: OperationCanceledException) {
      return ImagePickerResponse(canceled = true)
    } finally {
      isPickerOpen = false
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
    pickerLauncher: suspend () -> ImagePickerContractResult
  ): ImagePickerContractResult.Success = withContext(Dispatchers.IO) {
    when (val pickingResult = pickerLauncher()) {
      is ImagePickerContractResult.Success -> pickingResult
      is ImagePickerContractResult.Cancelled -> throw OperationCanceledException()
      is ImagePickerContractResult.Error -> throw FailedToPickMediaException()
    }
  }

  // endregion

  // region Utils

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      listOfNotNull(
        READ_MEDIA_IMAGES,
        READ_MEDIA_VIDEO
      ).toTypedArray()
    } else {
      listOfNotNull(
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.READ_EXTERNAL_STORAGE.takeIf { !writeOnly }
      ).toTypedArray()
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          if (permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED) {
            continuation.resume(Unit)
          } else {
            continuation.resumeWithException(UserRejectedPermissionsException())
          }
        } else if (
          permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
          permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
        ) {
          continuation.resume(Unit)
        } else {
          continuation.resumeWithException(UserRejectedPermissionsException())
        }
      },
      *listOfNotNull(
        Manifest.permission.WRITE_EXTERNAL_STORAGE.takeIf { Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU },
        Manifest.permission.CAMERA
      ).toTypedArray()
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
