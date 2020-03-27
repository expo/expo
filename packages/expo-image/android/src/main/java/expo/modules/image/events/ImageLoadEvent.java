package expo.modules.image.events;

import android.graphics.BitmapFactory;
import android.util.Size;

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
  private DataSource mDataSource;
  private BitmapFactory.Options mBitmapOptions;

  public ImageLoadEvent(int viewId, Object model, DataSource dataSource, BitmapFactory.Options bitmapOptions) {
    super(viewId);
    mModel = model;
    mDataSource = dataSource;
    mBitmapOptions = bitmapOptions;
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("cacheType", ImageCacheType.fromNativeValue(mDataSource).getEnumValue());
    eventData.putMap("source", serializeSource(mBitmapOptions, mModel));
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), eventData);
  }

  private ReadableMap serializeSource(BitmapFactory.Options options, Object model) {
    WritableMap data = Arguments.createMap();
    data.putString("url", model.toString());
    data.putInt("width", options.outWidth);
    data.putInt("height", options.outHeight);
    data.putString("mediaType", options.outMimeType);
    return data;
  }
}
