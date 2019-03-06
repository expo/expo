package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.customtabs.CustomTabsIntent;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;

public class WebBrowserModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {
  private final static String ERROR_CODE = "EXWebBrowser";
  private static final String TAG = "ExpoWebBrowser";
  private Promise mOpenBrowserPromise;
  protected static int OPEN_BROWSER_REQUEST_CODE = 873;

  private ModuleRegistry mModuleRegistry;

  public WebBrowserModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    if (moduleRegistry != null) {
      moduleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
    }
  }

  @ExpoMethod
  public void openBrowserAsync(final String url, final Promise promise) {
    if (mOpenBrowserPromise != null) {
      Bundle result = new Bundle();
      result.putString("type", "cancel");
      mOpenBrowserPromise.resolve(result);
      return;
    }
    mOpenBrowserPromise = promise;

    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    if (activityProvider == null || activityProvider.getCurrentActivity() == null) {
      promise.reject(ERROR_CODE, "No activity");
      mOpenBrowserPromise = null;
      return;
    }

    Activity activity = activityProvider.getCurrentActivity();

    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    CustomTabsIntent customTabsIntent = builder.build();

    Intent intent = customTabsIntent.intent;
    intent.setData(Uri.parse(url));
    intent.putExtra(CustomTabsIntent.EXTRA_TITLE_VISIBILITY_STATE, CustomTabsIntent.NO_TITLE);

    activity.startActivityForResult(ChromeTabsManagerActivity.createStartIntent(activity, intent), OPEN_BROWSER_REQUEST_CODE);
  }


  @ExpoMethod
  public void dismissBrowser(Promise promise) {
    promise.reject(ERROR_CODE, "Operation not supported on Android.");
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode == OPEN_BROWSER_REQUEST_CODE && mOpenBrowserPromise != null) {
      if (resultCode == ChromeTabsManagerActivity.DISMISSED_CODE) {
        Bundle result = new Bundle();
        result.putString("type", "cancel");
        mOpenBrowserPromise.resolve(result);
      }
      if (resultCode == ChromeTabsManagerActivity.UNSUPPORTED_INTENT_CODE) {
        mOpenBrowserPromise.reject(ERROR_CODE, "No matching activity!");
      }
      mOpenBrowserPromise = null;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // do nothing
  }
}
