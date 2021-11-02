package abi43_0_0.host.exp.exponent

import abi43_0_0.expo.modules.ads.admob.AdMobPackage
import abi43_0_0.expo.modules.ads.facebook.AdsFacebookPackage
import abi43_0_0.expo.modules.analytics.amplitude.AmplitudePackage
import abi43_0_0.expo.modules.analytics.segment.SegmentPackage
import abi43_0_0.expo.modules.appauth.AppAuthPackage
import abi43_0_0.expo.modules.application.ApplicationPackage
import abi43_0_0.expo.modules.av.AVPackage
import abi43_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage
import abi43_0_0.expo.modules.barcodescanner.BarCodeScannerPackage
import abi43_0_0.expo.modules.battery.BatteryPackage
import abi43_0_0.expo.modules.brightness.BrightnessPackage
import abi43_0_0.expo.modules.calendar.CalendarPackage
import abi43_0_0.expo.modules.camera.CameraPackage
import abi43_0_0.expo.modules.cellular.CellularPackage
import abi43_0_0.expo.modules.clipboard.ClipboardPackage
import abi43_0_0.expo.modules.constants.ConstantsPackage
import abi43_0_0.expo.modules.contacts.ContactsPackage
import abi43_0_0.expo.modules.core.interfaces.Package
import abi43_0_0.expo.modules.crypto.CryptoPackage
import abi43_0_0.expo.modules.device.DevicePackage
import abi43_0_0.expo.modules.documentpicker.DocumentPickerPackage
import abi43_0_0.expo.modules.errorrecovery.ErrorRecoveryPackage
import abi43_0_0.expo.modules.facebook.FacebookPackage
import abi43_0_0.expo.modules.facedetector.FaceDetectorPackage
import abi43_0_0.expo.modules.filesystem.FileSystemPackage
import abi43_0_0.expo.modules.firebase.analytics.FirebaseAnalyticsPackage
import abi43_0_0.expo.modules.firebase.core.FirebaseCorePackage
import abi43_0_0.expo.modules.font.FontLoaderPackage
import abi43_0_0.expo.modules.gl.GLPackage
import abi43_0_0.expo.modules.google.signin.GoogleSignInPackage
import abi43_0_0.expo.modules.haptics.HapticsPackage
import abi43_0_0.expo.modules.imageloader.ImageLoaderPackage
import abi43_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage
import abi43_0_0.expo.modules.imagepicker.ImagePickerPackage
import abi43_0_0.expo.modules.intentlauncher.IntentLauncherPackage
import abi43_0_0.expo.modules.keepawake.KeepAwakePackage
import abi43_0_0.expo.modules.lineargradient.LinearGradientPackage
import abi43_0_0.expo.modules.localauthentication.LocalAuthenticationPackage
import abi43_0_0.expo.modules.localization.LocalizationPackage
import abi43_0_0.expo.modules.location.LocationPackage
import abi43_0_0.expo.modules.mailcomposer.MailComposerPackage
import abi43_0_0.expo.modules.medialibrary.MediaLibraryPackage
import abi43_0_0.expo.modules.network.NetworkPackage
import abi43_0_0.expo.modules.notifications.NotificationsPackage
import abi43_0_0.expo.modules.permissions.PermissionsPackage
import abi43_0_0.expo.modules.print.PrintPackage
import abi43_0_0.expo.modules.screencapture.ScreenCapturePackage
import abi43_0_0.expo.modules.screenorientation.ScreenOrientationPackage
import abi43_0_0.expo.modules.securestore.SecureStorePackage
import abi43_0_0.expo.modules.sensors.SensorsPackage
import abi43_0_0.expo.modules.sharing.SharingPackage
import abi43_0_0.expo.modules.sms.SMSPackage
import abi43_0_0.expo.modules.speech.SpeechPackage
import abi43_0_0.expo.modules.splashscreen.SplashScreenPackage
import abi43_0_0.expo.modules.sqlite.SQLitePackage
import abi43_0_0.expo.modules.storereview.StoreReviewPackage
import abi43_0_0.expo.modules.taskManager.TaskManagerPackage
import abi43_0_0.expo.modules.updates.UpdatesPackage
import expo.modules.manifests.core.Manifest
import abi43_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage
import abi43_0_0.expo.modules.webbrowser.WebBrowserPackage

object ExperiencePackagePicker {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    AdMobPackage(),
    AdsFacebookPackage(),
    AppAuthPackage(),
    ApplicationPackage(),
    AmplitudePackage(),
    BatteryPackage(),
    BackgroundFetchPackage(),
    BarCodeScannerPackage(),
    BrightnessPackage(),
    CalendarPackage(),
    CameraPackage(),
    CellularPackage(),
    ClipboardPackage(),
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
    LinearGradientPackage(),
    LocalAuthenticationPackage(),
    LocalizationPackage(),
    LocationPackage(),
    MailComposerPackage(),
    MediaLibraryPackage(),
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
}
