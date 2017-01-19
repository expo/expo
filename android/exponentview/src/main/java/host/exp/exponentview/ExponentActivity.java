// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponentview;

import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v7.app.AlertDialog;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.List;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.RNObject;
import host.exp.exponent.ReactNativeStaticHelpers;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.ExponentViewKernel;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.ExperienceActivityUtils;

public abstract class ExponentActivity extends ReactNativeActivity implements Exponent.StartReactInstanceDelegate {

  // Override me!
  public abstract String publishedUrl();
  public abstract String developmentUrl();
  public abstract List<String> sdkVersions();
  public abstract List<ReactPackage> reactPackages();
  public abstract boolean isDebug();

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private String mIntentUri = null;

  private String mManifestUrl;
  private String mManifestId;
  private String mSDKVersion;
  private JSONObject mManifest;
  private String mJSBundlePath;
  private int mActivityId;
  private boolean mIsInForeground = false;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mReactRootView = new RNObject("host.exp.exponent.ReactUnthemedRootView");

    EventBus.getDefault().registerSticky(this);

    ExponentViewBuildConfig.DEBUG = isDebug();

    // Set SDK versions
    Constants.setSdkVersions(sdkVersions());

    // Check if opened from xdl
    if (isDebug()) {
      Intent intent = getIntent();
      Uri uri = intent.getData();
      String intentUri = uri == null ? null : uri.toString();
      if (intentUri != null && intentUri.startsWith("exp")) {
        // TODO: do we need to do this?
        // Replace scheme with exp://
        int indexOfEndOfScheme = intentUri.indexOf("://");
        mIntentUri = "exp" + intentUri.substring(indexOfEndOfScheme);
      }
    }

    Exponent.initialize(this, getApplication());

    mIsInForeground = true;
    mActivityId = Exponent.getActivityId();

    SoLoader.init(this, false);

    NativeModuleDepsProvider.getInstance().inject(ExponentActivity.class, this);

