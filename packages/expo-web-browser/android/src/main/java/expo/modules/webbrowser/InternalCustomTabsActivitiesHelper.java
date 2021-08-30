package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.errors.CurrentActivityNotFoundException;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.Function;
import expo.modules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import expo.modules.webbrowser.error.PackageManagerNotFoundException;

import static androidx.browser.customtabs.CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION;

class InternalCustomTabsActivitiesHelper implements CustomTabsActivitiesHelper {


  private final static String DUMMY_URL = "https://expo.io";

  private ModuleRegistry mModuleRegistry;

  @NonNull
  public static <T, R> ArrayList<R> mapCollectionToDistinctArrayList(Collection<? extends T> toMap, Function<T, R> mapper) {
    LinkedHashSet<R> resultSet = new LinkedHashSet<>();
    for (T element : toMap) {
      resultSet.add(mapper.apply(element));
    }
    return new ArrayList<>(resultSet);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;
  }

  @Override
  @NonNull
  public ArrayList<String> getCustomTabsResolvingActivities() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return mapCollectionToDistinctArrayList(getResolvingActivities(createDefaultCustomTabsIntent()), resolveInfo -> resolveInfo.activityInfo.packageName);
  }

  @Override
  @NonNull
  public ArrayList<String> getCustomTabsResolvingServices() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return mapCollectionToDistinctArrayList(getPackageManager().queryIntentServices(createDefaultCustomTabsServiceIntent(), 0), resolveInfo -> resolveInfo.serviceInfo.packageName);
  }

  @Override
  @Nullable
  public String getPreferredCustomTabsResolvingActivity(@Nullable List<String> packages) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    if (packages == null) packages = getCustomTabsResolvingActivities();
    return CustomTabsClient.getPackageName(getCurrentActivity(), packages);
  }

  @Override
  @Nullable
  public String getDefaultCustomTabsResolvingActivity() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    ResolveInfo info = getPackageManager().resolveActivity(createDefaultCustomTabsIntent(), 0);
    return info == null ? null : info.activityInfo.packageName;
  }

  @Override
  public boolean canResolveIntent(@NonNull Intent intent) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return getResolvingActivities(intent).size() > 0;
  }

  public void startCustomTabs(Intent intent) throws CurrentActivityNotFoundException {
    getCurrentActivity().startActivity(intent);
  }

  private List<ResolveInfo> getResolvingActivities(@NonNull Intent intent) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return getPackageManager().queryIntentActivities(intent, 0);
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

  @Override
  public void onDestroy() {

  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(CustomTabsActivitiesHelper.class);
  }
}
