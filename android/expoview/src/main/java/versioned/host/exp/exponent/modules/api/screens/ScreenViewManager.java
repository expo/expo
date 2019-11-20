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

  @ReactProp(name = "active", defaultFloat = 0)
  public void setActive(Screen view, float active) {
    view.setActive(active != 0);
  }

  @ReactProp(name = "stackPresentation")
  public void setStackPresentation(Screen view, String presentation) {
    if ("push".equals(presentation)) {
      view.setStackPresentation(Screen.StackPresentation.PUSH);
    } else if ("modal".equals(presentation) || "containedModal".equals(presentation)) {
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

  @Nullable
  @Override
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
            ScreenDismissedEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onDismissed"));
  }
}
