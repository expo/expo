package abi46_0_0.host.exp.exponent

import abi46_0_0.expo.modules.application.ApplicationPackage
import abi46_0_0.expo.modules.av.AVPackage
import abi46_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage
import abi46_0_0.expo.modules.barcodescanner.BarCodeScannerPackage
import abi46_0_0.expo.modules.battery.BatteryPackage
import abi46_0_0.expo.modules.brightness.BrightnessPackage
import abi46_0_0.expo.modules.calendar.CalendarPackage
import abi46_0_0.expo.modules.camera.CameraPackage
import abi46_0_0.expo.modules.cellular.CellularModule
import abi46_0_0.expo.modules.clipboard.ClipboardModule
import abi46_0_0.expo.modules.constants.ConstantsPackage
import abi46_0_0.expo.modules.contacts.ContactsPackage
import abi46_0_0.expo.modules.core.interfaces.Package
import abi46_0_0.expo.modules.crypto.CryptoModule
import abi46_0_0.expo.modules.device.DevicePackage
import abi46_0_0.expo.modules.documentpicker.DocumentPickerPackage
import abi46_0_0.expo.modules.easclient.EASClientModule
import abi46_0_0.expo.modules.errorrecovery.ErrorRecoveryPackage
import abi46_0_0.expo.modules.facedetector.FaceDetectorPackage
import abi46_0_0.expo.modules.filesystem.FileSystemPackage
import abi46_0_0.expo.modules.firebase.analytics.FirebaseAnalyticsPackage
import abi46_0_0.expo.modules.firebase.core.FirebaseCorePackage
import abi46_0_0.expo.modules.font.FontLoaderPackage
import abi46_0_0.expo.modules.gl.GLPackage
import abi46_0_0.expo.modules.haptics.HapticsPackage
import abi46_0_0.expo.modules.imageloader.ImageLoaderPackage
import abi46_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage
import abi46_0_0.expo.modules.imagepicker.ImagePickerModule
import abi46_0_0.expo.modules.intentlauncher.IntentLauncherPackage
import abi46_0_0.expo.modules.keepawake.KeepAwakePackage
import abi46_0_0.expo.modules.kotlin.ModulesProvider
import abi46_0_0.expo.modules.kotlin.modules.Module
import abi46_0_0.expo.modules.lineargradient.LinearGradientModule
import abi46_0_0.expo.modules.localauthentication.LocalAuthenticationPackage
import abi46_0_0.expo.modules.localization.LocalizationModule
import abi46_0_0.expo.modules.location.LocationPackage
import abi46_0_0.expo.modules.mailcomposer.MailComposerPackage
import expo.modules.manifests.core.Manifest
import abi46_0_0.expo.modules.medialibrary.MediaLibraryPackage
import abi46_0_0.expo.modules.navigationbar.NavigationBarPackage
import abi46_0_0.expo.modules.network.NetworkPackage
import abi46_0_0.expo.modules.notifications.NotificationsPackage
import abi46_0_0.expo.modules.permissions.PermissionsPackage
import abi46_0_0.expo.modules.print.PrintPackage
import abi46_0_0.expo.modules.random.RandomModule
import abi46_0_0.expo.modules.screencapture.ScreenCapturePackage
import abi46_0_0.expo.modules.screenorientation.ScreenOrientationPackage
import abi46_0_0.expo.modules.securestore.SecureStorePackage
import abi46_0_0.expo.modules.sensors.SensorsPackage
import abi46_0_0.expo.modules.sharing.SharingPackage
import abi46_0_0.expo.modules.sms.SMSPackage
import abi46_0_0.expo.modules.speech.SpeechPackage
import abi46_0_0.expo.modules.splashscreen.SplashScreenPackage
import abi46_0_0.expo.modules.sqlite.SQLitePackage
import abi46_0_0.expo.modules.storereview.StoreReviewPackage
import abi46_0_0.expo.modules.systemui.SystemUIPackage
import abi46_0_0.expo.modules.taskManager.TaskManagerPackage
import abi46_0_0.expo.modules.updates.UpdatesPackage
import abi46_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage
import abi46_0_0.expo.modules.webbrowser.WebBrowserModule

object ExperiencePackagePicker : ModulesProvider {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    ApplicationPackage(),
    BatteryPackage(),
    BackgroundFetchPackage(),
    BarCodeScannerPackage(),
    BrightnessPackage(),
    CalendarPackage(),
    CameraPackage(),
    ConstantsPackage(),
    ContactsPackage(),
    DevicePackage(),
    DocumentPickerPackage(),
    ErrorRecoveryPackage(),
    FaceDetectorPackage(),
    FileSystemPackage(),
    FirebaseCorePackage(),
    FirebaseAnalyticsPackage(),
    FontLoaderPackage(),
    GLPackage(),
    HapticsPackage(),
    ImageLoaderPackage(),
    ImageManipulatorPackage(),
    IntentLauncherPackage(),
    KeepAwakePackage(),
    LocalAuthenticationPackage(),
    LocationPackage(),
    MailComposerPackage(),
    MediaLibraryPackage(),
    NavigationBarPackage(),
    NetworkPackage(),
    NotificationsPackage(),
    PermissionsPackage(),
    PrintPackage(),
    SMSPackage(),
    StoreReviewPackage(),
    SQLitePackage(),
    ScreenCapturePackage(),
    ScreenOrientationPackage(),
    SecureStorePackage(),
    SensorsPackage(),
    SharingPackage(),
    SpeechPackage(),
    SplashScreenPackage(),
    SystemUIPackage(),
    TaskManagerPackage(),
    UpdatesPackage(),
    VideoThumbnailsPackage(),
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
    CellularModule::class.java,
    ClipboardModule::class.java,
    CryptoModule::class.java,
    EASClientModule::class.java,
    ImagePickerModule::class.java,
    LinearGradientModule::class.java,
    LocalizationModule::class.java,
    RandomModule::class.java,
    WebBrowserModule::class.java,
  )
}
