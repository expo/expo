package expo.modules.barcodescanner;

import android.content.Context;
import android.hardware.SensorManager;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import java.util.List;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;
import org.unimodules.interfaces.barcodescanner.BarCodeScannerSettings;

public class BarCodeScannerView extends ViewGroup {
  private final OrientationEventListener mOrientationListener;
  private final ModuleRegistry mModuleRegistry;
  private final Context mContext;
  private BarCodeScannerViewFinder mViewFinder = null;
  private int mActualDeviceOrientation = -1;
  private int mLeftPadding = 0;
  private int mTopPadding = 0;
  private int mType = 0;

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
    transformBarCodeScannerResultToViewCoordinates(barCode);
    BarCodeScannedEvent event = BarCodeScannedEvent.obtain(this.getId(), barCode, getDisplayDensity());
    emitter.emit(this.getId(), event);
  }

  public float getDisplayDensity() {
    return this.getResources().getDisplayMetrics().density;
  }

  private void transformBarCodeScannerResultToViewCoordinates(BarCodeScannerResult barCode) {
    List<Integer> cornerPoints = barCode.getCornerPoints();

    int previewWidth = this.getWidth() - mLeftPadding * 2;
    int previewHeight = this.getHeight() - mTopPadding * 2;

    // fix for problem with rotation when front camera is in use
    if (mType == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && ((getDeviceOrientation(mContext) % 2) == 0)) {
      for (int i = 1; i < cornerPoints.size(); i += 2) { // convert y-coordinate
        int convertedCoordinate = barCode.getReferenceImageHeight() - cornerPoints.get(i);
        cornerPoints.set(i, convertedCoordinate);
      }
    }
    if (mType == ExpoBarCodeScanner.CAMERA_TYPE_FRONT && ((getDeviceOrientation(mContext) % 2) != 0)) {
      for (int i = 0; i < cornerPoints.size(); i += 2) { // convert y-coordinate
        int convertedCoordinate = barCode.getReferenceImageWidth() - cornerPoints.get(i);
        cornerPoints.set(i, convertedCoordinate);
      }
    }
    // end of fix

    for (int i = 0; i < cornerPoints.size(); i += 2) { // convert x-coordinate
      int convertedCoordinate = Math.round(cornerPoints.get(i) * previewWidth / (float) barCode.getReferenceImageWidth() + mLeftPadding);
      cornerPoints.set(i, convertedCoordinate);
    }

    for (int i = 1; i < cornerPoints.size(); i += 2) { // convert y-coordinate
      int convertedCoordinate = Math.round(cornerPoints.get(i) * previewHeight / (float) barCode.getReferenceImageHeight() + mTopPadding);
      cornerPoints.set(i, convertedCoordinate);
    }

    barCode.setReferenceImageHeight(this.getHeight());
    barCode.setReferenceImageWidth(this.getWidth());

    barCode.setCornerPoints(cornerPoints);
  }

  public void setCameraType(final int type) {
    mType = type;
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
    return ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getRotation();
  }

  public void layoutViewFinder() {
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
      viewfinderWidth = (int) (ratio * height);
      viewfinderHeight = (int) height;
    } else {
      viewfinderHeight = (int) (width / ratio);
      viewfinderWidth = (int) width;
    }

    int viewFinderPaddingX = (int) ((width - viewfinderWidth) / 2);
    int viewFinderPaddingY = (int) ((height - viewfinderHeight) / 2);

    mLeftPadding = viewFinderPaddingX;
    mTopPadding = viewFinderPaddingY;

    this.mViewFinder.layout(viewFinderPaddingX, viewFinderPaddingY, viewFinderPaddingX + viewfinderWidth, viewFinderPaddingY + viewfinderHeight);
    this.postInvalidate(this.getLeft(), this.getTop(), this.getRight(), this.getBottom());
  }
}
