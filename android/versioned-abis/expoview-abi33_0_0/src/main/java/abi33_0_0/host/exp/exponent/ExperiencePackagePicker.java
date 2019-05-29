package abi33_0_0.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import abi33_0_0.org.unimodules.core.interfaces.Package;
import abi33_0_0.expo.modules.ads.admob.AdMobPackage;
import abi33_0_0.expo.modules.ads.facebook.AdsFacebookPackage;
import abi33_0_0.expo.modules.analytics.amplitude.AmplitudePackage;
import abi33_0_0.expo.modules.analytics.segment.SegmentPackage;
import abi33_0_0.expo.modules.appauth.AppAuthPackage;
import abi33_0_0.expo.modules.av.AVPackage;
import abi33_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage;
import abi33_0_0.expo.modules.barcodescanner.BarCodeScannerPackage;
import abi33_0_0.expo.modules.brightness.BrightnessPackage;
import abi33_0_0.expo.modules.calendar.CalendarPackage;
import abi33_0_0.expo.modules.camera.CameraPackage;
import abi33_0_0.expo.modules.sharing.SharingPackage;
import abi33_0_0.expo.modules.constants.ConstantsPackage;
import abi33_0_0.expo.modules.contacts.ContactsPackage;
import abi33_0_0.expo.modules.crypto.CryptoPackage;
import abi33_0_0.expo.modules.documentpicker.DocumentPickerPackage;
import abi33_0_0.expo.modules.facebook.FacebookPackage;
import abi33_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi33_0_0.expo.modules.filesystem.FileSystemPackage;
import abi33_0_0.expo.modules.font.FontLoaderPackage;
import abi33_0_0.expo.modules.gl.GLPackage;
import abi33_0_0.expo.modules.google.signin.GoogleSignInPackage;
import abi33_0_0.expo.modules.haptics.HapticsPackage;
import abi33_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage;
import abi33_0_0.expo.modules.imagepicker.ImagePickerPackage;
import abi33_0_0.expo.modules.intentlauncher.IntentLauncherPackage;
import abi33_0_0.expo.modules.keepawake.KeepAwakePackage;
import abi33_0_0.expo.modules.lineargradient.LinearGradientPackage;
import abi33_0_0.expo.modules.localauthentication.LocalAuthenticationPackage;
import abi33_0_0.expo.modules.localization.LocalizationPackage;
import abi33_0_0.expo.modules.location.LocationPackage;
import abi33_0_0.expo.modules.mailcomposer.MailComposerPackage;
import abi33_0_0.expo.modules.medialibrary.MediaLibraryPackage;
import abi33_0_0.expo.modules.payments.stripe.StripePackage;
import abi33_0_0.expo.modules.permissions.PermissionsPackage;
import abi33_0_0.expo.modules.print.PrintPackage;
import abi33_0_0.expo.modules.random.RandomPackage;
import abi33_0_0.expo.modules.securestore.SecureStorePackage;
import abi33_0_0.expo.modules.sensors.SensorsPackage;
import abi33_0_0.expo.modules.sms.SMSPackage;
import abi33_0_0.expo.modules.speech.SpeechPackage;
import abi33_0_0.expo.modules.sqlite.SQLitePackage;
import abi33_0_0.expo.modules.taskManager.TaskManagerPackage;
import abi33_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage;
import abi33_0_0.expo.modules.webbrowser.WebBrowserPackage;

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
  static List<Package> packages(JSONObject manifest) {
    return EXPO_MODULES_PACKAGES;
  }
}
