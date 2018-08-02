// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.expoview;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.os.UserManager;
import android.provider.Settings;
import android.util.Log;

import com.crashlytics.android.Crashlytics;
import com.facebook.common.internal.ByteStreams;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.stetho.Stetho;
import com.nostra13.universalimageloader.core.ImageLoader;
import com.nostra13.universalimageloader.core.ImageLoaderConfiguration;
import com.raizlabs.android.dbflow.config.FlowManager;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.apache.commons.io.output.TeeOutputStream;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.spongycastle.jce.provider.BouncyCastleProvider;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.security.Provider;
import java.security.Security;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import expo.core.interfaces.Package;
import expolib_v1.okhttp3.CacheControl;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.Constants;
import host.exp.exponent.ExpoHandler;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExpoResponse;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.PermissionsHelper;
import versioned.host.exp.exponent.ExponentPackageDelegate;

public class Exponent {

  private static final String TAG = Exponent.class.getSimpleName();
  private static final String PACKAGER_RUNNING = "running";

  private static Exponent sInstance;

  private Context mContext;
  private Application mApplication;
  private Activity mActivity;
  private Map<String, String> mBundleStrings = new HashMap<>();

  public String getBundleSource(final String path) {
    synchronized (mBundleStrings) {
      if (mBundleStrings.containsKey(path)) {
        final String result = mBundleStrings.get(path);
        mBundleStrings.remove(path);
        return result;
      } else {
        return null;
      }
    }
  }

  @Inject
  ExponentNetwork mExponentNetwork;

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExpoHandler mExpoHandler;

  public static void initialize(Context context, Application application) {
    if (sInstance == null) {
      new Exponent(context, application);
    }
  }

  public static Exponent getInstance() {
    return sInstance;
  }

  private Exponent(Context context, Application application) {
    sInstance = this;

    mContext = context;
    mApplication = application;

    // Ensure Spongy Castle installed so the security providers don't change
    // non-deterministically during the process's lifetime
    Exponent.getBouncyCastleProvider();

    NativeModuleDepsProvider.initialize(application);
    NativeModuleDepsProvider.getInstance().inject(Exponent.class, this);

    // Verifying SSL certs is slow on Android, so send an HTTPS request to our server as early as possible.
    // This speeds up the manifest request in a shell app from ~500ms to ~250ms.
    try {
      mExponentNetwork.getClient().call(new Request.Builder().url(Constants.API_HOST + "/status").build(), new ExpoHttpCallback() {
        @Override
        public void onFailure(IOException e) {
          EXL.d(TAG, e.toString());
        }

        @Override
        public void onResponse(ExpoResponse response) throws IOException {
          ExponentNetwork.flushResponse(response);
          EXL.d(TAG, "Loaded exp.host status page.");
        }
      });
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }


    // Fixes Android memory leak
    try {
      UserManager.class.getMethod("get", Context.class).invoke(null, context);
    } catch (Throwable e) {
      EXL.testError(e);
    }

    try {
      Fresco.initialize(context);
    } catch (RuntimeException e) {
      EXL.testError(e);
    }


    // Amplitude
    Analytics.initializeAmplitude(context, application);

    // TODO: profile this
    FlowManager.init(context);


    if (ExpoViewBuildConfig.DEBUG) {
      Stetho.initializeWithDefaults(context);
    }

    try {
      ImageLoader.getInstance().init(new ImageLoaderConfiguration.Builder(context).build());
    } catch (RuntimeException e) {
      EXL.testError(e);
    }

    if (!ExpoViewBuildConfig.DEBUG) {
      // There are a few places in RN code that throw NetworkOnMainThreadException.
      // WebsocketJavaScriptExecutor.connectInternal closes a websocket on the main thread.
      // Shouldn't actually block the ui since it's fire and forget so not high priority to fix the root cause.
      StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
      StrictMode.setThreadPolicy(policy);
    }
  }

  public void setCurrentActivity(Activity activity) {
    mActivity = activity;
  }

  public Activity getCurrentActivity() {
    return mActivity;
  }

