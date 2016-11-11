// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponentview;

import android.Manifest;
import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.UserManager;
import android.support.v4.content.ContextCompat;
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

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.Constants;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.generated.ExponentKeys;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.network.ExponentNetwork;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Request;
import okhttp3.Response;

import org.spongycastle.jce.provider.BouncyCastleProvider;
import java.security.Provider;
import java.security.Security;

public class Exponent {

  private static final String TAG = Exponent.class.getSimpleName();

  private static Exponent sInstance;

  private Context mContext;
  private Application mApplication;
  private Activity mActivity;

  @Inject
  ExponentNetwork mExponentNetwork;

  public static void initialize(Context context, Application application) {
    new Exponent(context, application);
  }

  public static Exponent getInstance() {
    return sInstance;
  }

  private Exponent(Context context, Application application) {
    sInstance = this;

    mContext = context;
    mApplication = application;

    NativeModuleDepsProvider.initialize(application);
    NativeModuleDepsProvider.getInstance().inject(Exponent.class, this);

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
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }


    // Fixes Android memory leak
    try {
      UserManager.class.getMethod("get", Context.class).invoke(null, context);
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    } catch (InvocationTargetException e) {
      e.printStackTrace();
    } catch (NoSuchMethodException e) {
      e.printStackTrace();
    }
    Fresco.initialize(context);


    // Amplitude
    Analytics.resetAmplitudeDatabaseHelper();
    Amplitude.getInstance().initialize(context, BuildConfig.DEBUG ? ExponentKeys.AMPLITUDE_DEV_KEY : ExponentKeys.AMPLITUDE_KEY);
    if (application != null) {
      Amplitude.getInstance().enableForegroundTracking(application);
    }
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
    FlowManager.init(context);

    FacebookSdk.sdkInitialize(context);


    if (BuildConfig.DEBUG) {
      Stetho.initializeWithDefaults(context);
    }

    ImageLoader.getInstance().init(new ImageLoaderConfiguration.Builder(context).build());
  }

  public void setCurrentActivity(Activity activity) {
    mActivity = activity;
  }

  public Activity getCurrentActivity() {
    return mActivity;
  }




  private String mGCMSenderId;
  public void setGCMSenderId(final String senderId) {
    mGCMSenderId = senderId;
  }

  public String getGCMSenderId() {
    return mGCMSenderId;
  }




  public interface PermissionsListener {
    void permissionsGranted();

    void permissionsDenied();
  }

  private PermissionsListener mPermissionsListener;
  private static final int EXPONENT_PERMISSIONS_REQUEST = 13;
  private List<ActivityResultListener> mActivityResultListeners = new ArrayList<>();

  public boolean getPermissionToReadUserContacts(PermissionsListener listener) {
    return getPermissions(listener, new String[]{Manifest.permission.READ_CONTACTS});
  }

  public boolean getPermissions(PermissionsListener listener, String[] permissions) {
    if (mActivity == null) {
      return false;
    }

    // Compiler is dumb and shows error on M api calls if these two ifs are merged.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      listener.permissionsGranted();
    }
    // Dumb compiler.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true;
    }

    boolean isGranted = true;
    List<String> permissionsToRequest = new ArrayList<>();
    List<String> permissionsToExplain = new ArrayList<>();
    for (String permission : permissions) {
      if (ContextCompat.checkSelfPermission(mActivity, permission) != PackageManager.PERMISSION_GRANTED) {
        isGranted = false;
        permissionsToRequest.add(permission);

        if (mActivity.shouldShowRequestPermissionRationale(permission)) {
          permissionsToExplain.add(permission);
        }
      }
    }

    if (isGranted) {
      listener.permissionsGranted();
      return true;
    }

    // TODO: explain why this experience needs permissionsToExplain

    mPermissionsListener = listener;
    mActivity.requestPermissions(permissionsToRequest.toArray(new String[permissionsToRequest.size()]),
        EXPONENT_PERMISSIONS_REQUEST);

    return true;
  }

  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    if (requestCode == EXPONENT_PERMISSIONS_REQUEST) {
      if (mPermissionsListener == null) {
        // sometimes onRequestPermissionsResult is called multiple times if the first permission
        // is rejected...
        return;
      }

      boolean isGranted = false;
      if (grantResults.length > 0) {
        isGranted = true;
        for (int result : grantResults) {
          if (result != PackageManager.PERMISSION_GRANTED) {
            isGranted = false;
            break;
          }
        }
      }

      if (isGranted) {
        mPermissionsListener.permissionsGranted();
      } else {
        mPermissionsListener.permissionsDenied();
      }
      mPermissionsListener = null;
    } else {
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
        mActivity.onRequestPermissionsResult(requestCode, permissions, grantResults);
      }
    }
  }



  public static class InstanceManagerBuilderProperties {
    public Application application;
    public String jsBundlePath;
    public RNObject linkingPackage;
    public Map<String, Object> experienceProperties;
    public JSONObject manifest;
  }






  public void addActivityResultListener(ActivityResultListener listener) {
    mActivityResultListeners.add(listener);
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    for (ActivityResultListener listener : mActivityResultListeners) {
      listener.onActivityResult(requestCode, resultCode, data);
    }
  }


  public Application getApplication() {
    return mApplication;
  }





  public static void logException(Throwable throwable) {
    if (!BuildConfig.DEBUG) {
      try {
        Crashlytics.logException(throwable);
      } catch (Throwable e) {
        Log.e(TAG, e.toString());
      }
    }
  }





  private static Provider sBouncyCastleProvider;

  public static synchronized Provider getBouncyCastleProvider() {
    if (sBouncyCastleProvider == null) {
      sBouncyCastleProvider = new BouncyCastleProvider();
      Security.insertProviderAt(sBouncyCastleProvider, 1);
    }

    return sBouncyCastleProvider;
  }
}
