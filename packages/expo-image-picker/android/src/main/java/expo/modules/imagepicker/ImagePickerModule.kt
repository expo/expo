package expo.modules.imagepicker

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import com.theartofdev.edmodo.cropper.CropImage
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.utilities.FileUtilities.generateOutputPath
import expo.modules.core.utilities.ifNull
import expo.modules.imagepicker.ImagePickerOptions.Companion.optionsFromMap
import expo.modules.imagepicker.exporters.CompressionImageExporter
import expo.modules.imagepicker.exporters.CropImageExporter
import expo.modules.imagepicker.exporters.ImageExporter
import expo.modules.imagepicker.exporters.RawImageExporter
import expo.modules.imagepicker.fileproviders.CacheFileProvider
import expo.modules.imagepicker.fileproviders.CropFileProvider
import expo.modules.imagepicker.tasks.ImageResultTask
import expo.modules.imagepicker.tasks.VideoResultTask
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import java.io.IOException
import java.lang.ref.WeakReference

class ImagePickerModule(
  private val mContext: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate(),
  private val pickerResultStore: PickerResultsStore = PickerResultsStore(mContext)
) : ExportedModule(mContext), ActivityEventListener, LifecycleEventListener {

  private var mCameraCaptureURI: Uri? = null
  private var mPromise: Promise? = null
  private var mPickerOptions: ImagePickerOptions? = null
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)
  private var exifDataHandler: ExifDataHandler? = null

  override fun onDestroy() {
    try {
      mUIManager.unregisterLifecycleEventListener(this)
      moduleCoroutineScope.cancel(ModuleDestroyedException(ImagePickerConstants.PROMISES_CANCELED))
    } catch (e: IllegalStateException) {
      Log.e(ImagePickerConstants.TAG, "The scope does not have a job in it")
    }
  }

  /**
   * Android system sometimes kills the `MainActivity` after the `ImagePicker` finishes.
   * Moreover, the react context will be reloaded again in such a case. We need to handle this situation.
   * To do it we track if the current activity was destroyed.
   */
  private var mWasHostDestroyed = false

  private val mImageLoader: ImageLoaderInterface by moduleRegistry()
  private val mUIManager: UIManager by moduleRegistry()
  private val mPermissions: Permissions by moduleRegistry()
  private val mActivityProvider: ActivityProvider by moduleRegistry()

  private lateinit var _experienceActivity: WeakReference<Activity>

  private val experienceActivity: Activity?
    get() {
      if (!this::_experienceActivity.isInitialized) {
        _experienceActivity = WeakReference(mActivityProvider.currentActivity)
      }

      return _experienceActivity.get()
    }

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    mUIManager.registerLifecycleEventListener(this)
  }

  override fun getName() = "ExponentImagePicker"

  //region expo methods

  @ExpoMethod
  fun requestMediaLibraryPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.askForPermissionsWithPermissionsManager(mPermissions, promise, *getMediaLibraryPermissions(writeOnly))
  }

  @ExpoMethod
  fun getMediaLibraryPermissionsAsync(writeOnly: Boolean, promise: Promise) {
    Permissions.getPermissionsWithPermissionsManager(mPermissions, promise, *getMediaLibraryPermissions(writeOnly))
  }

  @ExpoMethod
  fun requestCameraPermissionsAsync(promise: Promise) {
    Permissions.askForPermissionsWithPermissionsManager(mPermissions, promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun getCameraPermissionsAsync(promise: Promise) {
    Permissions.getPermissionsWithPermissionsManager(mPermissions, promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun getPendingResultAsync(promise: Promise) {
    promise.resolve(pickerResultStore.getAllPendingResults())
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ExpoMethod
  fun launchCameraAsync(options: Map<String, Any?>, promise: Promise) {
    val pickerOptions = optionsFromMap(options, promise) ?: return

    val activity = experienceActivity.ifNull {
      promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
      return
    }

    val intentType = if (pickerOptions.mediaTypes == MediaTypes.VIDEOS) MediaStore.ACTION_VIDEO_CAPTURE else MediaStore.ACTION_IMAGE_CAPTURE
    val cameraIntent = Intent(intentType)
    cameraIntent.resolveActivity(activity.application.packageManager).ifNull {
      promise.reject(IllegalStateException("Error resolving activity"))
      return
    }

    val permissionsResponseHandler = PermissionsResponseListener { permissionsResponse: Map<String, PermissionsResponse> ->
      if (permissionsResponse[Manifest.permission.WRITE_EXTERNAL_STORAGE]?.status == PermissionsStatus.GRANTED &&
        permissionsResponse[Manifest.permission.CAMERA]?.status == PermissionsStatus.GRANTED
      ) {
        launchCameraWithPermissionsGranted(promise, cameraIntent, pickerOptions)
      } else {
        promise.reject(SecurityException("User rejected permissions"))
      }
    }

    mPermissions.askForPermissions(permissionsResponseHandler, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA)
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ExpoMethod
  fun launchImageLibraryAsync(options: Map<String, Any?>, promise: Promise) {
    val pickerOptions = optionsFromMap(options, promise) ?: return

    val libraryIntent = Intent().apply {
      when (pickerOptions.mediaTypes) {
        MediaTypes.IMAGES -> type = "image/*"
        MediaTypes.VIDEOS -> type = "video/*"
        MediaTypes.ALL -> {
          type = "*/*"
          putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "video/*"))
        }
      }

      action = Intent.ACTION_GET_CONTENT
    }

    startActivityOnResult(libraryIntent, ImagePickerConstants.REQUEST_LAUNCH_IMAGE_LIBRARY, promise, pickerOptions)
  }

  //endregion

  //region helpers

  private fun getMediaLibraryPermissions(writeOnly: Boolean): Array<String> {
    return if (writeOnly) {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE)
    }
  }

  private fun launchCameraWithPermissionsGranted(promise: Promise, cameraIntent: Intent, pickerOptions: ImagePickerOptions) {
    val imageFile = createOutputFile(
      mContext.cacheDir,
      if (pickerOptions.mediaTypes == MediaTypes.VIDEOS) ".mp4" else ".jpg"
    ).ifNull {
      promise.reject(IOException("Could not create image file."))
      return
    }

    mCameraCaptureURI = uriFromFile(imageFile)

    val activity = experienceActivity.ifNull {
      promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
      return
    }

    mPromise = promise
    mPickerOptions = pickerOptions

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
        uriFromFilePath(generateOutputPath(mContext.cacheDir, ImagePickerConstants.CACHE_DIR_NAME, extension))
      } else {
        uri
      }
    } catch (e: IOException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_OPEN_CROP, ImagePickerConstants.CAN_NOT_OPEN_CROP_MESSAGE, e)
      return
    }

    val cropImageBuilder = CropImage.activity(uri).apply {
      pickerOptions.forceAspect?.let { (x, y) ->
        setAspectRatio((x as Number).toInt(), (y as Number).toInt())
        setFixAspectRatio(true)
        setInitialCropWindowPaddingRatio(0f)
      }

      setOutputUri(fileUri)
      setOutputCompressFormat(compressFormat)
      setOutputCompressQuality(pickerOptions.quality)
    }
    exifDataHandler = ExifDataHandler(uri)
    startActivityOnResult(cropImageBuilder.getIntent(context), CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE, promise, pickerOptions)
  }

  //endregion

  // region ActivityEventListener

  override fun onNewIntent(intent: Intent) = Unit

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (shouldHandleOnActivityResult(activity, requestCode)) {
      mUIManager.unregisterActivityEventListener(this)

      var pickerOptions = mPickerOptions!!
      val promise = if (mWasHostDestroyed && mPromise !is PendingPromise) {
        if (pickerOptions.isBase64) {
          // we know that the activity was killed and we don't want to store
          // base64 into `SharedPreferences`...
          pickerOptions = ImagePickerOptions(
            pickerOptions.quality,
            pickerOptions.isAllowsEditing,
            pickerOptions.forceAspect,
            false,
            pickerOptions.mediaTypes,
            pickerOptions.isExif,
            pickerOptions.videoMaxDuration
          )
          // ...but we need to remember to add it later.
          PendingPromise(pickerResultStore, isBase64 = true)
        } else {
          PendingPromise(pickerResultStore)
        }
      } else {
        mPromise!!
      }

      mPromise = null
      mPickerOptions = null

      handleOnActivityResult(promise, activity, requestCode, resultCode, data, pickerOptions)
    }
  }

  //endregion

  //region activity for result

  private fun startActivityOnResult(intent: Intent, requestCode: Int, promise: Promise, pickerOptions: ImagePickerOptions) {
    experienceActivity
      .ifNull {
        promise.reject(ImagePickerConstants.ERR_MISSING_ACTIVITY, ImagePickerConstants.MISSING_ACTIVITY_MESSAGE)
        return
      }
      .also {
        mUIManager.registerActivityEventListener(this)
        mPromise = promise
        mPickerOptions = pickerOptions
      }
      .startActivityForResult(intent, requestCode)
  }

  private fun shouldHandleOnActivityResult(activity: Activity, requestCode: Int): Boolean {
    return experienceActivity != null &&
      mPromise != null &&
      mPickerOptions != null &&
      // When we launched the crop tool and the android kills current activity, the references can be different.
      // So, we fallback to the requestCode in this case.
      (activity === experienceActivity || mWasHostDestroyed && requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE)
  }

  private fun handleOnActivityResult(promise: Promise, activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?, pickerOptions: ImagePickerOptions) {
    if (resultCode != Activity.RESULT_OK) {
      promise.resolve(
        Bundle().apply {
          putBoolean("cancelled", true)
        }
      )
      return
    }

    val contentResolver = activity.application.contentResolver

    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      val result = CropImage.getActivityResult(intent)
      val exporter = CropImageExporter(result.rotation, result.cropRect, pickerOptions.isBase64)
      ImageResultTask(
        promise,
        result.uri,
        contentResolver,
        CropFileProvider(result.uri),
        pickerOptions.isAllowsEditing,
        pickerOptions.isExif,
        exporter,
        exifDataHandler,
        moduleCoroutineScope
      ).execute()
      return
    }

    val uri = (if (requestCode == ImagePickerConstants.REQUEST_LAUNCH_CAMERA) mCameraCaptureURI else intent?.data)
      .ifNull {
        promise.reject(ImagePickerConstants.ERR_MISSING_URL, ImagePickerConstants.MISSING_URL_MESSAGE)
        return
      }

    val type = getType(contentResolver, uri).ifNull {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_DEDUCE_TYPE, ImagePickerConstants.CAN_NOT_DEDUCE_TYPE_MESSAGE)
      return
    }

    if (type.contains("image")) {
      if (pickerOptions.isAllowsEditing) {
        // if the image is created by camera intent we don't need a new file - it's been already saved
        val needGenerateFile = requestCode != ImagePickerConstants.REQUEST_LAUNCH_CAMERA
        startCropIntent(promise, uri, type, needGenerateFile, pickerOptions)
        return
      }

      val exporter: ImageExporter = if (pickerOptions.quality == ImagePickerConstants.DEFAULT_QUALITY) {
        RawImageExporter(contentResolver, pickerOptions.isBase64)
      } else {
        CompressionImageExporter(mImageLoader, pickerOptions.quality, pickerOptions.isBase64)
      }

      ImageResultTask(
        promise,
        uri,
        contentResolver,
        CacheFileProvider(mContext.cacheDir, deduceExtension(type)),
        pickerOptions.isAllowsEditing,
        pickerOptions.isExif,
        exporter,
        exifDataHandler,
        moduleCoroutineScope
      ).execute()
      return
    }

    try {
      val metadataRetriever = MediaMetadataRetriever().apply {
        setDataSource(mContext, uri)
      }
      VideoResultTask(promise, uri, contentResolver, CacheFileProvider(mContext.cacheDir, ".mp4"), metadataRetriever, moduleCoroutineScope).execute()
    } catch (e: RuntimeException) {
      e.printStackTrace()
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
      return
    }
  }

  //endregion

  //region LifecycleEventListener

  override fun onHostDestroy() {
    mWasHostDestroyed = true
  }

  override fun onHostResume() {
    if (mWasHostDestroyed) {
      _experienceActivity = WeakReference(mActivityProvider.currentActivity)
      mWasHostDestroyed = false
    }
  }
  override fun onHostPause() = Unit

  //endregion
}
