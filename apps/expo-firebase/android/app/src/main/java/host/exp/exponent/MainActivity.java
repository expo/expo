package host.exp.exponent;

import android.os.Bundle;

import com.facebook.react.ReactPackage;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import expo.core.interfaces.Package;
import host.exp.exponent.generated.DetachBuildConstants;
import host.exp.exponent.experience.DetachActivity;

import expo.modules.firebase.analytics.FirebaseAnalyticsPackage;
import expo.modules.firebase.app.FirebaseAppPackage;
import expo.modules.firebase.auth.FirebaseAuthPackage;
import expo.modules.firebase.fabric.crashlytics.FirebaseCrashlyticsPackage;
import expo.modules.firebase.database.FirebaseDatabasePackage;
import expo.modules.firebase.firestore.FirebaseFirestorePackage;
import expo.modules.firebase.functions.FirebaseFunctionsPackage;
import expo.modules.firebase.instanceid.FirebaseInstanceIDPackage;
import expo.modules.firebase.invites.FirebaseInvitesPackage;
import expo.modules.firebase.links.FirebaseLinksPackage;
import expo.modules.firebase.messaging.FirebaseMessagingPackage;
import expo.modules.firebase.notifications.FirebaseNotificationsPackage;
import expo.modules.firebase.performance.FirebasePerformancePackage;
import expo.modules.firebase.remoteconfig.FirebaseRemoteConfigPackage;
import expo.modules.firebase.storage.FirebaseStoragePackage;

public class MainActivity extends DetachActivity {

  @Override
  public String publishedUrl() {
    return "exp://exp.host/@bacon/expo-firebase";
  }

  @Override
  public String developmentUrl() {
    return DetachBuildConstants.DEVELOPMENT_URL;
  }

  @Override
  public List<String> sdkVersions() {
    return new ArrayList<>(Arrays.asList("31.0.0"));
  }

  @Override
  public List<ReactPackage> reactPackages() {
    return ((MainApplication) getApplication()).getPackages();
  }

  @Override
  public List<Package> expoPackages() {
    // Here you can add your own packages.
    return Arrays.<Package>asList(
            new FirebaseAppPackage(),
            new FirebaseAnalyticsPackage(),
            new FirebaseAuthPackage(),
            new FirebaseCrashlyticsPackage(),
            new FirebaseDatabasePackage(),
            new FirebaseFirestorePackage(),
            new FirebaseFunctionsPackage(),
            new FirebaseInstanceIDPackage(),
            new FirebaseInvitesPackage(),
            new FirebaseLinksPackage(),
            new FirebaseMessagingPackage(),
            new FirebaseNotificationsPackage(),
            new FirebasePerformancePackage(),
            new FirebaseRemoteConfigPackage(),
            new FirebaseStoragePackage()
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
