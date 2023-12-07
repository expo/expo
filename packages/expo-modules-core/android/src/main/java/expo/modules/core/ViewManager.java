package expo.modules.core;

import android.view.View;

import expo.modules.core.interfaces.RegistryLifecycleListener;

@Deprecated
// TODO(@lukmccall): Remove in the SDK 51. We leave it for now because that class was used in the unimodules package interface.
public abstract class ViewManager<V extends View> implements RegistryLifecycleListener { }
