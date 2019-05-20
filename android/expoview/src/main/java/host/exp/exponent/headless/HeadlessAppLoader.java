package host.exp.exponent.headless;

import android.app.Application;
import android.content.Context;
import android.net.Uri;

import com.facebook.react.ReactPackage;
import com.facebook.react.common.MapBuilder;
import com.facebook.soloader.SoLoader;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.unimodules.core.interfaces.Package;
import expo.loaders.provider.AppLoaderProvider;
import expo.loaders.provider.interfaces.AppLoaderInterface;
import expo.loaders.provider.interfaces.AppLoaderPackagesProviderInterface;
import expo.loaders.provider.interfaces.AppRecordInterface;
import host.exp.exponent.AppLoader;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.RNObject;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.utils.AsyncCondition;
import host.exp.exponent.utils.ExpoActivityIds;
import host.exp.expoview.Exponent;
import versioned.host.exp.exponent.ExponentPackage;
import versioned.host.exp.exponent.ExponentPackageDelegate;

import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;
import static host.exp.exponent.kernel.KernelConstants.INTENT_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.IS_HEADLESS_KEY;
import static host.exp.exponent.kernel.KernelConstants.LINKING_URI_KEY;
import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

// @tsapeta: Most parts of this class was just copied from ReactNativeActivity and ExperienceActivity,
// however it allows launching apps in the background, without the activity.
// I've found it pretty hard to make just one implementation that can be used in both cases,
// so I decided to go with a copy until we refactor these activity classes.

public class HeadlessAppLoader implements AppLoaderInterface, Exponent.StartReactInstanceDelegate {
  private static String READY_FOR_BUNDLE = "headlessAppReadyForBundle";

  private static final Map<Integer, String> sActivityIdToBundleUrl = new HashMap<>();

  private JSONObject mManifest;
  private String mManifestUrl;
  private String mSdkVersion;
  private String mDetachSdkVersion;
  private RNObject mReactInstanceManager = new RNObject("com.facebook.react.ReactInstanceManager");
  private Context mContext;
  private String mIntentUri;
  private boolean mIsReadyForBundle;
  private String mJSBundlePath;
  private HeadlessAppRecord mAppRecord;
  private AppLoaderProvider.Callback mCallback;
  private int mActivityId;

  public HeadlessAppLoader(Context context) {
    mContext = context;
  }

  public static boolean hasBundleUrlForActivityId(int activityId) {
    return activityId < -1 && sActivityIdToBundleUrl.containsKey(activityId);
  }

  public static String getBundleUrlForActivityId(int activityId) {
    return sActivityIdToBundleUrl.get(activityId);
  }

  @Override
  public AppRecordInterface loadApp(String appUrl, Map<String, Object> options, AppLoaderProvider.Callback callback) {
    mManifestUrl = appUrl;
    mAppRecord = new HeadlessAppRecord();
    mCallback = callback;
    mActivityId = ExpoActivityIds.getNextHeadlessActivityId();

    new AppLoader(mManifestUrl, true) {
      @Override
      public void onOptimisticManifest(final JSONObject optimisticManifest) {
      }

      @Override
      public void onManifestCompleted(final JSONObject manifest) {
        Exponent.getInstance().runOnUiThread(new Runnable() {
          @Override
          public void run() {
            try {
              String bundleUrl = ExponentUrls.toHttp(manifest.getString("bundleUrl"));

              sActivityIdToBundleUrl.put(mActivityId, bundleUrl);
              setManifest(mManifestUrl, manifest, bundleUrl);
            } catch (JSONException e) {
              mCallback.onComplete(false, new Exception(e.getMessage()));
            }
          }
        });
      }

      @Override
      public void onBundleCompleted(String localBundlePath) {
        setBundle(localBundlePath);
      }

      @Override
      public void emitEvent(JSONObject params) {
      }

      @Override
      public void onError(Exception e) {
        mCallback.onComplete(false, new Exception(e.getMessage()));
      }

      @Override
      public void onError(String e) {
        mCallback.onComplete(false, new Exception(e));
      }
    }.start();

    return mAppRecord;
  }

