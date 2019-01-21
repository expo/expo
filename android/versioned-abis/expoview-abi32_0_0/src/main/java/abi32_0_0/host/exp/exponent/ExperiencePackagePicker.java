package abi32_0_0.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import abi32_0_0.expo.core.interfaces.Package;
import abi32_0_0.expo.modules.ads.admob.AdMobPackage;
import abi32_0_0.expo.modules.analytics.segment.SegmentPackage;
import abi32_0_0.expo.modules.appauth.AppAuthPackage;
import abi32_0_0.expo.modules.backgroundfetch.BackgroundFetchPackage;
import abi32_0_0.expo.modules.barcodescanner.BarCodeScannerPackage;
import abi32_0_0.expo.modules.camera.CameraPackage;
import abi32_0_0.expo.modules.constants.ConstantsPackage;
import abi32_0_0.expo.modules.contacts.ContactsPackage;
import abi32_0_0.expo.modules.facedetector.FaceDetectorPackage;
import abi32_0_0.expo.modules.filesystem.FileSystemPackage;
import abi32_0_0.expo.modules.font.FontLoaderPackage;
import abi32_0_0.expo.modules.gl.GLPackage;
import abi32_0_0.expo.modules.google.signin.GoogleSignInPackage;
import abi32_0_0.expo.modules.localauthentication.LocalAuthenticationPackage;
import abi32_0_0.expo.modules.localization.LocalizationPackage;
import abi32_0_0.expo.modules.location.LocationPackage;
import abi32_0_0.expo.modules.medialibrary.MediaLibraryPackage;
import abi32_0_0.expo.modules.payments.stripe.StripePackage;
import abi32_0_0.expo.modules.permissions.PermissionsPackage;
import abi32_0_0.expo.modules.print.PrintPackage;
import abi32_0_0.expo.modules.sensors.SensorsPackage;
import abi32_0_0.expo.modules.sms.SMSPackage;
import abi32_0_0.expo.modules.taskManager.TaskManagerPackage;

public class ExperiencePackagePicker {
  private static final List<Package> EXPO_MODULES_PACKAGES = Arrays.<Package>asList(
      new CameraPackage(),
      new SensorsPackage(),
      new FileSystemPackage(),
      new FaceDetectorPackage(),
      new ConstantsPackage(),
      new GLPackage(),
      new GoogleSignInPackage(),
      new PermissionsPackage(),
      new SMSPackage(),
      new PrintPackage(),
      new MediaLibraryPackage(),
      new SegmentPackage(),
      new FontLoaderPackage(),
      new LocationPackage(),
      new ContactsPackage(),
      new BarCodeScannerPackage(),
      new AdMobPackage(),
      new StripePackage(),
      new LocalAuthenticationPackage(),
      new LocalizationPackage(),
      new AppAuthPackage(),
      new TaskManagerPackage(),
      new BackgroundFetchPackage()
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
