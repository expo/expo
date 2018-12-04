package host.exp.exponent;

import android.os.Bundle;

import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expo.core.interfaces.Package;
import expo.modules.ads.admob.AdMobPackage;
import expo.modules.analytics.segment.SegmentPackage;
import expo.modules.appauth.AppAuthPackage;
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
import host.exp.exponent.generated.DetachBuildConstants;
import host.exp.exponent.experience.DetachActivity;

public class MainActivity extends DetachActivity {

  @Override
  public String publishedUrl() {
    return "TEMPLATE_INITIAL_URL";
  }

  @Override
  public String developmentUrl() {
    return DetachBuildConstants.DEVELOPMENT_URL;
  }

  @Override
  public List<ReactPackage> reactPackages() {
    return ((MainApplication) getApplication()).getPackages();
  }

  @Override
  public List<Package> expoPackages() {
    return Arrays.<Package>asList(
        new CameraPackage(),
        new ConstantsPackage(),
        new SensorsPackage(),
        new FileSystemPackage(),
        new FaceDetectorPackage(),
        new GLPackage(),
        new GoogleSignInPackage(),
        new PermissionsPackage(),
        new SMSPackage(),
        new PrintPackage(),
        new ConstantsPackage(),
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
        new AppAuthPackage()
    );
  }

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  @Override
  public Bundle initialProps(Bundle expBundle) {
    // Add extra initialProps here
    return expBundle;
  }
}
