package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import abi49_0_0.com.facebook.react.views.view.ReactViewGroup;

public abstract class MapFeature extends ReactViewGroup {
  public MapFeature(Context context) {
    super(context);
  }

  public abstract void addToMap(Object mapOrCollection);

  public abstract void removeFromMap(Object mapOrCollection);

  public abstract Object getFeature();
}
