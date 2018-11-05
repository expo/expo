package abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.widget.FrameLayout;

public class GestureHandlerViewWrapper extends FrameLayout {

  private final GestureHandlerOrchestrator mOrchestrator;
  private final GestureHandlerRegistryImpl mRegistry;

  public GestureHandlerViewWrapper(Context context) {
    super(context);
    mRegistry = new GestureHandlerRegistryImpl();
    mOrchestrator = new GestureHandlerOrchestrator(this, mRegistry, new ViewConfigurationHelperImpl());
  }

  public GestureHandlerViewWrapper(Context context, AttributeSet attrs) {
    super(context, attrs);
    mRegistry = new GestureHandlerRegistryImpl();
    mOrchestrator = new GestureHandlerOrchestrator(this, mRegistry, new ViewConfigurationHelperImpl());
  }

  public GestureHandlerViewWrapper(Context context, AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    mRegistry = new GestureHandlerRegistryImpl();
    mOrchestrator = new GestureHandlerOrchestrator(this, mRegistry, new ViewConfigurationHelperImpl());
  }

  public GestureHandlerRegistryImpl getRegistry() {
    return mRegistry;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    return true;
  }

  @Override
  public boolean onTouchEvent(MotionEvent event) {
    return mOrchestrator.onTouchEvent(event);
  }
}
