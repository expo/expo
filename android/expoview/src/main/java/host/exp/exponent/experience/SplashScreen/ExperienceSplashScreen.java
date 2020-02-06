package host.exp.exponent.experience.SplashScreen;

import android.app.Activity;
import android.util.Log;

import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.splashscreen.NoContentViewException;
import expo.modules.splashscreen.SplashScreen;

public class ExperienceSplashScreen {

  static private final String TAG = ExperienceSplashScreen.class.getSimpleName();

  private @Nullable ExperienceLoadingView mLoadingView;
  private @Nullable ExperienceSplashScreenConfig mSplashScreenConfig;

  /**
   * Shows SplashScreen and mounts LoadingView
   * @param rootViewClass - Class of the rootView that would be located and monitored for children occurrence (autohiding feature) and removal (reload).
   */
  public void showSplashScreen(Activity activity, @Nullable JSONObject manifest, @NonNull Class<?> rootViewClass) throws NoContentViewException {
    if (mSplashScreenConfig == null) {
      mSplashScreenConfig = ExperienceSplashScreenConfig.parseManifest(manifest);
    }

    boolean showDefaultIcon = manifest == null;

    ExperienceSplashScreenConfigurator splashScreenConfigurator = new ExperienceSplashScreenConfigurator(mSplashScreenConfig, showDefaultIcon);

    SplashScreen.show(
      activity,
      mSplashScreenConfig.getResizeMode(),
      rootViewClass,
      splashScreenConfigurator
    );

    if (manifest != null) {
      mLoadingView = new ExperienceLoadingView(activity);
    }
  }

  public void updateLoadingProgress(String status, Integer done, Integer total) {
    if (mLoadingView == null) {
      Log.w(TAG, "LoadingView is null. Cannot update progress bar.");
      return;
    }
    mLoadingView.updateProgress(status, done, total);
  }

  /**
   * Marks loading as completed and hide LoadingView.
   * Possibly
   */
  public void finishLoading(FinishLoadingCallback callback) {
    if (mLoadingView == null) {
      Log.w(TAG, "LoadingView is null. Cannot hide it.");
      return;
    }

    // TODO: ExperienceActivityUtils.setRootViewBackgroundColor(mManifest, getRootView());
    mLoadingView.hide();
    mLoadingView = null;
    callback.invoke();
  }

  public void interruptLoading(Activity activity, Exception error) {
    SplashScreen.hide(activity);
    if (mLoadingView != null) {
      mLoadingView.hide();
      mLoadingView = null;
    }
  }

  @FunctionalInterface
  public interface FinishLoadingCallback {
    void invoke();
  }
}
