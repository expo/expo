package abi40_0_0.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import abi40_0_0.org.unimodules.core.interfaces.Package;

import abi40_0_0.expo.modules.ads.admob.AdMobPackage;
import abi40_0_0.expo.modules.ads.facebook.AdsFacebookPackage;
import abi40_0_0.expo.modules.analytics.amplitude.AmplitudePackage;
import abi40_0_0.expo.modules.analytics.segment.SegmentPackage;
import abi40_0_0.expo.modules.appauth.AppAuthPackage;
import abi40_0_0.expo.modules.application.ApplicationPackage;
import abi40_0_0.expo.modules.av.AVPackage;
import abi40_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage;
import abi40_0_0.expo.modules.barcodescanner.BarCodeScannerPackage;
import abi40_0_0.expo.modules.battery.BatteryPackage;
import abi40_0_0.expo.modules.brightness.BrightnessPackage;
import abi40_0_0.expo.modules.calendar.CalendarPackage;
import abi40_0_0.expo.modules.camera.CameraPackage;
import abi40_0_0.expo.modules.cellular.CellularPackage;
import abi40_0_0.expo.modules.errorrecovery.ErrorRecoveryPackage;
import abi40_0_0.expo.modules.notifications.NotificationsPackage;
import abi40_0_0.expo.modules.screenorientation.ScreenOrientationPackage;
import abi40_0_0.expo.modules.imageloader.ImageLoaderPackage;
import abi40_0_0.expo.modules.sharing.SharingPackage;
import abi40_0_0.expo.modules.constants.ConstantsPackage;
import abi40_0_0.expo.modules.contacts.ContactsPackage;
import abi40_0_0.expo.modules.crypto.CryptoPackage;
import abi40_0_0.expo.modules.documentpicker.DocumentPickerPackage;
import abi40_0_0.expo.modules.facebook.FacebookPackage;
import abi40_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi40_0_0.expo.modules.filesystem.FileSystemPackage;
import abi40_0_0.expo.modules.firebase.core.FirebaseCorePackage;
import abi40_0_0.expo.modules.firebase.analytics.FirebaseAnalyticsPackage;
import abi40_0_0.expo.modules.font.FontLoaderPackage;
import abi40_0_0.expo.modules.gl.GLPackage;
import abi40_0_0.expo.modules.google.signin.GoogleSignInPackage;
import abi40_0_0.expo.modules.haptics.HapticsPackage;
import abi40_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage;
import abi40_0_0.expo.modules.imagepicker.ImagePickerPackage;
import abi40_0_0.expo.modules.intentlauncher.IntentLauncherPackage;
import abi40_0_0.expo.modules.keepawake.KeepAwakePackage;
import abi40_0_0.expo.modules.lineargradient.LinearGradientPackage;
import abi40_0_0.expo.modules.localauthentication.LocalAuthenticationPackage;
import abi40_0_0.expo.modules.localization.LocalizationPackage;
import abi40_0_0.expo.modules.location.LocationPackage;
import abi40_0_0.expo.modules.mailcomposer.MailComposerPackage;
import abi40_0_0.expo.modules.medialibrary.MediaLibraryPackage;
import abi40_0_0.expo.modules.network.NetworkPackage;
import abi40_0_0.expo.modules.payments.stripe.StripePackage;
import abi40_0_0.expo.modules.permissions.PermissionsPackage;
import abi40_0_0.expo.modules.print.PrintPackage;
import abi40_0_0.expo.modules.screencapture.ScreenCapturePackage;
import abi40_0_0.expo.modules.securestore.SecureStorePackage;
import abi40_0_0.expo.modules.sensors.SensorsPackage;
import abi40_0_0.expo.modules.sms.SMSPackage;
import abi40_0_0.expo.modules.speech.SpeechPackage;
import abi40_0_0.expo.modules.splashscreen.SplashScreenPackage;
import abi40_0_0.expo.modules.sqlite.SQLitePackage;
import abi40_0_0.expo.modules.storereview.StoreReviewPackage;
import abi40_0_0.expo.modules.taskManager.TaskManagerPackage;
import abi40_0_0.expo.modules.updates.UpdatesPackage;
import abi40_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage;
import abi40_0_0.expo.modules.webbrowser.WebBrowserPackage;
import abi40_0_0.expo.modules.device.DevicePackage;
import expo.modules.updates.manifest.raw.RawManifest;

public class ExperiencePackagePicker {
  private static final List<Package> EXPO_MODULES_PACKAGES = Arrays.<Package>asList(
      new AVPackage(),
      new AdMobPackage(),
      new AdsFacebookPackage(),
      new AppAuthPackage(),
      new ApplicationPackage(),
      new AmplitudePackage(),
      new BatteryPackage(),
      new BackgroundFetchPackage(),
      new BarCodeScannerPackage(),
      new BrightnessPackage(),
      new CalendarPackage(),
      new CameraPackage(),
      new CellularPackage(),
      new ConstantsPackage(),
      new ContactsPackage(),
      new CryptoPackage(),
      new DevicePackage(),
      new DocumentPickerPackage(),
      new ErrorRecoveryPackage(),
      new FacebookPackage(),
      new FaceDetectorPackage(),
      new FileSystemPackage(),
      new FirebaseCorePackage(),
      new FirebaseAnalyticsPackage(),
      new FontLoaderPackage(),
      new GLPackage(),
      new GoogleSignInPackage(),
      new HapticsPackage(),
      new ImageLoaderPackage(),
      new ImageManipulatorPackage(),
      new ImagePickerPackage(),
      new IntentLauncherPackage(),
      new KeepAwakePackage(),
      new LinearGradientPackage(),
      new LocalAuthenticationPackage(),
      new LocalizationPackage(),
      new LocationPackage(),
      new MailComposerPackage(),
      new MediaLibraryPackage(),
      new NetworkPackage(),
      new NotificationsPackage(),
      new PermissionsPackage(),
      new PrintPackage(),
      new SMSPackage(),
      new StoreReviewPackage(),
      new SQLitePackage(),
      new ScreenCapturePackage(),
      new ScreenOrientationPackage(),
      new SecureStorePackage(),
      new SegmentPackage(),
      new SensorsPackage(),
      new SharingPackage(),
      new SpeechPackage(),
      new SplashScreenPackage(),
      new StripePackage(),
      new TaskManagerPackage(),
      new UpdatesPackage(),
      new VideoThumbnailsPackage(),
      new WebBrowserPackage()
  );

  /**
   * Returns all available packages.
   */
  static List<Package> packages() {
    return EXPO_MODULES_PACKAGES;
  }

  /**
   * Returns packages filtered based on the app's manifest.
   * For now, filtering is not applied but it is on the todo list.
   */
  static List<Package> packages(RawManifest manifest) {
    return EXPO_MODULES_PACKAGES;
  }
}
