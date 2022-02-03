package abi42_0_0.expo.modules.webbrowser;

import android.content.Intent;
import android.content.pm.ResolveInfo;

import abi42_0_0.org.unimodules.core.errors.CurrentActivityNotFoundException;
import abi42_0_0.org.unimodules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import abi42_0_0.expo.modules.webbrowser.error.PackageManagerNotFoundException;

public interface CustomTabsActivitiesHelper extends InternalModule {

  @NonNull
  ArrayList<String> getCustomTabsResolvingActivities() throws PackageManagerNotFoundException, CurrentActivityNotFoundException;

  @NonNull
  ArrayList<String> getCustomTabsResolvingServices() throws PackageManagerNotFoundException, CurrentActivityNotFoundException;

  @Nullable
  String getPreferredCustomTabsResolvingActivity(@Nullable List<String> packages) throws PackageManagerNotFoundException, CurrentActivityNotFoundException;

  @Nullable
  String getDefaultCustomTabsResolvingActivity() throws PackageManagerNotFoundException, CurrentActivityNotFoundException;

  void startCustomTabs(Intent intent) throws CurrentActivityNotFoundException;

  boolean canResolveIntent(Intent intent) throws PackageManagerNotFoundException, CurrentActivityNotFoundException;
}
