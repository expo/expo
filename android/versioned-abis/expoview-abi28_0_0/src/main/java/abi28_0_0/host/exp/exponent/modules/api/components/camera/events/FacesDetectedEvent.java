package abi28_0_0.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;
import android.util.SparseArray;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.events.Event;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.cameraview.CameraView;
import com.google.android.gms.vision.face.Face;

import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.ImageDimensions;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.FaceDetectorUtils;

public class FacesDetectedEvent extends Event<FacesDetectedEvent> {
  private static final Pools.SynchronizedPool<FacesDetectedEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private double mScaleX;
  private double mScaleY;
  private SparseArray<Face> mFaces;
  private ImageDimensions mImageDimensions;

  private FacesDetectedEvent() {}

  public static FacesDetectedEvent obtain(
      int viewTag,
      SparseArray<Face> faces,
      ImageDimensions dimensions,
      double scaleX,
      double scaleY
  ) {
    FacesDetectedEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new FacesDetectedEvent();
    }
    event.init(viewTag, faces, dimensions, scaleX, scaleY);
    return event;
  }

  private void init(
      int viewTag,
      SparseArray<Face> faces,
      ImageDimensions dimensions,
      double scaleX,
      double scaleY
  ) {
    super.init(viewTag);
    mFaces = faces;
    mImageDimensions = dimensions;
    mScaleX = scaleX;
    mScaleY = scaleY;
  }

  /**
   * note(@sjchmiela)
   * Should the events about detected faces coalesce, the best strategy will be
   * to ensure that events with different faces count are always being transmitted.
   */
  @Override
  public short getCoalescingKey() {
    if (mFaces.size() > Short.MAX_VALUE) {
      return Short.MAX_VALUE;
    }

    return (short) mFaces.size();
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_FACES_DETECTED.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableArray facesList = Arguments.createArray();

    for(int i = 0; i < mFaces.size(); i++) {
      Face face = mFaces.valueAt(i);
      WritableMap serializedFace = FaceDetectorUtils.serializeFace(face, mScaleX, mScaleY);
      if (mImageDimensions.getFacing() == CameraView.FACING_FRONT) {
        serializedFace = FaceDetectorUtils.rotateFaceX(serializedFace, mImageDimensions.getWidth(), mScaleX);
      } else {
        serializedFace = FaceDetectorUtils.changeAnglesDirection(serializedFace);
      }
      facesList.pushMap(serializedFace);
    }

    WritableMap event = Arguments.createMap();
    event.putString("type", "face");
    event.putArray("faces", facesList);
    event.putInt("target", getViewTag());
    return event;
  }
}
