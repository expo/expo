package expo.modules.imagepicker

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import com.canhub.cropper.CropImage
import expo.modules.core.errors.ModuleNotFoundException
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
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException

private const val moduleName = "ExponentImagePicker"

class ImagePickerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React Application Context is null. You can't access the Context at this point.")

  private lateinit var pickerResultStore: PickerResultsStore
  private var cameraCaptureURI: Uri? = null
  private var promise: Promise? = null
  private var pickerOptions: ImagePickerOptions? = null
  private var exifDataHandler: ExifDataHandler? = null

  /**
   * Android system sometimes kills the `MainActivity` after the `ImagePicker` finishes.
   * Moreover, the react context will be reloaded again in such a case. We need to handle this situation.
   * To do it we track if the current activity was destroyed.
   * Flag indicating that the main activity (host) was killed while performing cropping.
   */
  private var wasHostDestroyedWhileCropping = false

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
      val activity = appContext.currentActivity ?: throw MissingCurrentActivityException()

      val permissions = appContext.permissions ?: throw ModuleNotFoundException("permissions")

      val intentType = if (options.mediaTypes == MediaTypes.VIDEOS) {
        MediaStore.ACTION_VIDEO_CAPTURE
      } else {
        MediaStore.ACTION_IMAGE_CAPTURE
      }
      val cameraIntent = Intent(intentType)
      cameraIntent.resolveActivity(activity.application.packageManager) ?: throw MissingActivityToHandleIntent(intentType)

      val permissionsResponseHandler = PermissionsResponseListener { permissionsResponse: Map<String, PermissionsResponse> ->
        if (permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
          permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
        ) {
          launchCameraWithPermissionsGranted(promise, cameraIntent, options)
        } else {
          promise.reject(UserRejectedPermissionsException())
        }
      }

      permissions.askForPermissions(permissionsResponseHandler, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA)
    }

    AsyncFunction("launchImageLibraryAsync") { options: ImagePickerOptions, promise: Promise ->
      val libraryIntent = Intent().apply {
        when (options.mediaTypes) {
          MediaTypes.IMAGES -> type = "image/*"
          MediaTypes.VIDEOS -> type = "video/*"
          MediaTypes.ALL -> {
            type = "*/*"
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "video/*"))
          }
        }

        action = Intent.ACTION_GET_CONTENT
      }

      startActivityOnResult(libraryIntent, ImagePickerConstants.REQUEST_LAUNCH_IMAGE_LIBRARY, promise, options)
    }

    AsyncFunction("getPendingResultAsync") { promise: Promise ->
      promise.resolve(pickerResultStore.getAllPendingResults())
    }

    // endregion

    // region Module and Activity lifecycles

    OnCreate {
      pickerResultStore = PickerResultsStore(context)
    }

    OnActivityDestroys {
      wasHostDestroyedWhileCropping = true
    }

    OnActivityEntersForeground {
      wasHostDestroyedWhileCropping = false
    }

    OnActivityResult { activity, (requestCode, resultCode, data) ->
      if (shouldHandleOnActivityResult(activity, requestCode)) {
        var pickerOptions = pickerOptions!!
        val promise = if (wasHostDestroyedWhileCropping && promise !is PendingPromise) {
          if (pickerOptions.base64) {
            // we know that the activity was killed and we don't want to store
            // base64 into `SharedPreferences`...
            pickerOptions = ImagePickerOptions().apply {
              quality = pickerOptions.quality
              allowsEditing = pickerOptions.allowsEditing
              aspect = pickerOptions.aspect
              base64 = false
              mediaTypes = pickerOptions.mediaTypes
              exif = pickerOptions.exif
              videoMaxDuration = pickerOptions.videoMaxDuration
            }
            // ...but we need to remember to add it later.
            PendingPromise(pickerResultStore, isBase64 = true)
          } else {
            PendingPromise(pickerResultStore)
          }
        } else {
          promise!!
        }

        this@ImagePickerModule.promise = null
        this@ImagePickerModule.pickerOptions = null

        handleOnActivityResult(promise, activity, requestCode, resultCode, data, pickerOptions)
      }
    }

    // endregion
  }

  // endregion

  // region helpers

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> =
    if (writeOnly) {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE)
    }

  private fun launchCameraWithPermissionsGranted(promise: Promise, cameraIntent: Intent, pickerOptions: ImagePickerOptions) {
    val imageFile = createOutputFile(
      context.cacheDir,
      if (pickerOptions.mediaTypes == MediaTypes.VIDEOS) ".mp4" else ".jpg"
    ) ?: return promise.reject(FailedToCreateFileException())

    cameraCaptureURI = uriFromFile(imageFile)

    val activity = appContext.currentActivity ?: return promise.reject(MissingCurrentActivityException())

    this.promise = promise
    this.pickerOptions = pickerOptions

    if (pickerOptions.videoMaxDuration > 0) {
      cameraIntent.putExtra(MediaStore.EXTRA_DURATION_LIMIT, pickerOptions.videoMaxDuration)
    }

    // camera intent needs a content URI but we need a file one
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, contentUriFromFile(imageFile, activity.application))
    startActivityOnResult(cameraIntent, ImagePickerConstants.REQUEST_LAUNCH_CAMERA, promise, pickerOptions)
  }

  /**
   * Starts the crop intent.
   *
   * @param promise Promise which will be rejected if something goes wrong
   * @param uri Uri to file which will be cropped
   * @param type Media type of source file
   * @param needGenerateFile Tells if generating a new file is needed
   * @param pickerOptions Additional options
   */
  private fun startCropIntent(promise: Promise, uri: Uri, type: String, needGenerateFile: Boolean, pickerOptions: ImagePickerOptions) {
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

    val fileUri: Uri = try {
      if (needGenerateFile) {
        uriFromFilePath(generateOutputPath(context.cacheDir, ImagePickerConstants.CACHE_DIR_NAME, extension))
      } else {
        uri
      }
    } catch (e: IOException) {
      return promise.reject(CroppingFailedException(e))
    }

    val cropImageBuilder = CropImage.activity(uri).apply {
      pickerOptions.aspect?.let { (x, y) ->
        setAspectRatio((x as Number).toInt(), (y as Number).toInt())
        setFixAspectRatio(true)
        setInitialCropWindowPaddingRatio(0f)
      }

      setOutputUri(fileUri)
      setOutputCompressFormat(compressFormat)
      setOutputCompressQuality((pickerOptions.quality * 100).toInt())
    }
    exifDataHandler = ExifDataHandler(uri)
    startActivityOnResult(cropImageBuilder.getIntent(context), CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE, promise, pickerOptions)
  }

  // endregion

  // region activity for result

  private fun startActivityOnResult(intent: Intent, requestCode: Int, promise: Promise, pickerOptions: ImagePickerOptions) {
    appContext.currentActivity
      .ifNull {
        return promise.reject(MissingCurrentActivityException())
      }
      .also {
        this.promise = promise
        this.pickerOptions = pickerOptions
      }
      .startActivityForResult(intent, requestCode)
  }

  private fun shouldHandleOnActivityResult(activity: Activity, requestCode: Int): Boolean {
    return appContext.currentActivity != null &&
      promise != null &&
      pickerOptions != null &&
      // When we launched the crop tool and the android kills current activity, the references can be different.
      // So, we fallback to the requestCode in this case.
      (activity === appContext.currentActivity || wasHostDestroyedWhileCropping && requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE)
  }

  private fun handleOnActivityResult(promise: Promise, activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?, pickerOptions: ImagePickerOptions) {
    if (resultCode != Activity.RESULT_OK) {
      return promise.resolve(ImagePickerCancelledResponse())
    }

    val contentResolver = activity.application.contentResolver

    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      val result = CropImage.getActivityResult(intent) ?: return promise.reject(CroppingFailedException())

      val exporter = CropImageExporter(result.rotation, result.cropRect, pickerOptions.base64)
      ImageResultTask(
        promise,
        result.uri,
        contentResolver,
        CropFileProvider(result.uri),
        pickerOptions.allowsEditing,
        pickerOptions.exif,
        exporter,
        exifDataHandler,
        coroutineScope
      ).execute()
      return
    }

    val uri = (if (requestCode == ImagePickerConstants.REQUEST_LAUNCH_CAMERA) cameraCaptureURI else intent?.data)
      ?: return promise.reject(FailedToReadDataException())

    val type = getType(contentResolver, uri) ?: return promise.reject(FailedToDeduceTypeException())

    if (type.contains("image")) {
      if (pickerOptions.allowsEditing) {
        // if the image is created by camera intent we don't need a new file - it's been already saved
        val needGenerateFile = requestCode != ImagePickerConstants.REQUEST_LAUNCH_CAMERA
        startCropIntent(promise, uri, type, needGenerateFile, pickerOptions)
        return
      }

      val exporter: ImageExporter = if (pickerOptions.quality == ImagePickerConstants.MAXIMUM_QUALITY) {
        RawImageExporter(contentResolver, pickerOptions.base64)
      } else {
        val imageLoader = appContext.imageLoader ?: return promise.reject(MissingModuleException("ImageLoader"))
        CompressionImageExporter(imageLoader, pickerOptions.quality, pickerOptions.base64)
      }

      ImageResultTask(
        promise,
        uri,
        contentResolver,
        CacheFileProvider(context.cacheDir, deduceExtension(type)),
        pickerOptions.allowsEditing,
        pickerOptions.exif,
        exporter,
        exifDataHandler,
        coroutineScope
      ).execute()
      return
    }

    try {
      val metadataRetriever = MediaMetadataRetriever().apply {
        setDataSource(context, uri)
      }
      VideoResultTask(promise, uri, contentResolver, CacheFileProvider(context.cacheDir, ".mp4"), metadataRetriever, coroutineScope).execute()
    } catch (e: RuntimeException) {
      promise.reject(FailedToExtractVideoMetadataException(e))
      return
    }
  }

  // endregion
}
