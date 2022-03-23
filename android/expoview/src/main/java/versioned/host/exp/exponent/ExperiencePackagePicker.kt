package versioned.host.exp.exponent

import expo.modules.ads.admob.AdMobPackage
import expo.modules.ads.facebook.AdsFacebookPackage
import expo.modules.analytics.amplitude.AmplitudePackage
import expo.modules.analytics.segment.SegmentPackage
import expo.modules.application.ApplicationPackage
import expo.modules.av.AVPackage
import expo.modules.backgroundfetch.BackgroundFetchPackage
import expo.modules.barcodescanner.BarCodeScannerPackage
import expo.modules.battery.BatteryPackage
import expo.modules.brightness.BrightnessPackage
import expo.modules.calendar.CalendarPackage
import expo.modules.camera.CameraPackage
import expo.modules.cellular.CellularModule
import expo.modules.clipboard.ClipboardModule
import expo.modules.constants.ConstantsPackage
import expo.modules.contacts.ContactsPackage
import expo.modules.core.interfaces.Package
import expo.modules.crypto.CryptoPackage
import expo.modules.device.DevicePackage
import expo.modules.documentpicker.DocumentPickerPackage
import expo.modules.easclientid.EASClientIDModule
import expo.modules.errorrecovery.ErrorRecoveryPackage
import expo.modules.facebook.FacebookPackage
import expo.modules.facedetector.FaceDetectorPackage
import expo.modules.filesystem.FileSystemPackage
import expo.modules.firebase.analytics.FirebaseAnalyticsPackage
import expo.modules.firebase.core.FirebaseCorePackage
import expo.modules.font.FontLoaderPackage
import expo.modules.gl.GLPackage
import expo.modules.google.signin.GoogleSignInPackage
import expo.modules.haptics.HapticsPackage
import expo.modules.imageloader.ImageLoaderPackage
import expo.modules.imagemanipulator.ImageManipulatorPackage
import expo.modules.imagepicker.ImagePickerPackage
import expo.modules.intentlauncher.IntentLauncherPackage
import expo.modules.keepawake.KeepAwakePackage
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.lineargradient.LinearGradientModule
import expo.modules.localauthentication.LocalAuthenticationPackage
import expo.modules.localization.LocalizationPackage
import expo.modules.location.LocationPackage
import expo.modules.mailcomposer.MailComposerPackage
import expo.modules.manifests.core.Manifest
import expo.modules.medialibrary.MediaLibraryPackage
import expo.modules.navigationbar.NavigationBarPackage
import expo.modules.network.NetworkPackage
import expo.modules.notifications.NotificationsPackage
import expo.modules.permissions.PermissionsPackage
import expo.modules.print.PrintPackage
import expo.modules.screencapture.ScreenCapturePackage
import expo.modules.screenorientation.ScreenOrientationPackage
import expo.modules.securestore.SecureStorePackage
import expo.modules.sensors.SensorsPackage
import expo.modules.sharing.SharingPackage
import expo.modules.sms.SMSPackage
import expo.modules.speech.SpeechPackage
import expo.modules.splashscreen.SplashScreenPackage
import expo.modules.sqlite.SQLitePackage
import expo.modules.storereview.StoreReviewPackage
import expo.modules.systemui.SystemUIPackage
import expo.modules.taskManager.TaskManagerPackage
import expo.modules.updates.UpdatesPackage
import expo.modules.videothumbnails.VideoThumbnailsPackage
import expo.modules.webbrowser.WebBrowserPackage

object ExperiencePackagePicker : ModulesProvider {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    AdMobPackage(),
    AdsFacebookPackage(),
    ApplicationPackage(),
    AmplitudePackage(),
    BatteryPackage(),
    BackgroundFetchPackage(),
    BarCodeScannerPackage(),
    BrightnessPackage(),
    CalendarPackage(),
    CameraPackage(),
    ConstantsPackage(),
    ContactsPackage(),
    CryptoPackage(),
    DevicePackage(),
    DocumentPickerPackage(),
    ErrorRecoveryPackage(),
    FacebookPackage(),
    FaceDetectorPackage(),
    FileSystemPackage(),
    FirebaseCorePackage(),
    FirebaseAnalyticsPackage(),
    FontLoaderPackage(),
    GLPackage(),
    GoogleSignInPackage(),
    HapticsPackage(),
    ImageLoaderPackage(),
    ImageManipulatorPackage(),
    ImagePickerPackage(),
    IntentLauncherPackage(),
    KeepAwakePackage(),
    LocalAuthenticationPackage(),
    LocalizationPackage(),
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
    SegmentPackage(),
    SensorsPackage(),
    SharingPackage(),
    SpeechPackage(),
    SplashScreenPackage(),
    SystemUIPackage(),
    TaskManagerPackage(),
    UpdatesPackage(),
    VideoThumbnailsPackage(),
    WebBrowserPackage()
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
    EASClientIDModule::class.java,
    LinearGradientModule::class.java,
  )
}