    String defaultUrl = isDebug() ? developmentUrl() : publishedUrl();
    mManifestUrl = mIntentUri == null ? defaultUrl : mIntentUri;
    mExponentManifest.fetchManifest(mManifestUrl, new ExponentManifest.ManifestListener() {
      @Override
      public void onCompleted(JSONObject manifest) {
        try {
          onManifestLoaded(manifest);
        } catch (JSONException e) {
          KernelProvider.getInstance().handleError(e);
        }
      }

      @Override
      public void onError(Exception e) {
        KernelProvider.getInstance().handleError(e);
      }

      @Override
      public void onError(String e) {
        KernelProvider.getInstance().handleError(e);
      }
    });
  }

  @Override
  public void onDestroy() {
    super.onDestroy();

    EventBus.getDefault().unregister(this);
  }

  public void onEventMainThread(ExponentViewKernel.ExponentViewErrorEvent event) {
    TextView textView = new TextView(this);
    textView.setText(event.errorMessage);

    int statusBarHeight = 0;
    int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
    if (resourceId > 0) {
      statusBarHeight = getResources().getDimensionPixelSize(resourceId);
    }
    textView.setPadding(0, statusBarHeight, 0, 0);
    setView(textView);
    stopLoading();
  }

  private void onManifestLoaded(JSONObject manifest) throws JSONException {
    mManifest = manifest;

    final String bundleUrl = ExponentUrls.toHttp(manifest.getString("bundleUrl"));
    ReactNativeStaticHelpers.setBundleUrl(bundleUrl);
    manifest = mExponentManifest.normalizeManifest(mManifestUrl, manifest);

    // TODO: consolidate this with ExperienceActivity
    mSDKVersion = manifest.optString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

    try {
      mManifestId = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("No ID found in manifest.");
      return;
    }

    // Update manifest on disk
    mExponentSharedPreferences.updateManifest(mManifestUrl, manifest, bundleUrl);
    ExponentDB.saveExperience(mManifestUrl, manifest, bundleUrl);

    Analytics.logEventWithManifestUrlSdkVersion(Analytics.LOAD_EXPERIENCE, mManifestUrl, mSDKVersion);

    ExperienceActivityUtils.updateOrientation(manifest, this);

    final JSONObject finalManifest = manifest;
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (!mIsInForeground) {
          return;
        }

        mReactRootView.loadVersion(RNObject.UNVERSIONED).construct(ExponentActivity.this);
        setView((View) mReactRootView.get());

        String id;
        try {
          id = Exponent.getInstance().encodeExperienceId(mManifestId);
        } catch (UnsupportedEncodingException e) {
          KernelProvider.getInstance().handleError("Can't URL encode manifest ID");
          return;
        }

        boolean hasCachedBundle;
        if (isDebugModeEnabled()) {
          hasCachedBundle = false;
          waitForDrawOverOtherAppPermission("");
        } else {
          // TODO: make sure sdk version usage is safe here
          hasCachedBundle = Exponent.getInstance().loadJSBundle(bundleUrl, id, mSDKVersion,
              new Exponent.BundleListener() {
                @Override
                public void onBundleLoaded(String localBundlePath) {
                  waitForDrawOverOtherAppPermission(localBundlePath);
                }

                @Override
                public void onError(Exception e) {
                  KernelProvider.getInstance().handleError(e);
                }
              });
        }

        ExperienceActivityUtils.setWindowTransparency(mSDKVersion, finalManifest, ExponentActivity.this);

        if (hasCachedBundle) {
          showLoadingScreen(finalManifest);
        } else {
          showLongLoadingScreen(finalManifest);
        }

        ExperienceActivityUtils.setTaskDescription(mExponentManifest, finalManifest, ExponentActivity.this);
      }
    });
  }

  // Consolidate with ExperienceActivity
  public boolean isDebugModeEnabled() {
    try {
      return mExponentSharedPreferences.isDebugModeEnabled() ||
          (mManifest != null &&
              mManifest.has(ExponentManifest.MANIFEST_DEVELOPER_KEY) &&
              mManifest.has(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY) &&
              mManifest.getJSONObject(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY)
                  .optBoolean(ExponentManifest.MANIFEST_PACKAGER_OPTS_DEV_KEY, false));
    } catch (JSONException e) {
      return false;
    }
  }

  private void waitForDrawOverOtherAppPermission(String jsBundlePath) {
    mJSBundlePath = jsBundlePath;

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (isDebugModeEnabled() && !Settings.canDrawOverlays(this)) {
        new AlertDialog.Builder(this)
            .setTitle("Please enable \"Permit drawing over other apps\"")
            .setMessage("Click \"ok\" to open settings. Press the back button once you've enabled the setting.")
            .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
              public void onClick(DialogInterface dialog, int which) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE);
              }
            })
            .setCancelable(false)
            .show();

        return;
      }
    }

    startReactInstance();
  }

  private void startReactInstance() {
    Exponent.getInstance().testPackagerStatus(isDebugModeEnabled(), mManifest, new Exponent.PackagerStatusCallback() {
      @Override
      public void onSuccess() {
        // TODO: annoying that we need to use RNObject.UNVERSIONED here
        mReactInstanceManager = Exponent.getInstance().startReactInstance(ExponentActivity.this, ExponentActivity.this, mManifestUrl, null, mJSBundlePath, null, mManifest, RNObject.UNVERSIONED, null, true, mExponentSharedPreferences, mReactRootView, mActivityId, mIsCrashed, reactPackages());
      }

      @Override
      public void onFailure(final String errorMessage) {
        KernelProvider.getInstance().handleError(errorMessage);
      }
    });
  }

  @Override
  public void handleUnreadNotifications(JSONArray unreadNotifications) {
    // TODO
  }

  @Override
  public boolean isInForeground() {
    return mIsInForeground;
  }

  @Override
  protected void onResume() {
    super.onResume();

    Exponent.getInstance().setCurrentActivity(this);

    mIsInForeground = true;
  }

  @Override
  protected void onPause() {
    super.onPause();

    mIsInForeground = false;
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    Exponent.getInstance().onActivityResult(requestCode, resultCode, data);

    if (requestCode == KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE) {
      // startReactInstance() checks isInForeground and onActivityResult is called before onResume,
      // so manually set this here.
      mIsInForeground = true;
      startReactInstance();
    }
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    Exponent.getInstance().onRequestPermissionsResult(requestCode, permissions, grantResults);
  }
}
