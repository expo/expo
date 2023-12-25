package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import com.facebook.react.views.view.ReactViewGroup;

public abstract class MapFeature extends ReactViewGroup {
  public MapFeature(Context context) {
    super(context);
  }

  public abstract void addToMap(Object mapOrCollection);

  public abstract void removeFromMap(Object mapOrCollection);

  public abstract Object getFeature();
}
