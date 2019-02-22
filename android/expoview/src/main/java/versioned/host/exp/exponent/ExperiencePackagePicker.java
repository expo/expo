package versioned.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import expo.core.interfaces.Package;
import expo.modules.ads.admob.AdMobPackage;
import expo.modules.ads.facebook.AdsFacebookPackage;
import expo.modules.analytics.amplitude.AmplitudePackage;
import expo.modules.analytics.segment.SegmentPackage;
import expo.modules.appauth.AppAuthPackage;
import expo.modules.av.AVPackage;
import expo.modules.backgroundfetch.BackgroundFetchPackage;
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.brightness.BrightnessPackage;
import expo.modules.calendar.CalendarPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.sharing.SharingPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.contacts.ContactsPackage;
import expo.modules.crypto.CryptoPackage;
import expo.modules.documentpicker.DocumentPickerPackage;
import expo.modules.facebook.FacebookPackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.gl.GLPackage;
import expo.modules.google.signin.GoogleSignInPackage;
import expo.modules.haptics.HapticsPackage;
import expo.modules.imagemanipulator.ImageManipulatorPackage;
import expo.modules.imagepicker.ImagePickerPackage;
import expo.modules.intentlauncher.IntentLauncherPackage;
import expo.modules.keepawake.KeepAwakePackage;
import expo.modules.lineargradient.LinearGradientPackage;
import expo.modules.localauthentication.LocalAuthenticationPackage;
import expo.modules.localization.LocalizationPackage;
import expo.modules.location.LocationPackage;
import expo.modules.mailcomposer.MailComposerPackage;
import expo.modules.medialibrary.MediaLibraryPackage;
import expo.modules.payments.stripe.StripePackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.print.PrintPackage;
import expo.modules.random.RandomPackage;
import expo.modules.securestore.SecureStorePackage;
import expo.modules.sensors.SensorsPackage;
import expo.modules.sms.SMSPackage;
import expo.modules.speech.SpeechPackage;
import expo.modules.sqlite.SQLitePackage;
import expo.modules.taskManager.TaskManagerPackage;
import expo.modules.webbrowser.WebBrowserPackage;

public class ExperiencePackagePicker {
  private static final List<Package> EXPO_MODULES_PACKAGES = Arrays.<Package>asList(
      new AVPackage(),
      new AdMobPackage(),
      new AdsFacebookPackage(),
      new AppAuthPackage(),
      new AmplitudePackage(),
      new BackgroundFetchPackage(),
      new BarCodeScannerPackage(),
      new BrightnessPackage(),
      new CalendarPackage(),
      new CameraPackage(),
      new ConstantsPackage(),
      new ContactsPackage(),
      new CryptoPackage(),
      new DocumentPickerPackage(),
      new FacebookPackage(),
      new FaceDetectorPackage(),
      new FileSystemPackage(),
      new FontLoaderPackage(),
      new GLPackage(),
      new GoogleSignInPackage(),
      new HapticsPackage(),
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
      new PermissionsPackage(),
      new PrintPackage(),
      new RandomPackage(),
      new SMSPackage(),
      new SQLitePackage(),
      new SecureStorePackage(),
      new SegmentPackage(),
      new SensorsPackage(),
      new SharingPackage(),
      new SpeechPackage(),
      new StripePackage(),
      new TaskManagerPackage(),
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
  static List<Package> packages(JSONObject manifest) {
    return EXPO_MODULES_PACKAGES;
  }
}
