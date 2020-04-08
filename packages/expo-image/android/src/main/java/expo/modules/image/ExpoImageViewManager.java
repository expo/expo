package expo.modules.image;

import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestManager;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.image.enums.ImageResizeMode;
import expo.modules.image.events.ImageErrorEvent;
import expo.modules.image.events.ImageLoadEvent;
import expo.modules.image.events.ImageLoadStartEvent;
import expo.modules.image.events.ImageProgressEvent;
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor;

public class ExpoImageViewManager extends SimpleViewManager<ExpoImageView> {
  private static final String REACT_CLASS = "ExpoImage";

  private RequestManager mRequestManager;
  private OkHttpClientProgressInterceptor mProgressInterceptor;

  public ExpoImageViewManager(ReactApplicationContext applicationContext) {
    mRequestManager = Glide.with(applicationContext);
    mProgressInterceptor = OkHttpClientProgressInterceptor.getInstance();
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  @Nullable
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
      .put(ImageLoadStartEvent.EVENT_NAME, MapBuilder.of("registrationName", ImageLoadStartEvent.EVENT_NAME))
      .put(ImageProgressEvent.EVENT_NAME, MapBuilder.of("registrationName", ImageProgressEvent.EVENT_NAME))
      .put(ImageErrorEvent.EVENT_NAME, MapBuilder.of("registrationName", ImageErrorEvent.EVENT_NAME))
      .put(ImageLoadEvent.EVENT_NAME, MapBuilder.of("registrationName", ImageLoadEvent.EVENT_NAME))
      .build();
  }

  // Props setters

  @ReactProp(name = "source")
  public void setSource(ExpoImageView view, @Nullable ReadableMap sourceMap) {
    view.setSource(sourceMap);
  }

  @ReactProp(name = "resizeMode")
  public void setResizeMode(ExpoImageView view, String stringValue) {
    ImageResizeMode resizeMode = ImageResizeMode.fromStringValue(stringValue);
    if (resizeMode == ImageResizeMode.UNKNOWN) {
      throw new JSApplicationIllegalArgumentException("Invalid resizeMode: " + stringValue);
    }
    view.setResizeMode(resizeMode);
  }

  // View lifecycle

  @NonNull
  @Override
  public ExpoImageView createViewInstance(@NonNull ThemedReactContext context) {
    return new ExpoImageView(context, mRequestManager, mProgressInterceptor);
  }

  @Override
  protected void onAfterUpdateTransaction(@NonNull ExpoImageView view) {
    view.onAfterUpdateTransaction();
    super.onAfterUpdateTransaction(view);
  }

  @Override
  public void onDropViewInstance(@NonNull ExpoImageView view) {
    view.onDrop();
    super.onDropViewInstance(view);
  }
}