  public final void runOnUiThread(Runnable action) {
    if (Thread.currentThread() != Looper.getMainLooper().getThread()) {
      new Handler(mContext.getMainLooper()).post(action);
    } else {
      action.run();
    }
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

  private List<ActivityResultListener> mActivityResultListeners = new ArrayList<>();
  private PermissionsHelper mPermissionsHelper;

  public boolean getPermissions(String permissions, ExperienceId experienceId) {
    return new PermissionsHelper(experienceId).getPermissions(permissions);
  }

  public boolean requestPermissions(PermissionsListener listener, String[] permissions,
                                    ExperienceId experienceId, String experienceName) {
    mPermissionsHelper = new PermissionsHelper(experienceId);
    return mPermissionsHelper.requestPermissions(listener, permissions, experienceName);
  }

  public void requestExperiencePermissions(PermissionsListener listener, String[] permissions,
                                           ExperienceId experienceId, String experienceName) {
    new PermissionsHelper(experienceId).requestExperiencePermissions(listener, permissions, experienceName);
  }

  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    if (permissions.length > 0 && grantResults.length > 0 && mPermissionsHelper != null) {
      mPermissionsHelper.onRequestPermissionsResult(requestCode, permissions, grantResults);
      mPermissionsHelper = null;
    }
  }


