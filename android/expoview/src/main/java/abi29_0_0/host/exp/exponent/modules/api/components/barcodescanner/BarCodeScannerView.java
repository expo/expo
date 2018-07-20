package abi29_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import android.content.Context;
import android.hardware.SensorManager;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import abi29_0_0.com.facebook.react.bridge.WritableMap;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi29_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.List;

public class BarCodeScannerView extends ViewGroup {

  public enum Events {
    EVENT_ON_BAR_CODE_READ("onBarCodeRead");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

  private RCTEventEmitter mEventEmitter;
  private ThemedReactContext mThemedReactContext;

  private final OrientationEventListener mOrientationListener;
  private BarCodeScannerViewFinder mViewFinder = null;
  private int mActualDeviceOrientation = -1;
  private int mTorchMode = -1;

  public BarCodeScannerView(ThemedReactContext themedReactContext) {
    super(themedReactContext);

    mThemedReactContext = themedReactContext;
    mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

    BarCodeScanner.createInstance(getDeviceOrientation(mThemedReactContext));

    mOrientationListener = new OrientationEventListener(mThemedReactContext, SensorManager.SENSOR_DELAY_NORMAL) {
      @Override
      public void onOrientationChanged(int orientation) {
        if (setActualDeviceOrientation(mThemedReactContext)) {
          layoutViewFinder();
        }
      }
    };

    if (mOrientationListener.canDetectOrientation()) {
      mOrientationListener.enable();
    } else {
      mOrientationListener.disable();
    }
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    layoutViewFinder(left, top, right, bottom);
  }

  @Override
  public void onViewAdded(View child) {
    if (this.mViewFinder == child) return;
    // remove and readd view to make sure it is in the back.
    // @TODO figure out why there was a z order issue in the first place and fix accordingly.
    this.removeView(this.mViewFinder);
    this.addView(this.mViewFinder, 0);
  }

  public void onBarCodeRead(WritableMap event) {
    mEventEmitter.receiveEvent(getId(), Events.EVENT_ON_BAR_CODE_READ.toString(), event);
  }

  public void setCameraType(final int type) {
    if (null != this.mViewFinder) {
      this.mViewFinder.setCameraType(type);
      BarCodeScanner.getInstance().adjustPreviewLayout(type);
    } else {
      mViewFinder = new BarCodeScannerViewFinder(mThemedReactContext, type, this);
      if (-1 != this.mTorchMode) {
        mViewFinder.setTorchMode(this.mTorchMode);
      }
      addView(mViewFinder);
    }
  }

  public void setTorchMode(int torchMode) {
    this.mTorchMode = torchMode;
    if (this.mViewFinder != null) {
      this.mViewFinder.setTorchMode(torchMode);
    }
  }

  public void setBarCodeTypes(List<Integer> types) {
    BarCodeScanner.getInstance().setBarCodeTypes(types);
  }

  private boolean setActualDeviceOrientation(Context context) {
    int actualDeviceOrientation = getDeviceOrientation(context);

    if (mActualDeviceOrientation != actualDeviceOrientation) {
      mActualDeviceOrientation = actualDeviceOrientation;
      BarCodeScanner.getInstance().setActualDeviceOrientation(mActualDeviceOrientation);
      return true;
    } else {
      return false;
    }
  }

  private int getDeviceOrientation(Context context) {
    return ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getOrientation();
  }

  private void layoutViewFinder() {
    layoutViewFinder(this.getLeft(), this.getTop(), this.getRight(), this.getBottom());
  }

  private void layoutViewFinder(int left, int top, int right, int bottom) {
    if (null == mViewFinder) {
      return;
    }
    float width = right - left;
    float height = bottom - top;
    int viewfinderWidth;
    int viewfinderHeight;
    double ratio = this.mViewFinder.getRatio();

    // Just fill the given space
    if (ratio * height < width) {
      viewfinderHeight = (int) (width / ratio);
      viewfinderWidth = (int) width;
    } else {
      viewfinderWidth = (int) (ratio * height);
      viewfinderHeight = (int) height;
    }

    int viewFinderPaddingX = (int) ((width - viewfinderWidth) / 2);
    int viewFinderPaddingY = (int) ((height - viewfinderHeight) / 2);

    this.mViewFinder.layout(viewFinderPaddingX, viewFinderPaddingY, viewFinderPaddingX + viewfinderWidth, viewFinderPaddingY + viewfinderHeight);
    this.postInvalidate(this.getLeft(), this.getTop(), this.getRight(), this.getBottom());
  }
}
