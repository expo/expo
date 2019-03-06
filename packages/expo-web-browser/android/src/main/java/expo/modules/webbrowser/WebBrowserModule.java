package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.support.customtabs.CustomTabsIntent;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.errors.CurrentActivityNotFoundException;
import expo.modules.webbrowser.error.PackageManagerNotFoundException;

public class WebBrowserModule extends ExportedModule implements ModuleRegistryConsumer, ActivityEventListener {
  private final static String ERROR_CODE = "EXWebBrowser";
  private static final String TAG = "ExpoWebBrowser";
  private Promise mOpenBrowserPromise;
  private static int OPEN_BROWSER_REQUEST_CODE = 873;

  private ChromeTabsActivitiesResolver mResolver;

  public WebBrowserModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mResolver = new ChromeTabsActivitiesResolver(moduleRegistry);
    if (moduleRegistry != null) {
      moduleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
    }
  }

  @ExpoMethod
  public void getCustomTabsSupportingBrowsers(final Promise promise) {
    try {
      List<ResolveInfo> resolveInfos = mResolver.getCustomTabsResolvingActivities();

      Bundle result = new Bundle();
      result.putStringArrayList("packages", mapCollectionToDistincrArrayList(resolveInfos, resolveInfo -> resolveInfo.activityInfo.packageName));

      promise.resolve(result);
    } catch (CurrentActivityNotFoundException | PackageManagerNotFoundException ex) {
      promise.reject(ERROR_CODE, "Unable to determine list of supporting applications");
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


    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    CustomTabsIntent customTabsIntent = builder.build();

    Intent intent = customTabsIntent.intent;
    intent.setData(Uri.parse(url));
    intent.putExtra(CustomTabsIntent.EXTRA_TITLE_VISIBILITY_STATE, CustomTabsIntent.NO_TITLE);

    try {
      List<ResolveInfo> activities = mResolver.getResolvingActivities(customTabsIntent.intent);
      if (activities.size() > 0) {
        mResolver.startChromeTabs(intent, OPEN_BROWSER_REQUEST_CODE);
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
      mOpenBrowserPromise = null;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // do nothing
  }

  private <T, R> ArrayList<R> mapCollectionToDistincrArrayList(Collection<? extends T> toMap, Function<T, R> mapper) {
    LinkedHashSet<R> resultSet = new LinkedHashSet<>();
    for (T element : toMap) {
      resultSet.add(mapper.apply(element));
    }
    return new ArrayList<>(resultSet);
  }

  private interface Function<T, R> {
    R apply(T val);
  }

}