  public static class InstanceManagerBuilderProperties {
    public Application application;
    public String jsBundlePath;
    public RNObject linkingPackage;
    public Map<String, Object> experienceProperties;
    public List<Package> expoPackages;
    public ExponentPackageDelegate exponentPackageDelegate;
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
    if (!ExpoViewBuildConfig.DEBUG) {
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


  public String encodeExperienceId(final String manifestId) throws UnsupportedEncodingException {
    return URLEncoder.encode("experience-" + manifestId, "UTF-8");
  }





  /*
   *
   * Bundle loading
   *
   */

  public interface BundleListener {
    void onBundleLoaded(String localBundlePath);

    void onError(Exception e);
  }

  // `id` must be URL encoded. Returns true if found cached bundle.
  public boolean loadJSBundle(final JSONObject manifest, final String urlString, final String id, String abiVersion, final BundleListener bundleListener) {
    return loadJSBundle(manifest, urlString, id, abiVersion, bundleListener, false);
  }

  public boolean loadJSBundle(JSONObject manifest, final String urlString, final String id, String abiVersion, final BundleListener bundleListener, boolean shouldForceNetwork) {
    return loadJSBundle(manifest, urlString, id, abiVersion, bundleListener, shouldForceNetwork, false);
  }

  public boolean loadJSBundle(JSONObject manifest, final String urlString, final String id, String abiVersion, final BundleListener bundleListener, boolean shouldForceNetwork, boolean shouldForceCache) {
    if (!id.equals(KernelConstants.KERNEL_BUNDLE_ID)) {
      Analytics.markEvent(Analytics.TimedEvent.STARTED_FETCHING_BUNDLE);
    }

    if (manifest == null) {
      manifest = new JSONObject();
    }

    boolean isDeveloping = manifest.has("developer");
    if (isDeveloping) {
      // This is important for running locally with no-dev
      shouldForceNetwork = true;
    }

    // The bundle is cached in two places:
    //   1. The OkHttp cache (which lives in internal storage)
    //   2. Written to our own file (in cache dir)
    // Ideally we'd take the OkHttp response and send the InputStream directly to RN but RN doesn't
    // support that right now so we need to write the response to a file.
    // getCacheDir() doesn't work here! Some phones clean the file up in between when we check
    // file.exists() and when we feed it into React Native!
    // TODO: clean up files here!
    final String fileName = KernelConstants.BUNDLE_FILE_PREFIX + id + Integer.toString(urlString.hashCode()) + '-' + abiVersion;
    final File directory = new File(mContext.getFilesDir(), abiVersion);
    if (!directory.exists()) {
      directory.mkdir();
    }

    try {
      Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToUrl(urlString, false, KernelConstants.KERNEL_BUNDLE_ID.equals(id));
      if (shouldForceNetwork) {
        requestBuilder.cacheControl(CacheControl.FORCE_NETWORK);
      }
      Request request = requestBuilder.build();
      // Use OkHttpClient with long read timeout for dev bundles
      ExponentHttpClient.SafeCallback callback = new ExponentHttpClient.SafeCallback() {
        @Override
        public void onFailure(IOException e) {
          bundleListener.onError(e);
        }

        @Override
        public void onResponse(ExpoResponse response) {
          if (!response.isSuccessful()) {
            String body = "(could not render body)";
            try {
              body = response.body().string();
            } catch (IOException e) {
              EXL.e(TAG, e);
            }
            bundleListener.onError(new Exception("Bundle return code: " + response.code() +
                ". With body: " + body));
            return;
          }

          if (!id.equals(KernelConstants.KERNEL_BUNDLE_ID)) {
            Analytics.markEvent(Analytics.TimedEvent.FINISHED_FETCHING_BUNDLE);
          }

          try {
            if (!id.equals(KernelConstants.KERNEL_BUNDLE_ID)) {
              Analytics.markEvent(Analytics.TimedEvent.STARTED_WRITING_BUNDLE);
            }
            final File sourceFile = new File(directory, fileName);
            boolean hasCachedSourceFile = false;

            if (response.networkResponse() == null || response.networkResponse().code() == KernelConstants.HTTP_NOT_MODIFIED) {
              // If we're getting a cached response don't rewrite the file to disk.
              EXL.d(TAG, "Got cached OkHttp response for " + urlString);
              if (sourceFile.exists()) {
                hasCachedSourceFile = true;
                EXL.d(TAG, "Have cached source file for " + urlString);
              }
            }

            if (!hasCachedSourceFile) {
              InputStream inputStream = null;
              FileOutputStream fileOutputStream = null;
              ByteArrayOutputStream byteArrayOutputStream = null;
              TeeOutputStream teeOutputStream = null;

              try {
                EXL.d(TAG, "Do not have cached source file for " + urlString);
                inputStream = response.body().byteStream();

                fileOutputStream = new FileOutputStream(sourceFile);
                byteArrayOutputStream = new ByteArrayOutputStream();

                // Multiplex the stream. Write both to file and string.
                teeOutputStream = new TeeOutputStream(fileOutputStream, byteArrayOutputStream);

                ByteStreams.copy(inputStream, teeOutputStream);
                teeOutputStream.flush();

                mBundleStrings.put(sourceFile.getAbsolutePath(), byteArrayOutputStream.toString());

                fileOutputStream.flush();
                fileOutputStream.getFD().sync();
              } finally {
                IOUtils.closeQuietly(teeOutputStream);
                IOUtils.closeQuietly(fileOutputStream);
                IOUtils.closeQuietly(byteArrayOutputStream);
                IOUtils.closeQuietly(inputStream);
              }
            }

            if (!id.equals(KernelConstants.KERNEL_BUNDLE_ID)) {
              Analytics.markEvent(Analytics.TimedEvent.FINISHED_WRITING_BUNDLE);
            }

            if (Constants.WRITE_BUNDLE_TO_LOG) {
              printSourceFile(sourceFile.getAbsolutePath());
            }

            mExpoHandler.post(new Runnable() {
              @Override
              public void run() {
                bundleListener.onBundleLoaded(sourceFile.getAbsolutePath());
              }
            });
          } catch (Exception e) {
            bundleListener.onError(e);
          }
        }

        @Override
        public void onCachedResponse(ExpoResponse response, boolean isEmbedded) {
          EXL.d(TAG, "Using cached or embedded response.");
          onResponse(response);
        }
      };

      if (shouldForceCache) {
        mExponentNetwork.getLongTimeoutClient().tryForcedCachedResponse(request.url().toString(), request, callback, null, null);
      } else if (shouldForceNetwork) {
        mExponentNetwork.getLongTimeoutClient().callSafe(request, callback);
      } else {
        mExponentNetwork.getLongTimeoutClient().callDefaultCache(request, callback);
      }
    } catch (Exception e) {
      bundleListener.onError(e);
    }

    // Guess whether we'll use the cache based on whether the source file is saved.
    final File sourceFile = new File(directory, fileName);
    return sourceFile.exists();
  }

  private void printSourceFile(String path) {
    EXL.d(KernelConstants.BUNDLE_TAG, "Printing bundle:");
    InputStream inputStream = null;
    try {
      inputStream = new FileInputStream(path);

      InputStreamReader inputReader = new InputStreamReader(inputStream);
      BufferedReader bufferedReader = new BufferedReader(inputReader);

      String line;
      do {
        line = bufferedReader.readLine();
        EXL.d(KernelConstants.BUNDLE_TAG, line);
      } while (line != null);
    } catch (Exception e) {
      EXL.e(KernelConstants.BUNDLE_TAG, e.toString());
    } finally {
      if (inputStream != null) {
        try {
          inputStream.close();
        } catch (IOException e) {
          EXL.e(KernelConstants.BUNDLE_TAG, e.toString());
        }
      }
    }
  }



  public static int getPort(String url) {
    if (!url.contains("://")) {
      url = "http://" + url;
    }

    Uri uri = Uri.parse(url);
    int port = uri.getPort();
    if (port == -1) {
      return 80;
    } else {
      return port;
    }
  }

  public static String getHostname(String url) {
    if (!url.contains("://")) {
      url = "http://" + url;
    }

    Uri uri = Uri.parse(url);
    return uri.getHost();
  }

  public static void enableDeveloperSupport(String sdkVersion, String debuggerHost, String mainModuleName,
                                            RNObject builder) {
    if (!debuggerHost.isEmpty() && !mainModuleName.isEmpty()) {
      try {
        if (ABIVersion.toNumber(sdkVersion) < 20) {
          RNObject fieldObject;
          fieldObject = new RNObject("com.facebook.react.devsupport.DevServerHelper");
          fieldObject.loadVersion(builder.version());
          if (!hasDeclaredField(fieldObject.rnClass(), "DEVICE_LOCALHOST")) {
            fieldObject = new RNObject("com.facebook.react.modules.systeminfo.AndroidInfoHelpers");
            fieldObject.loadVersion(builder.version());
          }

          Field deviceField = fieldObject.rnClass().getDeclaredField("DEVICE_LOCALHOST");
          deviceField.setAccessible(true);
          deviceField.set(null, debuggerHost);

          Field genymotionField = fieldObject.rnClass().getDeclaredField("GENYMOTION_LOCALHOST");
          genymotionField.setAccessible(true);
          genymotionField.set(null, debuggerHost);

          Field emulatorField = fieldObject.rnClass().getDeclaredField("EMULATOR_LOCALHOST");
          emulatorField.setAccessible(true);
          emulatorField.set(null, debuggerHost);

          builder.callRecursive("setUseDeveloperSupport", true)
              .callRecursive("setJSMainModuleName", mainModuleName);
        } else {
          RNObject fieldObject = new RNObject("com.facebook.react.modules.systeminfo.AndroidInfoHelpers");
          fieldObject.loadVersion(builder.version());

          String debuggerHostHostname = getHostname(debuggerHost);
          int debuggerHostPort = getPort(debuggerHost);

          Field deviceField = fieldObject.rnClass().getDeclaredField("DEVICE_LOCALHOST");
          deviceField.setAccessible(true);
          deviceField.set(null, debuggerHostHostname);

          Field genymotionField = fieldObject.rnClass().getDeclaredField("GENYMOTION_LOCALHOST");
          genymotionField.setAccessible(true);
          genymotionField.set(null, debuggerHostHostname);

          Field emulatorField = fieldObject.rnClass().getDeclaredField("EMULATOR_LOCALHOST");
          emulatorField.setAccessible(true);
          emulatorField.set(null, debuggerHostHostname);

          Field debugServerHostPortField = fieldObject.rnClass().getDeclaredField("DEBUG_SERVER_HOST_PORT");
          debugServerHostPortField.setAccessible(true);
          debugServerHostPortField.set(null, debuggerHostPort);

          Field inspectorProxyPortField = fieldObject.rnClass().getDeclaredField("INSPECTOR_PROXY_PORT");
          inspectorProxyPortField.setAccessible(true);
          inspectorProxyPortField.set(null, debuggerHostPort);

          builder.callRecursive("setUseDeveloperSupport", true);
          if (ABIVersion.toNumber(sdkVersion) < 22) {
            builder.callRecursive("setJSMainModuleName", mainModuleName);
          } else {
            builder.callRecursive("setJSMainModulePath", mainModuleName);
          }
        }
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (NoSuchFieldException e) {
        e.printStackTrace();
      }
    }
  }

  private static boolean hasDeclaredField(Class clazz, String field) {
    try {
      clazz.getDeclaredField(field);
      return true;
    } catch (NoSuchFieldException e) {
      return false;
    }
  }


  public interface PackagerStatusCallback {
    void onSuccess();
    void onFailure(String errorMessage);
  }

  public void testPackagerStatus(final boolean isDebug, final JSONObject mManifest, final PackagerStatusCallback callback) {
    if (!isDebug) {
      callback.onSuccess();
      return;
    }

    final String debuggerHost = mManifest.optString(ExponentManifest.MANIFEST_DEBUGGER_HOST_KEY);
    mExponentNetwork.getNoCacheClient().newCall(new Request.Builder().url("http://" + debuggerHost + "/status").build()).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        EXL.d(TAG, e.toString());
        callback.onFailure("Packager is not running at http://" + debuggerHost);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        final String responseString = response.body().string();
        if (responseString.contains(PACKAGER_RUNNING)) {
          runOnUiThread(new Runnable() {
            @Override
            public void run() {
              callback.onSuccess();
            }
          });
        } else {
          callback.onFailure("Packager is not running at http://" + debuggerHost);
        }
      }
    });
  }


