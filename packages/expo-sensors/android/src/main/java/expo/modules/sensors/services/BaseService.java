// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;

/* package */ abstract class BaseService implements ModuleRegistryConsumer, LifecycleEventListener {
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private boolean mIsForegrounded = false;

  /* package */ BaseService(Context context) {
    mContext = context;
  }

  protected Context getContext() {
    return mContext;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  @Override
  public void onHostResume() {
    mIsForegrounded = true;
    onExperienceForegrounded();
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }

  @Override
  public void onHostPause() {
    mIsForegrounded = false;
    onExperienceBackgrounded();
  }

  /* package */ boolean getExperienceIsForegrounded() {
    return mIsForegrounded;
  }

  abstract public void onExperienceForegrounded();
  abstract public void onExperienceBackgrounded();
}
