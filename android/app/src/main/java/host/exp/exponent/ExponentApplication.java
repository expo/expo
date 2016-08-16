// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.os.UserManager;
import android.support.multidex.MultiDexApplication;
import android.util.Log;

import com.amplitude.api.Amplitude;
import com.crashlytics.android.Crashlytics;
import com.facebook.FacebookSdk;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.stetho.Stetho;
import com.nostra13.universalimageloader.core.ImageLoader;
import com.nostra13.universalimageloader.core.ImageLoaderConfiguration;
import com.raizlabs.android.dbflow.config.FlowManager;

import org.json.JSONException;
import org.json.JSONObject;
import org.spongycastle.jce.provider.BouncyCastleProvider;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.security.Provider;
import java.security.Security;

import javax.inject.Inject;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.AppComponent;
import host.exp.exponent.di.AppModule;
import host.exp.exponent.di.DaggerAppComponent;
import host.exp.exponent.generated.ExponentKeys;
import host.exp.exponent.network.ExponentNetwork;
import io.fabric.sdk.android.Fabric;
import me.leolin.shortcutbadger.ShortcutBadger;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Request;
import okhttp3.Response;

public class ExponentApplication extends MultiDexApplication {

  private static final String TAG = ExponentApplication.class.getSimpleName();

  private static Provider sBouncyCastleProvider;
  private static ExponentApplication sApplication;

  public static synchronized Provider getBouncyCastleProvider() {
    if (sBouncyCastleProvider == null) {
      sBouncyCastleProvider = new BouncyCastleProvider();
      Security.insertProviderAt(sBouncyCastleProvider, 1);
    }

    return sBouncyCastleProvider;
  }

  public static ExponentApplication getApplication() {
    return sApplication;
  }

  private AppComponent mComponent;

  @Inject
  ExponentNetwork mExponentNetwork;

  @Override
  public void onCreate() {
    super.onCreate();

    if (!BuildConfig.DEBUG) {
      Fabric.with(this, new Crashlytics());
    }

    sApplication = this;
    getAppComponent().inject(this);

    // Verifying SSL certs is slow on Android, so send an HTTPS request to our server as early as possible.
    // This speeds up the manifest request in a shell app from ~500ms to ~250ms.
    try {
      mExponentNetwork.getClient().call(new Request.Builder().url(Constants.API_HOST + "/status").build(), new Callback() {
        @Override
        public void onFailure(Call call, IOException e) {
          EXL.d(TAG, e.toString());
        }

        @Override
        public void onResponse(Call call, Response response) throws IOException {
          ExponentNetwork.flushResponse(response);
          EXL.d(TAG, "Loaded status page.");
        }
      });
    } catch (RuntimeException e) {
      EXL.e(TAG, e);
    }

    // Fixes Android memory leak
    try {
      UserManager.class.getMethod("get", Context.class).invoke(null, this);
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    } catch (InvocationTargetException e) {
      e.printStackTrace();
    } catch (NoSuchMethodException e) {
      e.printStackTrace();
    }
    Fresco.initialize(this);

    // Amplitude
    Amplitude.getInstance().initialize(this, BuildConfig.DEBUG ? ExponentKeys.AMPLITUDE_DEV_KEY : ExponentKeys.AMPLITUDE_KEY)
        .enableForegroundTracking(this);
    try {
      JSONObject amplitudeUserProperties = new JSONObject();
      amplitudeUserProperties.put("INITIAL_URL", Constants.INITIAL_URL);
      amplitudeUserProperties.put("ABI_VERSIONS", Constants.ABI_VERSIONS);
      amplitudeUserProperties.put("TEMPORARY_ABI_VERSION", Constants.TEMPORARY_ABI_VERSION);
      Amplitude.getInstance().setUserProperties(amplitudeUserProperties);
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }

    // TODO: profile this
    FlowManager.init(this);

    FacebookSdk.sdkInitialize(this);

    try {
      // Remove the badge count on weird launchers
      // TODO: doesn't work on the Xiaomi phone. bug with the library
      ShortcutBadger.removeCount(this);
    } catch (RuntimeException e) {
      EXL.e(TAG, e);
    }

    if (BuildConfig.DEBUG) {
      Stetho.initializeWithDefaults(this);
    }

    ImageLoader.getInstance().init(new ImageLoaderConfiguration.Builder(this).build());
  }

  public AppComponent getAppComponent() {
    if (mComponent == null) {
      mComponent = DaggerAppComponent.builder()
          .appModule(new AppModule(this))
          .build();
    }

    return mComponent;
  }

  public static void logException(Throwable throwable) {
    if (!BuildConfig.DEBUG) {
      try {
        Crashlytics.logException(throwable);
      } catch (RuntimeException e) {
        Log.e(TAG, e.toString());
      }
    }
  }
}