  public interface StartReactInstanceDelegate {
    boolean isDebugModeEnabled();
    boolean isInForeground();
    ExponentPackageDelegate getExponentPackageDelegate();
    void handleUnreadNotifications(JSONArray unreadNotifications);
  }

  private static int currentActivityId = 0;
  public static int getActivityId() {
    return currentActivityId++;
  }

  public boolean shouldRequestDrawOverOtherAppsPermission() {
    return (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(mContext));
  }

  public void preloadManifestAndBundle(final String manifestUrl) {
    try {
      mExponentManifest.fetchManifest(manifestUrl, new ExponentManifest.ManifestListener() {
        @Override
        public void onCompleted(JSONObject manifest) {
          try {
            String bundleUrl = manifest.getString(ExponentManifest.MANIFEST_BUNDLE_URL_KEY);

            preloadBundle(
                manifest,
                manifestUrl,
                bundleUrl,
                manifest.getString(ExponentManifest.MANIFEST_ID_KEY),
                manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY));
          } catch (JSONException e) {
            EXL.e(TAG, e);
          } catch (Exception e) {
            // Don't let any errors through
            EXL.e(TAG, "Couldn't preload bundle: " + e.toString());
          }
        }

        @Override
        public void onError(Exception e) {
          EXL.e(TAG, "Couldn't preload manifest: " + e.toString());
        }

        @Override
        public void onError(String e) {
          EXL.e(TAG, "Couldn't preload manifest: " + e);
        }
      });
    } catch (Throwable e) {
      EXL.e(TAG, "Couldn't preload manifest: " + e.toString());
    }
  }

  private void preloadBundle(final JSONObject manifest, final String manifestUrl, final String bundleUrl, final String id, final String sdkVersion) {
    try {
      Exponent.getInstance().loadJSBundle(manifest, bundleUrl, Exponent.getInstance().encodeExperienceId(id), sdkVersion, new Exponent.BundleListener() {
        @Override
        public void onError(Exception e) {
          EXL.e(TAG, "Couldn't preload bundle: " + e.toString());
        }

        @Override
        public void onBundleLoaded(String localBundlePath) {
          EXL.d(TAG, "Successfully preloaded manifest and bundle for " + manifestUrl + " " + bundleUrl);
        }
      }, true);
    } catch (UnsupportedEncodingException e) {
      EXL.e(TAG, "Couldn't encode preloaded bundle id: " + e.toString());
    }
  }
}
