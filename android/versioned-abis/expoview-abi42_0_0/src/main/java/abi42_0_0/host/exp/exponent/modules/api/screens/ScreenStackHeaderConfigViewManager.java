package abi42_0_0.host.exp.exponent.modules.api.screens;

import android.view.View;

import abi42_0_0.com.facebook.react.bridge.JSApplicationCausedNativeException;
import abi42_0_0.com.facebook.react.module.annotations.ReactModule;
import abi42_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi42_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi42_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nonnull;

@ReactModule(name = ScreenStackHeaderConfigViewManager.REACT_CLASS)
public class ScreenStackHeaderConfigViewManager extends ViewGroupManager<ScreenStackHeaderConfig> {

  protected static final String REACT_CLASS = "RNSScreenStackHeaderConfig";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ScreenStackHeaderConfig createViewInstance(ThemedReactContext reactContext) {
    return new ScreenStackHeaderConfig(reactContext);
  }

  @Override
  public void addView(ScreenStackHeaderConfig parent, View child, int index) {
    if (!(child instanceof ScreenStackHeaderSubview)) {
      throw new JSApplicationCausedNativeException("Config children should be of type " + ScreenStackHeaderSubviewManager.REACT_CLASS);
    }
    parent.addConfigSubview((ScreenStackHeaderSubview) child, index);
  }

  @Override
  public void onDropViewInstance(@Nonnull ScreenStackHeaderConfig view) {
    view.destroy();
  }

  @Override
  public void removeAllViews(ScreenStackHeaderConfig parent) {
    parent.removeAllConfigSubviews();
  }

  @Override
  public void removeViewAt(ScreenStackHeaderConfig parent, int index) {
    parent.removeConfigSubview(index);
  }

  @Override
  public int getChildCount(ScreenStackHeaderConfig parent) {
    return parent.getConfigSubviewsCount();
  }

  @Override
  public View getChildAt(ScreenStackHeaderConfig parent, int index) {
    return parent.getConfigSubview(index);
  }

  @Override
  public boolean needsCustomLayoutForChildren() {
    return true;
  }

  @Override
  protected void onAfterUpdateTransaction(ScreenStackHeaderConfig parent) {
    super.onAfterUpdateTransaction(parent);
    parent.onUpdate();
  }

  @ReactProp(name = "title")
  public void setTitle(ScreenStackHeaderConfig config, String title) {
    config.setTitle(title);
  }

  @ReactProp(name = "titleFontFamily")
  public void setTitleFontFamily(ScreenStackHeaderConfig config, String titleFontFamily) {
    config.setTitleFontFamily(titleFontFamily);
  }

  @ReactProp(name = "titleFontSize")
  public void setTitleFontSize(ScreenStackHeaderConfig config, float titleFontSize) {
    config.setTitleFontSize(titleFontSize);
  }

  @ReactProp(name = "titleFontWeight")
  public void setTitleFontWeight(ScreenStackHeaderConfig config, String titleFontWeight) {
    config.setTitleFontWeight(titleFontWeight);
  }

  @ReactProp(name = "titleColor", customType = "Color")
  public void setTitleColor(ScreenStackHeaderConfig config, int titleColor) {
    config.setTitleColor(titleColor);
  }

  @ReactProp(name = "backgroundColor", customType = "Color")
  public void setBackgroundColor(ScreenStackHeaderConfig config, Integer backgroundColor) {
    config.setBackgroundColor(backgroundColor);
  }

  @ReactProp(name = "hideShadow")
  public void setHideShadow(ScreenStackHeaderConfig config, boolean hideShadow) {
    config.setHideShadow(hideShadow);
  }

  @ReactProp(name = "hideBackButton")
  public void setHideBackButton(ScreenStackHeaderConfig config, boolean hideBackButton) {
    config.setHideBackButton(hideBackButton);
  }

  @ReactProp(name = "topInsetEnabled")
  public void setTopInsetEnabled(ScreenStackHeaderConfig config, boolean topInsetEnabled) {
    config.setTopInsetEnabled(topInsetEnabled);
  }

  @ReactProp(name = "color", customType = "Color")
  public void setColor(ScreenStackHeaderConfig config, int color) {
    config.setTintColor(color);
  }

  @ReactProp(name = "hidden")
  public void setHidden(ScreenStackHeaderConfig config, boolean hidden) {
    config.setHidden(hidden);
  }

  @ReactProp(name = "translucent")
  public void setTranslucent(ScreenStackHeaderConfig config, boolean translucent) {
    config.setTranslucent(translucent);
  }

  @ReactProp(name = "backButtonInCustomView")
  public void setBackButtonInCustomView(ScreenStackHeaderConfig config, boolean backButtonInCustomView) {
    config.setBackButtonInCustomView(backButtonInCustomView);
  }

  @ReactProp(name = "direction")
  public void setDirection(ScreenStackHeaderConfig config, String direction) {
    config.setDirection(direction);
  }

//  RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
//  RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
//  RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSString)
//  // `hidden` is an UIView property, we need to use different name internally
}
