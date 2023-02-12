package abi47_0_0.host.exp.exponent

import abi47_0_0.expo.modules.application.ApplicationPackage
import abi47_0_0.expo.modules.av.AVPackage
import abi47_0_0.expo.modules.av.video.VideoViewModule
import abi47_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage
import abi47_0_0.expo.modules.barcodescanner.BarCodeScannerPackage
import abi47_0_0.expo.modules.battery.BatteryPackage
import abi47_0_0.expo.modules.brightness.BrightnessPackage
import abi47_0_0.expo.modules.calendar.CalendarPackage
import abi47_0_0.expo.modules.camera.CameraViewModule
import abi47_0_0.expo.modules.cellular.CellularModule
import abi47_0_0.expo.modules.clipboard.ClipboardModule
import abi47_0_0.expo.modules.constants.ConstantsPackage
import abi47_0_0.expo.modules.contacts.ContactsPackage
import abi47_0_0.expo.modules.core.interfaces.Package
import abi47_0_0.expo.modules.crypto.CryptoModule
import abi47_0_0.expo.modules.device.DevicePackage
import abi47_0_0.expo.modules.documentpicker.DocumentPickerPackage
import abi47_0_0.expo.modules.easclient.EASClientModule
import abi47_0_0.expo.modules.errorrecovery.ErrorRecoveryPackage
import abi47_0_0.expo.modules.facedetector.FaceDetectorPackage
import abi47_0_0.expo.modules.filesystem.FileSystemPackage
import abi47_0_0.expo.modules.firebase.analytics.FirebaseAnalyticsPackage
import abi47_0_0.expo.modules.firebase.core.FirebaseCorePackage
import abi47_0_0.expo.modules.font.FontLoaderPackage
import abi47_0_0.expo.modules.gl.GLPackage
import abi47_0_0.expo.modules.haptics.HapticsPackage
import abi47_0_0.expo.modules.imageloader.ImageLoaderPackage
import abi47_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage
import abi47_0_0.expo.modules.imagepicker.ImagePickerModule
import abi47_0_0.expo.modules.intentlauncher.IntentLauncherPackage
import abi47_0_0.expo.modules.keepawake.KeepAwakePackage
import abi47_0_0.expo.modules.kotlin.ModulesProvider
import abi47_0_0.expo.modules.kotlin.modules.Module
import abi47_0_0.expo.modules.lineargradient.LinearGradientModule
import abi47_0_0.expo.modules.localauthentication.LocalAuthenticationPackage
import abi47_0_0.expo.modules.localization.LocalizationModule
import abi47_0_0.expo.modules.location.LocationPackage
import abi47_0_0.expo.modules.mailcomposer.MailComposerPackage
import expo.modules.manifests.core.Manifest
import abi47_0_0.expo.modules.medialibrary.MediaLibraryPackage
import abi47_0_0.expo.modules.navigationbar.NavigationBarPackage
import abi47_0_0.expo.modules.network.NetworkPackage
import abi47_0_0.expo.modules.notifications.NotificationsPackage
import abi47_0_0.expo.modules.permissions.PermissionsPackage
import abi47_0_0.expo.modules.print.PrintPackage
import abi47_0_0.expo.modules.random.RandomModule
import abi47_0_0.expo.modules.screencapture.ScreenCapturePackage
import abi47_0_0.expo.modules.screenorientation.ScreenOrientationPackage
import abi47_0_0.expo.modules.securestore.SecureStorePackage
import abi47_0_0.expo.modules.sensors.SensorsPackage
import abi47_0_0.expo.modules.sharing.SharingPackage
import abi47_0_0.expo.modules.sms.SMSPackage
import abi47_0_0.expo.modules.speech.SpeechPackage
import abi47_0_0.expo.modules.splashscreen.SplashScreenPackage
import abi47_0_0.expo.modules.sqlite.SQLitePackage
import abi47_0_0.expo.modules.storereview.StoreReviewPackage
import abi47_0_0.expo.modules.systemui.SystemUIPackage
import abi47_0_0.expo.modules.taskManager.TaskManagerPackage
import abi47_0_0.expo.modules.updates.UpdatesPackage
import abi47_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage
import abi47_0_0.expo.modules.webbrowser.WebBrowserModule

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
    CameraViewModule::class.java,
    CellularModule::class.java,
    ClipboardModule::class.java,
    CryptoModule::class.java,
    EASClientModule::class.java,
    ImagePickerModule::class.java,
    LinearGradientModule::class.java,
    LocalizationModule::class.java,
    RandomModule::class.java,
    VideoViewModule::class.java,
    WebBrowserModule::class.java,
  )
}
