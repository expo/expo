package abi48_0_0.host.exp.exponent

import abi48_0_0.expo.modules.application.ApplicationPackage
import abi48_0_0.expo.modules.av.AVPackage
import abi48_0_0.expo.modules.av.video.VideoViewModule
import abi48_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage
import abi48_0_0.expo.modules.barcodescanner.BarCodeScannerModule
import abi48_0_0.expo.modules.barcodescanner.BarCodeScannerPackage
import abi48_0_0.expo.modules.battery.BatteryPackage
import abi48_0_0.expo.modules.brightness.BrightnessPackage
import abi48_0_0.expo.modules.calendar.CalendarPackage
import abi48_0_0.expo.modules.camera.CameraViewModule
import abi48_0_0.expo.modules.cellular.CellularModule
import abi48_0_0.expo.modules.clipboard.ClipboardModule
import abi48_0_0.expo.modules.constants.ConstantsModule
import abi48_0_0.expo.modules.constants.ConstantsPackage
import abi48_0_0.expo.modules.contacts.ContactsPackage
import abi48_0_0.expo.modules.core.interfaces.Package
import abi48_0_0.expo.modules.crypto.CryptoModule
import abi48_0_0.expo.modules.device.DeviceModule
import abi48_0_0.expo.modules.documentpicker.DocumentPickerModule
import abi48_0_0.expo.modules.easclient.EASClientModule
import abi48_0_0.expo.modules.facedetector.FaceDetectorPackage
import abi48_0_0.expo.modules.filesystem.FileSystemPackage
import abi48_0_0.expo.modules.font.FontLoaderPackage
import abi48_0_0.expo.modules.gl.GLPackage
import abi48_0_0.expo.modules.gl.GLViewModule
import abi48_0_0.expo.modules.haptics.HapticsModule
import abi48_0_0.expo.modules.image.ExpoImageModule
import abi48_0_0.expo.modules.imageloader.ImageLoaderPackage
import abi48_0_0.expo.modules.imagemanipulator.ImageManipulatorModule
import abi48_0_0.expo.modules.imagepicker.ImagePickerModule
import abi48_0_0.expo.modules.intentlauncher.IntentLauncherModule
import abi48_0_0.expo.modules.keepawake.KeepAwakePackage
import abi48_0_0.expo.modules.kotlin.ModulesProvider
import abi48_0_0.expo.modules.kotlin.modules.Module
import abi48_0_0.expo.modules.lineargradient.LinearGradientModule
import abi48_0_0.expo.modules.localauthentication.LocalAuthenticationPackage
import abi48_0_0.expo.modules.localization.LocalizationModule
import abi48_0_0.expo.modules.location.LocationPackage
import abi48_0_0.expo.modules.mailcomposer.MailComposerModule
import expo.modules.manifests.core.Manifest
import abi48_0_0.expo.modules.medialibrary.MediaLibraryModule
import abi48_0_0.expo.modules.navigationbar.NavigationBarPackage
import abi48_0_0.expo.modules.network.NetworkModule
import abi48_0_0.expo.modules.notifications.NotificationsPackage
import abi48_0_0.expo.modules.permissions.PermissionsPackage
import abi48_0_0.expo.modules.print.PrintPackage
import abi48_0_0.expo.modules.random.RandomModule
import abi48_0_0.expo.modules.screencapture.ScreenCapturePackage
import abi48_0_0.expo.modules.screenorientation.ScreenOrientationPackage
import abi48_0_0.expo.modules.securestore.SecureStorePackage
import abi48_0_0.expo.modules.sensors.SensorsPackage
import abi48_0_0.expo.modules.sharing.SharingModule
import abi48_0_0.expo.modules.sms.SMSModule
import abi48_0_0.expo.modules.speech.SpeechPackage
import abi48_0_0.expo.modules.splashscreen.SplashScreenPackage
import abi48_0_0.expo.modules.sqlite.SQLitePackage
import abi48_0_0.expo.modules.storereview.StoreReviewModule
import abi48_0_0.expo.modules.systemui.SystemUIModule
import abi48_0_0.expo.modules.systemui.SystemUIPackage
import abi48_0_0.expo.modules.taskManager.TaskManagerPackage
import abi48_0_0.expo.modules.updates.UpdatesPackage
import abi48_0_0.expo.modules.videothumbnails.VideoThumbnailsModule
import abi48_0_0.expo.modules.webbrowser.WebBrowserModule

object ExperiencePackagePicker : ModulesProvider {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    ApplicationPackage(),
    BatteryPackage(),
    BackgroundFetchPackage(),
    BarCodeScannerPackage(),
    BrightnessPackage(),
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
    PrintPackage(),
    SQLitePackage(),
    ScreenCapturePackage(),
    ScreenOrientationPackage(),
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
    SMSModule::class.java,
    SharingModule::class.java,
    StoreReviewModule::class.java,
    SystemUIModule::class.java,
    VideoThumbnailsModule::class.java,
    VideoViewModule::class.java,
    WebBrowserModule::class.java,
  )
}
