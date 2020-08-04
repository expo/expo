package expo.modules.image.events;

import com.bumptech.glide.load.engine.GlideException;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.List;
import java.util.Objects;

import androidx.annotation.Nullable;

public class ImageErrorEvent extends Event<ImageErrorEvent> {
  public static final String EVENT_NAME = "onError";

  private GlideException mException;

  public ImageErrorEvent(int viewId, GlideException exception) {
    super(viewId);
    mException = exception;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = Arguments.createMap();
    eventData.putString("error", mException.toString());
    eventData.putMap("android", serializeGlideException(mException));
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }

  @Nullable
  public ReadableArray serializeThrowablesList(@Nullable List<Throwable> throwables) {
    if (throwables == null) {
      return null;
    }
    WritableArray array = Arguments.createArray();
    for (Throwable throwable : throwables) {
      array.pushMap(serializeThrowable(throwable));
    }
    return array;
  }

  @Nullable
  private ReadableMap serializeThrowable(@Nullable Throwable throwable) {
    if (throwable == null) {
      return null;
    }
    WritableMap data = Arguments.createMap();
    data.putString("class", throwable.getClass().getName());
    data.putMap("cause", serializeThrowable(throwable.getCause()));
    data.putString("message", throwable.getLocalizedMessage());
    return data;
  }

  @Nullable
  private ReadableMap serializeGlideException(GlideException exception) {
    if (exception == null) {
      return null;
    }
    ReadableMap exceptionData = serializeThrowable(exception);
    WritableMap data = Arguments.createMap();
    data.putMap("origin", serializeThrowable(exception.getOrigin()));
    data.putArray("causes", serializeThrowablesList(exception.getCauses()));
    data.merge(Objects.requireNonNull(exceptionData));
    return data;
  }
}
