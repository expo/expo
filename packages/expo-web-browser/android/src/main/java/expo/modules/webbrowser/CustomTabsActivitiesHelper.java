package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.customtabs.CustomTabsClient;
import android.support.customtabs.CustomTabsIntent;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.errors.CurrentActivityNotFoundException;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.Function;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;

import expo.modules.webbrowser.error.PackageManagerNotFoundException;

import static android.support.customtabs.CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION;

class CustomTabsActivitiesHelper {


  private final static String DUMMY_URL = "https://expo.io";

  private ModuleRegistry mModuleRegistry;

  CustomTabsActivitiesHelper(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;
  }

  ArrayList<String> getCustomTabsResolvingActivities() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return mapCollectionToDistinctArrayList(getResolvingActivities(createDefaultCustomTabsIntent()), resolveInfo -> resolveInfo.activityInfo.packageName);
  }

  ArrayList<String> getCustomTabsResolvingServices() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return mapCollectionToDistinctArrayList(getPackageManager().queryIntentServices(createDefaultCustomTabsServiceIntent(), 0), resolveInfo -> resolveInfo.serviceInfo.packageName);
  }

  String getPreferredCustomTabsResolvingActivity(@Nullable List<String> packages) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    if (packages == null) packages = getCustomTabsResolvingActivities();
    return CustomTabsClient.getPackageName(getCurrentActivity(), packages);
  }

  String getDefaultCustomTabsResolvingActivity() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return getPackageManager().resolveActivity(createDefaultCustomTabsIntent(), 0).activityInfo.packageName;
  }

  List<ResolveInfo> getResolvingActivities(@NonNull Intent intent) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    PackageManager pm = getPackageManager();
    if (pm == null) {
      throw new PackageManagerNotFoundException();
    }

    return pm.queryIntentActivities(intent, 0);
  }

  void startCustomTabs(Intent intent) throws CurrentActivityNotFoundException {
    getCurrentActivity().startActivity(intent);
  }

  private PackageManager getPackageManager() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    PackageManager pm = getCurrentActivity().getPackageManager();
    if (pm == null) throw new PackageManagerNotFoundException();
    else return pm;
  }

  private Activity getCurrentActivity() throws CurrentActivityNotFoundException {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    if (activityProvider == null || activityProvider.getCurrentActivity() == null) {
      throw new CurrentActivityNotFoundException();
    }
    return activityProvider.getCurrentActivity();
  }

  private Intent createDefaultCustomTabsIntent() {
    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    CustomTabsIntent customTabsIntent = builder.build();

    Intent intent = customTabsIntent.intent;
    intent.setData(Uri.parse(DUMMY_URL));
    return intent;
  }

  private Intent createDefaultCustomTabsServiceIntent() {
    Intent serviceIntent = new Intent();
    serviceIntent.setAction(ACTION_CUSTOM_TABS_CONNECTION);
    return serviceIntent;
  }

  public static <T, R> ArrayList<R> mapCollectionToDistinctArrayList(Collection<? extends T> toMap, Function<T, R> mapper) {
    LinkedHashSet<R> resultSet = new LinkedHashSet<>();
    for (T element : toMap) {
      resultSet.add(mapper.apply(element));
    }
    return new ArrayList<>(resultSet);
  }

}
