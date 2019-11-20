package abi35_0_0.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import abi35_0_0.org.unimodules.core.interfaces.Package;
import abi35_0_0.expo.modules.ads.admob.AdMobPackage;
import abi35_0_0.expo.modules.ads.facebook.AdsFacebookPackage;
import abi35_0_0.expo.modules.analytics.amplitude.AmplitudePackage;
import abi35_0_0.expo.modules.analytics.segment.SegmentPackage;
import abi35_0_0.expo.modules.appauth.AppAuthPackage;
import abi35_0_0.expo.modules.application.ApplicationPackage;
import abi35_0_0.expo.modules.av.AVPackage;
import abi35_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage;
import abi35_0_0.expo.modules.barcodescanner.BarCodeScannerPackage;
import abi35_0_0.expo.modules.battery.BatteryPackage;
import abi35_0_0.expo.modules.brightness.BrightnessPackage;
import abi35_0_0.expo.modules.calendar.CalendarPackage;
import abi35_0_0.expo.modules.camera.CameraPackage;
import abi35_0_0.expo.modules.cellular.CellularPackage;
import abi35_0_0.expo.modules.sharing.SharingPackage;
import abi35_0_0.expo.modules.constants.ConstantsPackage;
import abi35_0_0.expo.modules.contacts.ContactsPackage;
import abi35_0_0.expo.modules.crypto.CryptoPackage;
import abi35_0_0.expo.modules.documentpicker.DocumentPickerPackage;
import abi35_0_0.expo.modules.facebook.FacebookPackage;
import abi35_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi35_0_0.expo.modules.filesystem.FileSystemPackage;
import abi35_0_0.expo.modules.font.FontLoaderPackage;
import abi35_0_0.expo.modules.gl.GLPackage;
import abi35_0_0.expo.modules.google.signin.GoogleSignInPackage;
import abi35_0_0.expo.modules.haptics.HapticsPackage;
import abi35_0_0.expo.modules.imagemanipulator.ImageManipulatorPackage;
import abi35_0_0.expo.modules.imagepicker.ImagePickerPackage;
import abi35_0_0.expo.modules.intentlauncher.IntentLauncherPackage;
import abi35_0_0.expo.modules.keepawake.KeepAwakePackage;
import abi35_0_0.expo.modules.lineargradient.LinearGradientPackage;
import abi35_0_0.expo.modules.localauthentication.LocalAuthenticationPackage;
import abi35_0_0.expo.modules.localization.LocalizationPackage;
import abi35_0_0.expo.modules.location.LocationPackage;
import abi35_0_0.expo.modules.mailcomposer.MailComposerPackage;
import abi35_0_0.expo.modules.medialibrary.MediaLibraryPackage;
import abi35_0_0.expo.modules.network.NetworkPackage;
import abi35_0_0.expo.modules.payments.stripe.StripePackage;
import abi35_0_0.expo.modules.permissions.PermissionsPackage;
import abi35_0_0.expo.modules.print.PrintPackage;
import abi35_0_0.expo.modules.random.RandomPackage;
import abi35_0_0.expo.modules.securestore.SecureStorePackage;
import abi35_0_0.expo.modules.sensors.SensorsPackage;
import abi35_0_0.expo.modules.sms.SMSPackage;
import abi35_0_0.expo.modules.speech.SpeechPackage;
import abi35_0_0.expo.modules.sqlite.SQLitePackage;
import abi35_0_0.expo.modules.taskManager.TaskManagerPackage;
import abi35_0_0.expo.modules.videothumbnails.VideoThumbnailsPackage;
import abi35_0_0.expo.modules.webbrowser.WebBrowserPackage;
import abi35_0_0.expo.modules.device.DevicePackage;

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
      new NetworkPackage(),
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
