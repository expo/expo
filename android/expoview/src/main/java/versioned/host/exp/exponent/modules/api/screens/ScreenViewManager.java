package versioned.host.exp.exponent.modules.api.screens;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

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

  @ReactProp(name = "activityState")
  public void setActivityState(Screen view, Integer activityState) {
    if (activityState == null) {
      // Null will be provided when activityState is set as an animated value and we change
      // it from JS to be a plain value (non animated).
      // In case when null is received, we want to ignore such value and not make
      // any updates as the actual non-null value will follow immediately.
      return;
    }
    if (activityState == 0) {
      view.setActivityState(Screen.ActivityState.INACTIVE);
    } else if (activityState == 1) {
      view.setActivityState(Screen.ActivityState.TRANSITIONING_OR_BELOW_TOP);
    } else if (activityState == 2) {
      view.setActivityState(Screen.ActivityState.ON_TOP);
    }
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
