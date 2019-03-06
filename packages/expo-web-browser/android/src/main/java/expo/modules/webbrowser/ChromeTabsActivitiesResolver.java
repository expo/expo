package expo.modules.webbrowser;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.customtabs.CustomTabsIntent;

import java.util.List;

import expo.core.ModuleRegistry;
import expo.core.interfaces.ActivityProvider;
import expo.errors.CurrentActivityNotFoundException;
import expo.modules.webbrowser.error.PackageManagerNotFoundException;

class ChromeTabsActivitiesResolver {


  private final static String DUMMY_URL = "https://expo.io";

  private ModuleRegistry mModuleRegistry;

  ChromeTabsActivitiesResolver(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;
  }

  List<ResolveInfo> getCustomTabsResolvingActivities() throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    return getResolvingActivities(createDefaultChromeTabsIntent());
  }

  List<ResolveInfo> getResolvingActivities(@NonNull Intent intent) throws PackageManagerNotFoundException, CurrentActivityNotFoundException {
    PackageManager pm = getPackageManager();
    if (pm == null) {
      throw new PackageManagerNotFoundException();
    }

    return pm.queryIntentActivities(intent, 0);
  }

  void startChromeTabs(Intent intent, int requestCode) throws CurrentActivityNotFoundException {
    getCurrentActivity().startActivityForResult(ChromeTabsManagerActivity.createStartIntent(getCurrentActivity(), intent), requestCode);
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

  private Intent createDefaultChromeTabsIntent() {
    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
    CustomTabsIntent customTabsIntent = builder.build();

    Intent intent = customTabsIntent.intent;
    intent.setData(Uri.parse(DUMMY_URL));
    return intent;
  }

}
