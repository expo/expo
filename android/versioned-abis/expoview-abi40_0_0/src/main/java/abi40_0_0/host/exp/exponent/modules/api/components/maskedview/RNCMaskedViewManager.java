package abi40_0_0.host.exp.exponent.modules.api.components.maskedview;

import android.view.View;
import android.widget.Toast;

import abi40_0_0.com.facebook.react.bridge.ReadableArray;
import abi40_0_0.com.facebook.react.bridge.ReadableMap;
import abi40_0_0.com.facebook.react.common.MapBuilder;
import abi40_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi40_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi40_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi40_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RNCMaskedViewManager extends ViewGroupManager<RNCMaskedView> {
  private static final String REACT_CLASS = "RNCMaskedView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected RNCMaskedView createViewInstance(ThemedReactContext themedReactContext) {
    return new RNCMaskedView(themedReactContext);
  }
}
