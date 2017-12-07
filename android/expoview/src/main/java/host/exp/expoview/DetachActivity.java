// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.expoview;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.soloader.SoLoader;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.List;

import javax.annotation.Nullable;
import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.RNObject;
import host.exp.exponent.ReactNativeStaticHelpers;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.DevBundleDownloadProgressListener;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.ExpoViewKernel;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.utils.ExperienceActivityUtils;

public abstract class DetachActivity extends ReactNativeActivity implements Exponent.StartReactInstanceDelegate {

  // Override me!
  public abstract String publishedUrl();
  public abstract String developmentUrl();
  public abstract List<String> sdkVersions();
  public abstract List<ReactPackage> reactPackages();
  public abstract boolean isDebug();

  @Inject
  ExponentManifest mExponentManifest;

  private String mIntentUri = null;

  private DevBundleDownloadProgressListener mDevBundleDownloadProgressListener = new DevBundleDownloadProgressListener() {
    @Override
    public void onProgress(final @Nullable String status, final @Nullable Integer done, final @Nullable Integer total) {
      UiThreadUtil.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          updateLoadingProgress(status, done, total);
        }
      });
    }
  };

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mReactRootView = new RNObject("host.exp.exponent.ReactUnthemedRootView");

    EventBus.getDefault().registerSticky(this);

    ExpoViewBuildConfig.DEBUG = isDebug();

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

    mIsInForeground = true;
    mActivityId = Exponent.getActivityId();

    SoLoader.init(this, false);

    NativeModuleDepsProvider.getInstance().inject(DetachActivity.class, this);

    String defaultUrl = isDebug() ? developmentUrl() : publishedUrl();
    Constants.INITIAL_URL = defaultUrl;
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

  public void onEventMainThread(ExpoViewKernel.ExpoViewErrorEvent event) {
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
      mExperienceIdString = manifest.getString(ExponentManifest.MANIFEST_ID_KEY);
      mExperienceId = ExperienceId.create(mExperienceIdString);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError("No ID found in manifest.");
      return;
    }

    Analytics.logEventWithManifestUrlSdkVersion(Analytics.LOAD_EXPERIENCE, mManifestUrl, mSDKVersion);

    ExperienceActivityUtils.updateOrientation(manifest, this);

    final JSONObject finalManifest = manifest;
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (!mIsInForeground) {
          return;
        }

        mReactRootView.loadVersion(RNObject.UNVERSIONED).construct(DetachActivity.this);
        setView((View) mReactRootView.get());

        String id;
        try {
          id = Exponent.getInstance().encodeExperienceId(mExperienceIdString);
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
          hasCachedBundle = Exponent.getInstance().loadJSBundle(mManifest, bundleUrl, id, mSDKVersion,
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

        ExperienceActivityUtils.setWindowTransparency(mSDKVersion, finalManifest, DetachActivity.this);

        showLoadingScreen(finalManifest);

        ExperienceActivityUtils.setTaskDescription(mExponentManifest, finalManifest, DetachActivity.this);
      }
    });
  }

  @Override
  protected void startReactInstance() {
    Exponent.getInstance().testPackagerStatus(isDebugModeEnabled(), mManifest, new Exponent.PackagerStatusCallback() {
      @Override
      public void onSuccess() {
        // TODO: annoying that we need to use RNObject.UNVERSIONED here
        mReactInstanceManager = startReactInstance(DetachActivity.this, null, null, RNObject.UNVERSIONED, null, true, reactPackages(), mDevBundleDownloadProgressListener);
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
  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    Exponent.getInstance().onRequestPermissionsResult(requestCode, permissions, grantResults);
  }
}
