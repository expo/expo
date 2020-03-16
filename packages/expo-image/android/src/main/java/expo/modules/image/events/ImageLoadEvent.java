package expo.modules.image.events;

import android.graphics.drawable.Drawable;

import com.bumptech.glide.load.DataSource;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import expo.modules.image.enums.ImageCacheType;
import okhttp3.MediaType;

public class ImageLoadEvent extends Event<ImageLoadEvent> {
  public static final String EVENT_NAME = "onLoad";

  private Object mModel;
  private Drawable mDrawable;
  private MediaType mMediaType;
  private DataSource mDataSource;

  public ImageLoadEvent(int viewId, Drawable drawable, Object model, DataSource dataSource, MediaType mediaType) {
    super(viewId);
    mModel = model;
    mDrawable = drawable;
    mMediaType = mediaType;
    mDataSource = dataSource;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("cacheType", ImageCacheType.fromNativeValue(mDataSource).getEnumValue());
    eventData.putMap("source", serializeSource(mDrawable, mModel));
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }

  private ReadableMap serializeSource(Drawable drawable, Object model) {
    WritableMap data = Arguments.createMap();
    data.putString("url", model.toString());
    data.putInt("width", drawable.getIntrinsicWidth());
    data.putInt("height", drawable.getIntrinsicHeight());
    data.putString("mediaType", mMediaType == null ? null : mMediaType.toString());
    return data;
  }
}
