package expo.modules.imagepicker

import android.Manifest
import android.app.Activity
import android.content.ContentResolver
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import androidx.core.os.bundleOf
import com.canhub.cropper.CropImage
import expo.modules.core.Promise
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.FileUtilities.generateOutputPath
import expo.modules.core.utilities.ifNull
import expo.modules.imagepicker.exporters.CompressionImageExporter
import expo.modules.imagepicker.exporters.CropImageExporter
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.RawImageExporter
import expo.modules.imagepicker.fileproviders.CacheFileProvider
import expo.modules.imagepicker.fileproviders.CropFileProvider
import expo.modules.imagepicker.tasks.ImageResultTask
import expo.modules.imagepicker.tasks.VideoResultTask
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.events.OnActivityResultPayload
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import java.io.IOException

internal data class PickingContext(
  val promise: Promise,
  val options: ImagePickerOptions,
  val cameraCaptureUri: Uri? = null
)

class ImagePickerModule : Module() {
  // TODO(@bbarthec) find solution to access nonnullable reactContext here
  private val pickerResultStore: PickerResultsStore = PickerResultsStore(appContext.reactContext!!)
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  private var exifDataHandler: ExifDataHandler? = null

  // TODO(@bbarthec): check if the newer version of cropping library has fixed the problem
  /**
   * Android system sometimes kills the `MainActivity` after the `ImagePicker` finishes.
   * Moreover, the react context will be reloaded again in such a case. We need to handle this situation.
   * To do it we track if the current activity was destroyed.
   * Flag indicating that the main activity (host) was killed while performing cropping.
   */
  private var mWasHostDestroyedWhileCropping = false

  private var currentPickingContext: PickingContext? = null
  private fun popCurrentPickingContext(): PickingContext? {
    val pickingContext = currentPickingContext.ifNull {
      return null
    }.also {
      currentPickingContext = null
    }

    val (promise, options) = if (mWasHostDestroyedWhileCropping && pickingContext.promise !is PendingPromise) {
      if (pickingContext.options.base64) {
        // we know that the activity was killed and we don't want to store
        // base64 into `SharedPreferences`...
        val options = pickingContext.options.apply {
          this.base64 = false
        }
        // ...but we need to remember to add it later.
        Pair(PendingPromise(pickerResultStore, isBase64 = true), options)
      } else {
        Pair(PendingPromise(pickerResultStore), pickingContext.options)
      }
    } else {
      Pair(pickingContext.promise, pickingContext.options)
    }

    return PickingContext(promise, options, pickingContext.cameraCaptureUri)
  }


  override fun definition() = ModuleDefinition {
    // TODO(@bbarthec): rename to ExpoImagePicker
    name("ExponentImagePicker")

    // region JS API

    function("requestMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, *getMediaLibraryPermissions(writeOnly))
    }

    function("getMediaLibraryPermissionsAsync") { writeOnly: Boolean, promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, *getMediaLibraryPermissions(writeOnly))
    }