  public void setManifest(String manifestUrl, final JSONObject manifest, final String bundleUrl) {
    mManifestUrl = manifestUrl;
    mManifest = manifest;
    mSdkVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

    // Sometime we want to release a new version without adding a new .aar. Use TEMPORARY_ABI_VERSION
    // to point to the unversioned code in ReactAndroid.
    if (Constants.TEMPORARY_ABI_VERSION != null && Constants.TEMPORARY_ABI_VERSION.equals(mSdkVersion)) {
      mSdkVersion = RNObject.UNVERSIONED;
    }

    mDetachSdkVersion = Constants.isStandaloneApp() ? RNObject.UNVERSIONED : mSdkVersion;

    if (!RNObject.UNVERSIONED.equals(mSdkVersion)) {
      boolean isValidVersion = false;
      for (final String version : Constants.SDK_VERSIONS_LIST) {
        if (version.equals(mSdkVersion)) {
          isValidVersion = true;
          break;
        }
      }

      if (!isValidVersion) {
        mCallback.onComplete(false, new Exception(mSdkVersion + " is not a valid SDK version."));
        return;
      }
    }

    soloaderInit();

    // if we have an embedded initial url, we never need any part of this in the initial url
    // passed to the JS, so we check for that and filter it out here.
    // this can happen in dev mode on a detached app, for example, because the intent will have
    // a url like customscheme://localhost:19000 but we don't care about the localhost:19000 part.
    if (mIntentUri == null || mIntentUri.equals(Constants.INITIAL_URL)) {
      if (Constants.SHELL_APP_SCHEME != null) {
        mIntentUri = Constants.SHELL_APP_SCHEME + "://";
      } else {
        mIntentUri = mManifestUrl;
      }
    }

    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (mReactInstanceManager.isNotNull()) {
          mReactInstanceManager.onHostDestroy();
          mReactInstanceManager.assign(null);
        }

        if (isDebugModeEnabled()) {
          mJSBundlePath = "";
          startReactInstance();
        } else {
          mIsReadyForBundle = true;
          AsyncCondition.notify(READY_FOR_BUNDLE);
        }
      }
    });
  }

  public void setBundle(final String localBundlePath) {
    if (!isDebugModeEnabled()) {
      AsyncCondition.wait(READY_FOR_BUNDLE, new AsyncCondition.AsyncConditionListener() {
        @Override
        public boolean isReady() {
          return mIsReadyForBundle;
        }

        @Override
        public void execute() {
          mJSBundlePath = localBundlePath;
          startReactInstance();
          AsyncCondition.remove(READY_FOR_BUNDLE);
        }
      });
    }
  }

  public boolean isDebugModeEnabled() {
    return ExponentManifest.isDebugModeEnabled(mManifest);
  }

  public void soloaderInit() {
    if (mDetachSdkVersion != null) {
      SoLoader.init(mContext, false);
    }
  }

  // Override
  @SuppressWarnings("unchecked")
  private List<ReactPackage> reactPackages() {
    if (!Constants.isStandaloneApp()) {
      // Pass null if it's on Expo Client. In that case packages from ExperiencePackagePicker will be used instead.
      return null;
    }
    try {
      return ((AppLoaderPackagesProviderInterface<ReactPackage>) mContext.getApplicationContext()).getPackages();
    } catch (ClassCastException e) {
      e.printStackTrace();
      return null;
    }
  }

  // Override
  @SuppressWarnings("unchecked")
  public List<Package> expoPackages() {
    if (!Constants.isStandaloneApp()) {
      // Pass null if it's on Expo Client. In that case packages from ExperiencePackagePicker will be used instead.
      return null;
    }
    try {
      return ((AppLoaderPackagesProviderInterface) mContext.getApplicationContext()).getExpoPackages();
    } catch (ClassCastException e) {
      e.printStackTrace();
      return null;
    }
  }

  //region StartReactInstanceDelegate

  @Override
  public boolean isInForeground() {
    return false;
  }

  @Override
  public ExponentPackageDelegate getExponentPackageDelegate() {
    return null;
  }

  @Override
  public void handleUnreadNotifications(JSONArray unreadNotifications) {

  }

  //endregion

  private void startReactInstance() {
    Exponent.getInstance().testPackagerStatus(isDebugModeEnabled(), mManifest, new Exponent.PackagerStatusCallback() {
      @Override
      public void onSuccess() {
        mReactInstanceManager = startReactInstance(HeadlessAppLoader.this, mIntentUri, mDetachSdkVersion, reactPackages(), expoPackages());
      }

      @Override
      public void onFailure(final String errorMessage) {
        mCallback.onComplete(false, new Exception(errorMessage));
      }
    });
  }

  private RNObject startReactInstance(final Exponent.StartReactInstanceDelegate delegate, final String mIntentUri, final String mSDKVersion,
                                      final List<? extends Object> extraNativeModules, final List<Package> extraExpoPackages) {
    String linkingUri = getLinkingUri();
    Map<String, Object> experienceProperties = MapBuilder.<String, Object>of(
        MANIFEST_URL_KEY, mManifestUrl,
        LINKING_URI_KEY, linkingUri,
        INTENT_URI_KEY, mIntentUri,
        IS_HEADLESS_KEY, true
    );

    Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties = new Exponent.InstanceManagerBuilderProperties();
    instanceManagerBuilderProperties.application = (Application) mContext;
    instanceManagerBuilderProperties.jsBundlePath = mJSBundlePath;
    instanceManagerBuilderProperties.experienceProperties = experienceProperties;
    instanceManagerBuilderProperties.expoPackages = extraExpoPackages;
    instanceManagerBuilderProperties.exponentPackageDelegate = delegate.getExponentPackageDelegate();
    instanceManagerBuilderProperties.manifest = mManifest;
    instanceManagerBuilderProperties.singletonModules = ExponentPackage.getOrCreateSingletonModules(mContext, mManifest, extraExpoPackages);

    RNObject versionedUtils = new RNObject("host.exp.exponent.VersionedUtils").loadVersion(mSDKVersion);
    RNObject builder = versionedUtils.callRecursive("getReactInstanceManagerBuilder", instanceManagerBuilderProperties);

    if (extraNativeModules != null) {
      for (Object nativeModule : extraNativeModules) {
        builder.call("addPackage", nativeModule);
      }
    }

    if (delegate.isDebugModeEnabled()) {
      String debuggerHost = mManifest.optString(ExponentManifest.MANIFEST_DEBUGGER_HOST_KEY);
      String mainModuleName = mManifest.optString(ExponentManifest.MANIFEST_MAIN_MODULE_NAME_KEY);
      Exponent.enableDeveloperSupport(mSDKVersion, debuggerHost, mainModuleName, builder);
    }

    RNObject reactInstanceManager = builder.callRecursive("build");
    RNObject devSettings = reactInstanceManager.callRecursive("getDevSupportManager").callRecursive("getDevSettings");
    if (devSettings != null) {
      devSettings.setField("exponentActivityId", mActivityId);
    }

    reactInstanceManager.call("createReactContextInBackground");

    // keep a reference in app record, so it can be invalidated through AppRecord.invalidate()
    mAppRecord.setReactInstanceManager(reactInstanceManager);
    mCallback.onComplete(true, null);

    return reactInstanceManager;
  }

  // deprecated in favor of Expo.Linking.makeUrl
  // TODO: remove this
  private String getLinkingUri() {
    if (Constants.SHELL_APP_SCHEME != null) {
      return Constants.SHELL_APP_SCHEME + "://";
    } else {
      Uri uri = Uri.parse(mManifestUrl);
      String host = uri.getHost();
      if (host != null && (host.equals("exp.host") || host.equals("expo.io") || host.equals("exp.direct") || host.equals("expo.test") ||
          host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(".expo.test"))) {
        List<String> pathSegments = uri.getPathSegments();
        Uri.Builder builder = uri.buildUpon();
        builder.path(null);

        for (String segment : pathSegments) {
          if (ExponentManifest.DEEP_LINK_SEPARATOR.equals(segment)) {
            break;
          }
          builder.appendEncodedPath(segment);
        }

        return builder.appendEncodedPath(ExponentManifest.DEEP_LINK_SEPARATOR_WITH_SLASH).build().toString();
      } else {
        return mManifestUrl;
      }
    }
  }
}
