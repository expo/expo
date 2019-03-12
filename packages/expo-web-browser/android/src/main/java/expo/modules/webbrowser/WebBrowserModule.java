package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.support.customtabs.CustomTabsIntent;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.arguments.ReadableArguments;
import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.errors.CurrentActivityNotFoundException;
import expo.modules.webbrowser.error.PackageManagerNotFoundException;

public class WebBrowserModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {

  private final static String BROWSER_PACKAGE_KEY = "browserPackage";
  private final static String SERVICE_PACKAGE_KEY = "servicePackage";
  private final static String BROWSER_PACKAGES_KEY = "browserPackages";
  private final static String SERVICE_PACKAGES_KEY = "servicePackages";
  private final static String PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage";
  private final static String DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage";

  private final static String TOOLBAR_COLOR_KEY = "toolbarColor";
  private final static String ERROR_CODE = "EXWebBrowser";
  private static final String TAG = "ExpoWebBrowser";
  private static final String SHOW_TITLE_KEY = "showTitle";
  private static final String ENABLE_BAR_COLLAPSING_KEY = "enableBarCollapsing";

  private Promise mOpenBrowserPromise;
  private static int OPEN_BROWSER_REQUEST_CODE = 873;

  private CustomTabsActivitiesHelper mCustomTabsResolver;
  private CustomTabsConnectionHelper mConnectionHelper;

  public WebBrowserModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mCustomTabsResolver = new CustomTabsActivitiesHelper(moduleRegistry);
    mConnectionHelper = new CustomTabsConnectionHelper(getContext());
    if (moduleRegistry != null) {
      moduleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
    }
  }

  @ExpoMethod
  public void warmUp(final String packageName, final Promise promise) {
    mConnectionHelper.warmUp(packageName);
    Bundle result = new Bundle();
    result.putString("type", "warming");
    result.putString(SERVICE_PACKAGE_KEY, packageName);
    promise.resolve(result);
  }

  @ExpoMethod
  public void coolDown(final String packageName, final Promise promise) {
    if (mConnectionHelper.coolDown(packageName)) {
      Bundle result = new Bundle();
      result.putString("result", "cooling");
      result.putString(SERVICE_PACKAGE_KEY, packageName);
      promise.resolve(result);
    } else {
      Bundle result = new Bundle();
      result.putString("result", "Nothing to cool down");
      result.putString(SERVICE_PACKAGE_KEY, packageName);
      promise.resolve(result);
    }
  }

  @ExpoMethod
  public void mayInitWithUrl(final String url, final String packageName, final Promise promise) {
    mConnectionHelper.mayInitWithUrl(packageName, Uri.parse(url));
    Bundle result = new Bundle();
    result.putString("type", "mayInitWithUrl");
    result.putString(SERVICE_PACKAGE_KEY, packageName);
    result.putString("url", url);
    promise.resolve(result);
  }

  @ExpoMethod
  public void getCustomTabsSupportingBrowsersAsync(final Promise promise) {
    try {
      ArrayList<String> activities = mCustomTabsResolver.getCustomTabsResolvingActivities();
      ArrayList<String> services = mCustomTabsResolver.getCustomTabsResolvingServices();
      String preferredPackage = mCustomTabsResolver.getPreferredCustomTabsResolvingActivity(activities);
      String defaultPackage = mCustomTabsResolver.getDefaultCustomTabsResolvingActivity();

      String defaultCustomTabsPackage = null;
      if (activities.contains(defaultPackage)) { // It might happen, that default activity does not support Chrome Tabs. Then it will be ResolvingActivity and we don't want to return it as a result.
        defaultCustomTabsPackage = defaultPackage;
      }

      Bundle result = new Bundle();
      result.putStringArrayList(BROWSER_PACKAGES_KEY, activities);
      result.putStringArrayList(SERVICE_PACKAGES_KEY, services);
      result.putString(PREFERRED_BROWSER_PACKAGE, preferredPackage);
      result.putString(DEFAULT_BROWSER_PACKAGE, defaultCustomTabsPackage);

      promise.resolve(result);
    } catch (CurrentActivityNotFoundException | PackageManagerNotFoundException ex) {
      promise.reject(ERROR_CODE, "Unable to determine list of supporting applications");
    }
  }

  @ExpoMethod
  public void openBrowserAsync(final String url, ReadableArguments arguments, final Promise promise) {
    if (mOpenBrowserPromise != null) {
      Bundle result = new Bundle();
      result.putString("type", "cancel");
      mOpenBrowserPromise.resolve(result);
      return;
    }
    mOpenBrowserPromise = promise;

    Intent intent = createCustomTabsIntent(arguments);
    intent.setData(Uri.parse(url));

    try {
      List<ResolveInfo> activities = mCustomTabsResolver.getResolvingActivities(intent);
      if (activities.size() > 0) {
        mCustomTabsResolver.startCustomTabs(intent, OPEN_BROWSER_REQUEST_CODE);
      } else {
        promise.reject(ERROR_CODE, "No matching activity!");
      }
    } catch (CurrentActivityNotFoundException ex) {
      promise.reject(ERROR_CODE, "No activity");
      mOpenBrowserPromise = null;
    } catch (PackageManagerNotFoundException ex) {
      promise.reject(ERROR_CODE, "No package manager");
      mOpenBrowserPromise = null;
    }

  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode == OPEN_BROWSER_REQUEST_CODE && mOpenBrowserPromise != null) {
      if (resultCode == CustomTabsManagerActivity.DISMISSED_CODE) {
        Bundle result = new Bundle();
        result.putString("type", "cancel");
        mOpenBrowserPromise.resolve(result);
      }
      mOpenBrowserPromise = null;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // do nothing
  }

  private Intent createCustomTabsIntent(ReadableArguments arguments) {
    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    String color = arguments.getString(TOOLBAR_COLOR_KEY);
    String packageName = arguments.getString(BROWSER_PACKAGE_KEY);
    try {
      if (!TextUtils.isEmpty(color)) {
        int intColor = Color.parseColor(color);
        builder.setToolbarColor(intColor);
      }
    } catch (IllegalArgumentException ignored) {
    }

    builder.setShowTitle(arguments.getBoolean(SHOW_TITLE_KEY, false));

    Intent intent = builder.build().intent;

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, arguments.getBoolean(ENABLE_BAR_COLLAPSING_KEY, false));
    if (!TextUtils.isEmpty(packageName)) {
      intent.setPackage(packageName);
    }

    return intent;
  }

}
