package expo.modules.image.events;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class ImageProgressEvent extends Event<ImageProgressEvent> {
  public static final String EVENT_NAME = "onProgress";

  private long mBytesWritten;
  private long mContentLength;
  private boolean mDone;

  public ImageProgressEvent(int viewId, long bytesWritten, long contentLength, boolean done) {
    super(viewId);
    mBytesWritten = bytesWritten;
    mContentLength = contentLength;
    mDone = done;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("loaded", (int) mBytesWritten);
    eventData.putInt("total", (int) mContentLength);
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }
}
