package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import abi49_0_0.com.facebook.react.views.view.ReactViewGroup;

public class MapCallout extends ReactViewGroup {
  private boolean tooltip = false;
  public int width;
  public int height;

  public MapCallout(Context context) {
    super(context);
  }

  public void setTooltip(boolean tooltip) {
    this.tooltip = tooltip;
  }

  public boolean getTooltip() {
    return this.tooltip;
  }
}
