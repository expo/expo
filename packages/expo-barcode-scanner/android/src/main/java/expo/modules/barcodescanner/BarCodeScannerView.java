package expo.modules.barcodescanner;

import android.content.Context;
import android.hardware.SensorManager;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.interfaces.services.EventEmitter;
import expo.interfaces.barcodescanner.BarCodeScannerResult;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;

public class BarCodeScannerView extends ViewGroup {
  private final OrientationEventListener mOrientationListener;
  private final ModuleRegistry mModuleRegistry;
  private final Context mContext;
  private BarCodeScannerViewFinder mViewFinder = null;
  private int mActualDeviceOrientation = -1;

  public BarCodeScannerView(final Context context, ModuleRegistry moduleRegistry) {
    super(context);
    mContext = context;
    mModuleRegistry = moduleRegistry;

    ExpoBarCodeScanner.createInstance(getDeviceOrientation(context));

    mOrientationListener = new OrientationEventListener(context, SensorManager.SENSOR_DELAY_NORMAL) {
      @Override
      public void onOrientationChanged(int orientation) {
        if (setActualDeviceOrientation(context)) {
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

  public void onBarCodeScanned(BarCodeScannerResult barCode) {
    EventEmitter emitter = mModuleRegistry.getModule(EventEmitter.class);
    BarCodeScannedEvent event = BarCodeScannedEvent.obtain(this.getId(), barCode);
    emitter.emit(this.getId(), event);
  }

  public void setCameraType(final int type) {
    if (null != this.mViewFinder) {
      this.mViewFinder.setCameraType(type);
      ExpoBarCodeScanner.getInstance().adjustPreviewLayout(type);
    } else {
      mViewFinder = new BarCodeScannerViewFinder(mContext, type, this, mModuleRegistry);
      addView(mViewFinder);
    }
  }

  public void setBarCodeScannerSettings(BarCodeScannerSettings settings) {
    mViewFinder.setBarCodeScannerSettings(settings);
  }

  private boolean setActualDeviceOrientation(Context context) {
    int actualDeviceOrientation = getDeviceOrientation(context);

    if (mActualDeviceOrientation != actualDeviceOrientation) {
      mActualDeviceOrientation = actualDeviceOrientation;
      ExpoBarCodeScanner.getInstance().setActualDeviceOrientation(mActualDeviceOrientation);
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
