// Copyright 2020-present 650 Industries. All rights reserved.

package abi39_0_0.host.exp.exponent.modules.universal;

import android.content.Context;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import expo.modules.updates.UpdatesConfiguration;
import abi39_0_0.expo.modules.updates.UpdatesInterface;
import abi39_0_0.expo.modules.updates.UpdatesService;
import expo.modules.updates.db.DatabaseHolder;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.launcher.Launcher;
import expo.modules.updates.launcher.SelectionPolicy;
import host.exp.exponent.ExpoUpdatesAppLoader;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;

public class UpdatesBinding extends UpdatesService implements UpdatesInterface {

  @Inject
  DatabaseHolder mDatabaseHolder;

  private static final String TAG = UpdatesBinding.class.getSimpleName();

  private String mManifestUrl;
  private ExpoUpdatesAppLoader mAppLoader;

  public UpdatesBinding(Context context, Map<String, Object> experienceProperties) {
    super(context);
    NativeModuleDepsProvider.getInstance().inject(UpdatesBinding.class, this);

    mManifestUrl = (String)experienceProperties.get(KernelConstants.MANIFEST_URL_KEY);
    mAppLoader = KernelProvider.getInstance().getAppLoaderForManifestUrl(mManifestUrl);
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) UpdatesInterface.class);
  }

  @Override
  public UpdatesConfiguration getConfiguration() {
    return mAppLoader.getUpdatesConfiguration();
  }

  @Override
  public SelectionPolicy getSelectionPolicy() {
    return mAppLoader.getSelectionPolicy();
  }

  @Override
  public File getDirectory() {
    return mAppLoader.getUpdatesDirectory();
  }

  @Override
  public DatabaseHolder getDatabaseHolder() {
    return mDatabaseHolder;
  }

  @Override
  public boolean isEmergencyLaunch() {
    return mAppLoader.isEmergencyLaunch();
  }

  @Override
  public boolean isUsingEmbeddedAssets() {
    return false;
  }

  @Override
  public boolean canRelaunch() {
    return true;
  }

  @Override
  public UpdateEntity getLaunchedUpdate() {
    return mAppLoader.getLauncher().getLaunchedUpdate();
  }

  @Override
  public Map<AssetEntity, String> getLocalAssetFiles() {
    return mAppLoader.getLauncher().getLocalAssetFiles();
  }

  @Override
  public void relaunchReactApplication(Launcher.LauncherCallback callback) {
    KernelProvider.getInstance().reloadVisibleExperience(mManifestUrl, true);
    callback.onSuccess();
  }
}
