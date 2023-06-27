package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Rect;

import abi49_0_0.com.facebook.react.views.view.ReactViewGroup;

public class ViewAttacherGroup extends ReactViewGroup {

  public ViewAttacherGroup(Context context) {
    super(context);

    this.setWillNotDraw(true);
    this.setVisibility(VISIBLE);
    this.setAlpha(0.0f);
    this.setRemoveClippedSubviews(false);
    this.setClipBounds(new Rect(0, 0, 0, 0));
    this.setOverflow("hidden"); // Change to ViewProps.HIDDEN until RN 0.57 is base
  }

  // This should make it more performant, avoid trying to hard to overlap layers with opacity.
  @Override
  public boolean hasOverlappingRendering() {
    return false;
  }
}