    function("requestCameraPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    function("getCameraPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.CAMERA)
    }

    function("getPendingResultAsync") { promise: Promise ->
      promise.resolve(pickerResultStore.getAllPendingResults())
    }

    // NOTE: Currently not reentrant / doesn't support concurrent requests
    function("launchCameraAsync") { options: ImagePickerOptions, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity.ifNull {
        return@function promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
      }

      val intentType = if (options.mediaTypes == MediaTypes.VIDEOS) MediaStore.ACTION_VIDEO_CAPTURE else MediaStore.ACTION_IMAGE_CAPTURE
      val cameraIntent = Intent(intentType)
      cameraIntent.resolveActivity(activity.application.packageManager).ifNull {
        return@function promise.reject(IllegalStateException("Error resolving activity"))
      }

      appContext.permissions.ifNull {
        return@function promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      }.askForPermissions({ permissionsResponse: Map<String, PermissionsResponse> ->
        if (permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
          permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
        ) {
          launchCameraWithPermissionsGranted(promise, cameraIntent, options)
        } else {
          promise.reject(SecurityException("User rejected permissions"))
        }
      }, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA)
    }

    // NOTE: Currently not reentrant / doesn't support concurrent requests
    function("launchImageLibraryAsync") { options: ImagePickerOptions, promise: Promise ->
      val libraryIntent = options.mediaTypes.toIntent()
      val pickingContext = PickingContext(promise, options)
      startActivityForResult(libraryIntent, ImagePickerConstants.REQUEST_LAUNCH_IMAGE_LIBRARY, pickingContext)
    }

    // endregion

    // region Handle Activity result

    onActivityResult { activity, onActivityResultPayload ->
      if (shouldHandleOnActivityResult(activity, onActivityResultPayload.requestCode)) {
        // TODO(@bbarthec): is it needed when using SweetAPI?
//        mUIManager.unregisterActivityEventListener(this)

        val pickingContext = popCurrentPickingContext().ifNull {
          // TODO(@bbarthec): unreachable, but we probably need to log it somehow
          return@onActivityResult
        }

        handleOnActivityResult(activity, onActivityResultPayload, pickingContext)
      }
    }

    // endregion

    // region Activity Lifecycle

    onActivityDestroys {
      mWasHostDestroyedWhileCropping = true
    }

    onActivityEntersForeground {
      if (mWasHostDestroyedWhileCropping) {
        mWasHostDestroyedWhileCropping = false
      }
    }

    // endregion

    // region Module Lifecycle

    onDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException(ImagePickerConstants.PROMISES_CANCELED))
      } catch (e: IllegalStateException) {
        Log.e(ImagePickerConstants.TAG, "The scope does not have a job in it")
      }
    }

    // endregion
  }

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> {
    return if (writeOnly) {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE)
    }
  }

  private fun launchCameraWithPermissionsGranted(promise: Promise, cameraIntent: Intent, options: ImagePickerOptions) {
    val activity = appContext.activityProvider?.currentActivity.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
    }
    val context = appContext.reactContext.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_CONTEXT, ImagePickerConstants.MISSING_CONTEXT_MESSAGE)
    }

    val imageFile = createOutputFile(context.cacheDir, if (options.mediaTypes == MediaTypes.VIDEOS) ".mp4" else ".jpg").ifNull {
      return promise.reject(IOException("Could not create image file."))
    }

    val pickingContext = PickingContext(promise, options, uriFromFile(imageFile))

    if (options.videoMaxDuration > 0) {
      cameraIntent.putExtra(MediaStore.EXTRA_DURATION_LIMIT, options.videoMaxDuration)
    }

    // camera intent needs a content URI but we need a file one
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, contentUriFromFile(imageFile, activity.application))
    startActivityForResult(cameraIntent, ImagePickerConstants.REQUEST_LAUNCH_CAMERA, pickingContext)
  }

  //region asynchronous flow ActivityForResult

  private fun startActivityForResult(intent: Intent, requestCode: Int, pickingContext: PickingContext) {
    appContext.activityProvider?.currentActivity.ifNull {
      return pickingContext.promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
    }.also {
      currentPickingContext = pickingContext
      // TODO(@bbarthec): is it needed while using Sweet API?
      // mUIManager.registerActivityEventListener(this)
    }.startActivityForResult(intent, requestCode)
  }

  private fun shouldHandleOnActivityResult(activity: Activity, requestCode: Int): Boolean {
    return appContext.activityProvider?.currentActivity != null &&
      currentPickingContext != null &&
      // When we launched the crop tool and the android kills current activity, the references can be different.
      // So, we fallback to the requestCode in this case.
      (activity === appContext.activityProvider?.currentActivity || mWasHostDestroyedWhileCropping && requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE)
  }

  private fun handleOnActivityResult(activity: Activity, onActivityResultPayload: OnActivityResultPayload, pickingContext: PickingContext) {
    val (promise, _, cameraCaptureUri) = pickingContext
    val (requestCode, resultCode, data) = onActivityResultPayload
    if (resultCode != Activity.RESULT_OK) {
      return promise.resolve(
        bundleOf(
          "cancelled" to true
        )
      )
    }

    val contentResolver = activity.application.contentResolver

    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      return handleCroppingResult(contentResolver, onActivityResultPayload, pickingContext)
    }

    val uri = (if (requestCode == ImagePickerConstants.REQUEST_LAUNCH_CAMERA) cameraCaptureUri else data?.data).ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_URL, ImagePickerConstants.MISSING_URL_MESSAGE)
    }
    val type = getType(contentResolver, uri).ifNull {
      return promise.reject(ImagePickerConstants.ERR_CAN_NOT_DEDUCE_TYPE, ImagePickerConstants.CAN_NOT_DEDUCE_TYPE_MESSAGE)
    }

    if (type.contains("image")) {
      return handleImageResult(contentResolver, onActivityResultPayload, pickingContext, uri, type)
    }

    return handleVideoResult(contentResolver, pickingContext, uri)
  }

  private fun handleCroppingResult(contentResolver: ContentResolver, onActivityResultPayload: OnActivityResultPayload, pickingContext: PickingContext) {
    val result = CropImage.getActivityResult(onActivityResultPayload.data).ifNull {
      return pickingContext.promise.reject(ImagePickerConstants.ERR_CROPPING_FAILURE, ImagePickerConstants.CROPPING_FAILURE_MESSAGE)
    }

    val (promise, options) = pickingContext
    val exporter = CropImageExporter(result.rotation, result.cropRect, options.base64)
    return ImageResultTask(
      promise,
      result.uri,
      contentResolver,
      CropFileProvider(result.uri),
      options.allowsEditing,
      options.exif,
      exporter,
      exifDataHandler,
      moduleCoroutineScope
    ).execute()
  }

  private fun handleImageResult(contentResolver: ContentResolver, onActivityResultPayload: OnActivityResultPayload, pickingContext: PickingContext, uri: Uri, type: String) {
    val (promise, options) = pickingContext
    if (options.allowsEditing) {
      // if the image is created by camera intent we don't need a new file - it's been already saved
      val needGenerateFile = onActivityResultPayload.requestCode != ImagePickerConstants.REQUEST_LAUNCH_CAMERA
      return startCropIntent(pickingContext, uri, type, needGenerateFile)
    }

    val imageLoader = appContext.imageLoader.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_MODULE, ImagePickerConstants.MISSING_IMAGE_LOADER_MODULE_MESSAGE)
    }

    val context = appContext.reactContext.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_CONTEXT, ImagePickerConstants.MISSING_CONTEXT_MESSAGE)
    }

    val exporter: ImageExporter = if (options.quality == ImagePickerConstants.MAXIMUM_QUALITY) {
      RawImageExporter(contentResolver, options.base64)
    } else {
      CompressionImageExporter(imageLoader, options.quality, options.base64)
    }

    return ImageResultTask(
      promise,
      uri,
      contentResolver,
      CacheFileProvider(context.cacheDir, deduceExtension(type)),
      options.allowsEditing,
      options.exif,
      exporter,
      exifDataHandler,
      moduleCoroutineScope
    ).execute()
  }

  private fun handleVideoResult(contentResolver: ContentResolver, pickingContext: PickingContext, uri: Uri) {
    val (promise) = pickingContext
    val context = appContext.reactContext.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_CONTEXT, ImagePickerConstants.MISSING_CONTEXT_MESSAGE)
    }

    try {
      val metadataRetriever = MediaMetadataRetriever().apply {
        setDataSource(context, uri)
      }
      VideoResultTask(promise, uri, contentResolver, CacheFileProvider(context.cacheDir, ".mp4"), metadataRetriever, moduleCoroutineScope).execute()
    } catch (e: RuntimeException) {
      e.printStackTrace()
      return promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
    }
  }

  /**
   * Starts the crop intent.
   * @param pickingContext Current picking context
   * @param uri Uri to file which will be cropped
   * @param type Media type of source file
   * @param needGenerateFile Tells if generating a new file is needed
   */
  private fun startCropIntent(pickingContext: PickingContext, uri: Uri, type: String, needGenerateFile: Boolean) {
    val (promise, options) = pickingContext

    var extension = ".jpg"
    var compressFormat = Bitmap.CompressFormat.JPEG
    // if the image is created by camera intent we don't need a new path - it's been already saved
    when {
      type.contains("png") -> {
        compressFormat = Bitmap.CompressFormat.PNG
        extension = ".png"
      }
      type.contains("gif") -> {
        // If we allow editing, the result image won't ever be a GIF as the cropper doesn't support it.
        // Let's convert to PNG in such case.
        extension = ".png"
        compressFormat = Bitmap.CompressFormat.PNG
      }
      type.contains("bmp") -> {
        // If we allow editing, the result image won't ever be a BMP as the cropper doesn't support it.
        // Let's convert to PNG in such case.
        extension = ".png"
        compressFormat = Bitmap.CompressFormat.PNG
      }
      !type.contains("jpeg") -> {
        Log.w(ImagePickerConstants.TAG, "Image type not supported. Falling back to JPEG instead.")
        extension = ".jpg"
      }
    }

    val context = appContext.reactContext.ifNull {
      return promise.reject(ImagePickerConstants.ERR_MISSING_CONTEXT, ImagePickerConstants.MISSING_CONTEXT_MESSAGE)
    }

    val fileUri: Uri = try {
      if (needGenerateFile) {
        uriFromFilePath(generateOutputPath(context.cacheDir, ImagePickerConstants.CACHE_DIR_NAME, extension))
      } else {
        uri
      }
    } catch (e: IOException) {
      return promise.reject(ImagePickerConstants.ERR_CAN_NOT_OPEN_CROP, ImagePickerConstants.CAN_NOT_OPEN_CROP_MESSAGE, e)
    }

    val cropImageBuilder = CropImage.activity(uri).apply {
      options.forceAspect?.let { (x, y) ->
        setAspectRatio(x, y)
        setFixAspectRatio(true)
        setInitialCropWindowPaddingRatio(0f)
      }

      setOutputUri(fileUri)
      setOutputCompressFormat(compressFormat)
      setOutputCompressQuality((options.quality * 100).toInt())
    }
    exifDataHandler = ExifDataHandler(uri)
    startActivityForResult(cropImageBuilder.getIntent(context), CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE, pickingContext)
  }

  //endregion
}
