package abi39_0_0.host.exp.exponent.modules.api.screens;

import abi39_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi39_0_0.com.facebook.react.common.MapBuilder;
import abi39_0_0.com.facebook.react.module.annotations.ReactModule;
import abi39_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi39_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi39_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

@ReactModule(name = ScreenViewManager.REACT_CLASS)
public class ScreenViewManager extends ViewGroupManager<Screen> {

  protected static final String REACT_CLASS = "RNSScreen";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected Screen createViewInstance(ThemedReactContext reactContext) {
    return new Screen(reactContext);
  }

  @ReactProp(name = "active", defaultFloat = 0)
  public void setActive(Screen view, float active) {
    view.setActive(active != 0);
  }

  @ReactProp(name = "stackPresentation")
  public void setStackPresentation(Screen view, String presentation) {
    if ("push".equals(presentation)) {
      view.setStackPresentation(Screen.StackPresentation.PUSH);
    } else if ("modal".equals(presentation) || "containedModal".equals(presentation) || "fullScreenModal".equals(presentation) || "formSheet".equals(presentation)) {
      // at the moment Android implementation does not handle contained vs regular modals
      view.setStackPresentation(Screen.StackPresentation.MODAL);
    } else if ("transparentModal".equals(presentation) || "containedTransparentModal".equals((presentation))) {
      // at the moment Android implementation does not handle contained vs regular modals
      view.setStackPresentation(Screen.StackPresentation.TRANSPARENT_MODAL);
    } else {
      throw new JSApplicationIllegalArgumentException("Unknown presentation type " + presentation);
    }
  }

  @ReactProp(name = "stackAnimation")
  public void setStackAnimation(Screen view, String animation) {
    if (animation == null || "default".equals(animation)) {
      view.setStackAnimation(Screen.StackAnimation.DEFAULT);
    } else if ("none".equals(animation)) {
      view.setStackAnimation(Screen.StackAnimation.NONE);
    } else if ("fade".equals(animation)) {
      view.setStackAnimation(Screen.StackAnimation.FADE);
    }
  }

  @ReactProp(name = "gestureEnabled", defaultBoolean = true)
  public void setGestureEnabled(Screen view, boolean gestureEnabled) {
    view.setGestureEnabled(gestureEnabled);
  }

  @ReactProp(name = "replaceAnimation")
  public void setReplaceAnimation(Screen view, String animation) {
    if (animation == null || "pop".equals(animation)) {
      view.setReplaceAnimation(Screen.ReplaceAnimation.POP);
    } else if ("push".equals(animation)) {
      view.setReplaceAnimation(Screen.ReplaceAnimation.PUSH);
    }
  }

  @Nullable
  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
            ScreenDismissedEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onDismissed"),
            ScreenWillAppearEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onWillAppear"),
            ScreenAppearEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onAppear"),
            ScreenWillDisappearEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onWillDisappear"),
            ScreenDisappearEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onDisappear"),
            StackFinishTransitioningEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onFinishTransitioning"));
  }
}
