package abi49_0_0.host.exp.exponent

import abi49_0_0.expo.modules.application.ApplicationPackage
import abi49_0_0.expo.modules.av.AVPackage
import abi49_0_0.expo.modules.av.video.VideoViewModule
import abi49_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage
import abi49_0_0.expo.modules.barcodescanner.BarCodeScannerModule
import abi49_0_0.expo.modules.barcodescanner.BarCodeScannerPackage
import abi49_0_0.expo.modules.battery.BatteryPackage
import abi49_0_0.expo.modules.brightness.BrightnessModule
import abi49_0_0.expo.modules.calendar.CalendarPackage
import abi49_0_0.expo.modules.camera.CameraViewModule
import abi49_0_0.expo.modules.cellular.CellularModule
import abi49_0_0.expo.modules.clipboard.ClipboardModule
import abi49_0_0.expo.modules.constants.ConstantsModule
import abi49_0_0.expo.modules.constants.ConstantsPackage
import abi49_0_0.expo.modules.contacts.ContactsPackage
import abi49_0_0.expo.modules.core.interfaces.Package
import abi49_0_0.expo.modules.crypto.CryptoModule
import abi49_0_0.expo.modules.device.DeviceModule
import abi49_0_0.expo.modules.documentpicker.DocumentPickerModule
import abi49_0_0.expo.modules.easclient.EASClientModule
import abi49_0_0.expo.modules.print.PrintModule
import abi49_0_0.expo.modules.facedetector.FaceDetectorPackage
import abi49_0_0.expo.modules.filesystem.FileSystemModule
import abi49_0_0.expo.modules.filesystem.FileSystemPackage
import abi49_0_0.expo.modules.font.FontLoaderPackage
import abi49_0_0.expo.modules.gl.GLPackage
import abi49_0_0.expo.modules.gl.GLViewModule
import abi49_0_0.expo.modules.haptics.HapticsModule
import abi49_0_0.expo.modules.image.ExpoImageModule
import abi49_0_0.expo.modules.imageloader.ImageLoaderPackage
import abi49_0_0.expo.modules.imagemanipulator.ImageManipulatorModule
import abi49_0_0.expo.modules.imagepicker.ImagePickerModule
import abi49_0_0.expo.modules.intentlauncher.IntentLauncherModule
import abi49_0_0.expo.modules.keepawake.KeepAwakePackage
import abi49_0_0.expo.modules.kotlin.ModulesProvider
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.lineargradient.LinearGradientModule
import abi49_0_0.expo.modules.localauthentication.LocalAuthenticationPackage
import abi49_0_0.expo.modules.localization.LocalizationModule
import abi49_0_0.expo.modules.location.LocationPackage
import abi49_0_0.expo.modules.mailcomposer.MailComposerModule
import expo.modules.manifests.core.Manifest
import abi49_0_0.expo.modules.medialibrary.MediaLibraryModule
import abi49_0_0.expo.modules.navigationbar.NavigationBarPackage
import abi49_0_0.expo.modules.network.NetworkModule
import abi49_0_0.expo.modules.notifications.NotificationsPackage
import abi49_0_0.expo.modules.permissions.PermissionsPackage
import abi49_0_0.expo.modules.random.RandomModule
import abi49_0_0.expo.modules.screencapture.ScreenCaptureModule
import abi49_0_0.expo.modules.screenorientation.ScreenOrientationModule
import abi49_0_0.expo.modules.securestore.SecureStorePackage
import abi49_0_0.expo.modules.sensors.SensorsPackage
import abi49_0_0.expo.modules.sharing.SharingModule
import abi49_0_0.expo.modules.sms.SMSModule
import abi49_0_0.expo.modules.speech.SpeechPackage
import abi49_0_0.expo.modules.splashscreen.SplashScreenModule
import abi49_0_0.expo.modules.splashscreen.SplashScreenPackage
import abi49_0_0.expo.modules.sqlite.SQLiteModule
import abi49_0_0.expo.modules.storereview.StoreReviewModule
import abi49_0_0.expo.modules.systemui.SystemUIModule
import abi49_0_0.expo.modules.systemui.SystemUIPackage
import abi49_0_0.expo.modules.taskManager.TaskManagerPackage
import abi49_0_0.expo.modules.updates.UpdatesPackage
import abi49_0_0.expo.modules.videothumbnails.VideoThumbnailsModule
import abi49_0_0.expo.modules.webbrowser.WebBrowserModule

object ExperiencePackagePicker : ModulesProvider {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    ApplicationPackage(),
    BatteryPackage(),
    BackgroundFetchPackage(),
    BarCodeScannerPackage(),
    CalendarPackage(),
    ConstantsPackage(),
    ContactsPackage(),
    FaceDetectorPackage(),
    FileSystemPackage(),
    FontLoaderPackage(),
    GLPackage(),
    ImageLoaderPackage(),
    KeepAwakePackage(),
    LocalAuthenticationPackage(),
    LocationPackage(),
    NavigationBarPackage(),
    NotificationsPackage(),
    PermissionsPackage(),
    SecureStorePackage(),
    SensorsPackage(),
    SpeechPackage(),
    SplashScreenPackage(),
    SystemUIPackage(),
    TaskManagerPackage(),
    UpdatesPackage(),
  )

  /**
   * Returns all available packages.
   */
  fun packages(): List<Package> {
    return EXPO_MODULES_PACKAGES
  }

  /**
   * Returns packages filtered based on the app's manifest.
   * For now, filtering is not applied but it is on the todo list.
   */
  fun packages(manifest: Manifest?): List<Package> {
    return EXPO_MODULES_PACKAGES
  }

  override fun getModulesList(): List<Class<out Module>> = listOf(
    BarCodeScannerModule::class.java,
    CameraViewModule::class.java,
    CellularModule::class.java,
    ClipboardModule::class.java,
    CryptoModule::class.java,
    ConstantsModule::class.java,
    DeviceModule::class.java,
    DocumentPickerModule::class.java,
    EASClientModule::class.java,
    FileSystemModule::class.java,
    PrintModule::class.java,
    GLViewModule::class.java,
    HapticsModule::class.java,
    ImagePickerModule::class.java,
    ImageManipulatorModule::class.java,
    ExpoImageModule::class.java,
    IntentLauncherModule::class.java,
    LinearGradientModule::class.java,
    LocalizationModule::class.java,
    MailComposerModule::class.java,
    MediaLibraryModule::class.java,
    NetworkModule::class.java,
    RandomModule::class.java,
    ScreenCaptureModule::class.java,
    ScreenOrientationModule::class.java,
    SMSModule::class.java,
    SharingModule::class.java,
    SplashScreenModule::class.java,
    StoreReviewModule::class.java,
    SQLiteModule::class.java,
    SystemUIModule::class.java,
    VideoThumbnailsModule::class.java,
    VideoViewModule::class.java,
    WebBrowserModule::class.java,
    BrightnessModule::class.java,
  )
}
