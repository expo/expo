package expo.modules.webbrowser;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.customtabs.CustomTabsIntent;
import android.text.TextUtils;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.errors.CurrentActivityNotFoundException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.List;

import expo.modules.webbrowser.error.NoPreferredPackageFound;
import expo.modules.webbrowser.error.PackageManagerNotFoundException;

public class WebBrowserModule extends ExportedModule {

  private final static String BROWSER_PACKAGE_KEY = "browserPackage";
  private final static String SERVICE_PACKAGE_KEY = "servicePackage";
  private final static String BROWSER_PACKAGES_KEY = "browserPackages";
  private final static String SERVICE_PACKAGES_KEY = "servicePackages";
  private final static String PREFERRED_BROWSER_PACKAGE = "preferredBrowserPackage";
  private final static String DEFAULT_BROWSER_PACKAGE = "defaultBrowserPackage";

  private final static String SHOW_IN_RECENTS = "showInRecents";

  private final static String TOOLBAR_COLOR_KEY = "toolbarColor";
  private final static String ERROR_CODE = "EXWebBrowser";
  private static final String TAG = "ExpoWebBrowser";
  private static final String SHOW_TITLE_KEY = "showTitle";
  private static final String ENABLE_BAR_COLLAPSING_KEY = "enableBarCollapsing";

  private final static String NO_PREFERRED_PACKAGE_MSG = "Cannot determine preferred package without satisfying it.";

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
  public void onCreate(ModuleRegistry moduleRegistry) {
    mCustomTabsResolver = new CustomTabsActivitiesHelper(moduleRegistry);
    mConnectionHelper = new CustomTabsConnectionHelper(getContext());
  }

  @ExpoMethod
  public void warmUpAsync(@Nullable String packageName, final Promise promise) {
    try {
      packageName = givenOfPreferredPackageName(packageName);
      mConnectionHelper.warmUp(packageName);
      Bundle result = new Bundle();
      result.putString(SERVICE_PACKAGE_KEY, packageName);
      promise.resolve(result);
    } catch (NoPreferredPackageFound ex) {
      promise.reject(ex);
    }
  }

  @ExpoMethod
  public void coolDownAsync(@Nullable String packageName, final Promise promise) {
    try {
      packageName = givenOfPreferredPackageName(packageName);
      if (mConnectionHelper.coolDown(packageName)) {
        Bundle result = new Bundle();
        result.putString(SERVICE_PACKAGE_KEY, packageName);
        promise.resolve(result);
      } else {
        promise.resolve(new Bundle());
      }
    } catch (NoPreferredPackageFound ex) {
      promise.reject(ex);
    }
  }

  @ExpoMethod
  public void mayInitWithUrlAsync(@Nullable final String url, String packageName, final Promise promise) {
    try {
      packageName = givenOfPreferredPackageName(packageName);
      mConnectionHelper.mayInitWithUrl(packageName, Uri.parse(url));
      Bundle result = new Bundle();
      result.putString(SERVICE_PACKAGE_KEY, packageName);
      promise.resolve(result);
    } catch (NoPreferredPackageFound ex) {
      promise.reject(ex);
    }
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
      promise.reject(ex);
    }
  }

  @ExpoMethod
  public void openBrowserAsync(final String url, ReadableArguments arguments, final Promise promise) {

    Intent intent = createCustomTabsIntent(arguments);
    intent.setData(Uri.parse(url));

    try {
      List<ResolveInfo> activities = mCustomTabsResolver.getResolvingActivities(intent);
      if (activities.size() > 0) {
        mCustomTabsResolver.startCustomTabs(intent);
        Bundle result = new Bundle();
        result.putString("type", "opened");
        promise.resolve(result);
      } else {
        promise.reject(ERROR_CODE, "No matching activity!");
      }
    } catch (CurrentActivityNotFoundException | PackageManagerNotFoundException ex) {
      promise.reject(ex);
    }

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

    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    if (!arguments.getBoolean(SHOW_IN_RECENTS, false)) {
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
    }

    return intent;
  }

  private String givenOfPreferredPackageName(@Nullable String packageName) throws NoPreferredPackageFound {
    try {
      if (TextUtils.isEmpty(packageName)) {
        packageName = mCustomTabsResolver.getPreferredCustomTabsResolvingActivity(null);
      }
    } catch (CurrentActivityNotFoundException | PackageManagerNotFoundException ex) {
      throw new NoPreferredPackageFound(NO_PREFERRED_PACKAGE_MSG);
    }
    if (TextUtils.isEmpty(packageName)) {
      throw new NoPreferredPackageFound(NO_PREFERRED_PACKAGE_MSG);
    }
    return packageName;
  }

}
