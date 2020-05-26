package expo.modules.image;

import android.annotation.SuppressLint;
import android.graphics.BitmapFactory;

import com.bumptech.glide.RequestManager;
import com.bumptech.glide.load.model.GlideUrl;
import com.bumptech.glide.request.RequestOptions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;
import expo.modules.image.enums.ImageResizeMode;
import expo.modules.image.events.ImageLoadEventsManager;
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor;

@SuppressLint("ViewConstructor")
public class ExpoImageView extends AppCompatImageView {
  private static final String SOURCE_URI_KEY = "uri";
  private static final String SOURCE_WIDTH_KEY = "width";
  private static final String SOURCE_HEIGHT_KEY = "height";
  private static final String SOURCE_SCALE_KEY = "scale";

  private OkHttpClientProgressInterceptor mProgressInterceptor;
  private RequestManager mRequestManager;
  private RCTEventEmitter mEventEmitter;

  private ReadableMap mSourceMap;
  private GlideUrl mLoadedSource;

  public ExpoImageView(ReactContext context, RequestManager requestManager, OkHttpClientProgressInterceptor progressInterceptor) {
    super(context);

    mEventEmitter = context.getJSModule(RCTEventEmitter.class);
    mRequestManager = requestManager;
    mProgressInterceptor = progressInterceptor;

    setScaleType(ImageResizeMode.COVER.getScaleType());
  }

  /* package */ void setSource(@Nullable ReadableMap sourceMap) {
    mSourceMap = sourceMap;
  }

  /* package */ void setResizeMode(ImageResizeMode resizeMode) {
    setScaleType(resizeMode.getScaleType());
    // TODO: repeat mode handling
  }

  /* package */ void onAfterUpdateTransaction() {
    GlideUrl sourceToLoad = createUrlFromSourceMap(mSourceMap);

    if (sourceToLoad == null) {
      mRequestManager.clear(this);
      setImageDrawable(null);
      mLoadedSource = null;
    } else if (!sourceToLoad.equals(mLoadedSource)) {
      mLoadedSource = sourceToLoad;
      RequestOptions options = createOptionsFromSourceMap(mSourceMap);
      ImageLoadEventsManager eventsManager = new ImageLoadEventsManager(getId(), mEventEmitter);
      mProgressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), eventsManager);
      eventsManager.onLoadStarted();
      mRequestManager
        .load(sourceToLoad)
        .apply(options)
        .listener(eventsManager)
        .into(this);
      mRequestManager
        .as(BitmapFactory.Options.class)
        .load(sourceToLoad)
        .into(eventsManager);
    }
  }

  /* package */ void onDrop() {
    mRequestManager.clear(this);
  }

  @Nullable
  protected GlideUrl createUrlFromSourceMap(@Nullable ReadableMap sourceMap) {
    if (sourceMap == null || sourceMap.getString(SOURCE_URI_KEY) == null) {
      return null;
    }

    return new GlideUrl(sourceMap.getString(SOURCE_URI_KEY));
  }

  protected RequestOptions createOptionsFromSourceMap(@Nullable ReadableMap sourceMap) {
    RequestOptions options = new RequestOptions();
    if (sourceMap != null) {

      // Override the size for local assets. This ensures that
      // resizeMode "center" displays the image in the correct size.
      if (sourceMap.hasKey(SOURCE_WIDTH_KEY) && sourceMap.hasKey(SOURCE_HEIGHT_KEY) && sourceMap.hasKey(SOURCE_SCALE_KEY)) {
        double scale = sourceMap.getDouble(SOURCE_SCALE_KEY);
        int width = sourceMap.getInt(SOURCE_WIDTH_KEY);
        int height = sourceMap.getInt(SOURCE_HEIGHT_KEY);
        options.override((int) (width * scale), (int) (height * scale));
      }
    }
    options.fitCenter();
    return options;
  }
}
