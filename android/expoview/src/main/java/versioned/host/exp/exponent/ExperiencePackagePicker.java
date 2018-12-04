package versioned.host.exp.exponent;

import org.json.JSONObject;

import java.util.Arrays;
import java.util.List;

import expo.core.interfaces.Package;
import expo.modules.ads.admob.AdMobPackage;
import expo.modules.analytics.segment.SegmentPackage;
import expo.modules.appauth.AppAuthPackage;
import expo.modules.backgroundfetch.BackgroundFetchPackage;
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.contacts.ContactsPackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.gl.GLPackage;
import expo.modules.google.signin.GoogleSignInPackage;
import expo.modules.localauthentication.LocalAuthenticationPackage;
import expo.modules.localization.LocalizationPackage;
import expo.modules.location.LocationPackage;
import expo.modules.medialibrary.MediaLibraryPackage;
import expo.modules.payments.stripe.StripePackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.print.PrintPackage;
import expo.modules.sensors.SensorsPackage;
import expo.modules.sms.SMSPackage;
import expo.modules.taskManager.TaskManagerPackage;

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
