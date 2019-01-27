package host.exp.exponent;

import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expo.core.interfaces.Package;
import expo.loaders.provider.interfaces.AppLoaderPackagesProviderInterface;
import expo.modules.ads.admob.AdMobPackage;
import expo.modules.analytics.segment.SegmentPackage;
import expo.modules.appauth.AppAuthPackage;
import expo.modules.av.AVPackage;
import expo.modules.backgroundfetch.BackgroundFetchPackage;
import expo.modules.barcodescanner.BarCodeScannerPackage;
import expo.modules.blurview.BlurViewPackage;
import expo.modules.camera.CameraPackage;
import expo.modules.constants.ConstantsPackage;
import expo.modules.contacts.ContactsPackage;
import expo.modules.documentpicker.DocumentPickerPackage;
import expo.modules.facebook.FacebookPackage;
import expo.modules.facedetector.FaceDetectorPackage;
import expo.modules.filesystem.FileSystemPackage;
import expo.modules.font.FontLoaderPackage;
import expo.modules.gl.GLPackage;
import expo.modules.google.signin.GoogleSignInPackage;
import expo.modules.keepawake.KeepAwakePackage;
import expo.modules.lineargradient.LinearGradientPackage;
import expo.modules.localauthentication.LocalAuthenticationPackage;
import expo.modules.localization.LocalizationPackage;
import expo.modules.location.LocationPackage;
import expo.modules.mailcomposer.MailComposerPackage;
import expo.modules.medialibrary.MediaLibraryPackage;
import expo.modules.permissions.PermissionsPackage;
import expo.modules.print.PrintPackage;
import expo.modules.securestore.SecureStorePackage;
import expo.modules.sensors.SensorsPackage;
import expo.modules.sms.SMSPackage;
import expo.modules.speech.SpeechPackage;
import expo.modules.sqlite.SQLitePackage;
import expo.modules.taskManager.TaskManagerPackage;
import expolib_v1.okhttp3.OkHttpClient;

// Needed for `react-native link`
// import com.facebook.react.ReactApplication;

public class MainApplication extends ExpoApplication implements AppLoaderPackagesProviderInterface<ReactPackage> {

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  // Needed for `react-native link`
  public List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        // Add your own packages here!
        // TODO: add native modules!

        // Needed for `react-native link`
        // new MainReactPackage()
    );
  }

  public List<Package> getExpoPackages() {
    return Arrays.<Package>asList(
        new AVPackage(),
        new AdMobPackage(),
        new AppAuthPackage(),
        new BackgroundFetchPackage(),
        new BarCodeScannerPackage(),
        new BlurViewPackage(),
        new CameraPackage(),
        new ConstantsPackage(),
        new ContactsPackage(),
        new DocumentPickerPackage(),
        new FaceDetectorPackage(),
        new FacebookPackage(),
        new FileSystemPackage(),
        new FontLoaderPackage(),
        new GLPackage(),
        new GoogleSignInPackage(),
        new KeepAwakePackage(),
        new LinearGradientPackage(),
        new LocalAuthenticationPackage(),
        new LocalizationPackage(),
        new LocationPackage(),
        new MailComposerPackage(),
        new MediaLibraryPackage(),
        new PermissionsPackage(),
        new PrintPackage(),
        new SMSPackage(),
        new SQLitePackage(),
        new SecureStorePackage(),
        new SegmentPackage(),
        new SensorsPackage(),
        new SpeechPackage(),
        new TaskManagerPackage()
    );
  }

  @Override
  public String gcmSenderId() {
    return getString(R.string.gcm_defaultSenderId);
  }

  @Override
  public boolean shouldUseInternetKernel() {
    return BuildVariantConstants.USE_INTERNET_KERNEL;
  }

  public static OkHttpClient.Builder okHttpClientBuilder(OkHttpClient.Builder builder) {
    // Customize/override OkHttp client here
    return builder;
  }
}
