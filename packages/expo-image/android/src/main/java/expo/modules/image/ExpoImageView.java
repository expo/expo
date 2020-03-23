package expo.modules.image;

import android.annotation.SuppressLint;
import android.graphics.BitmapFactory;
import android.widget.ImageView;

import com.bumptech.glide.RequestManager;
import com.bumptech.glide.load.model.GlideUrl;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.network.ProgressListener;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;
import expo.modules.image.events.ImageLoadEventsManager;
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor;

@SuppressLint("ViewConstructor")
public class ExpoImageView extends AppCompatImageView {
  private static final String SOURCE_URI_KEY = "uri";

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

    // For now let's set scale type to FIT_XY
    // to make behavior same on all platforms.
    setScaleType(ImageView.ScaleType.FIT_XY);
  }

  /* package */ void setSource(@Nullable ReadableMap sourceMap) {
    mSourceMap = sourceMap;
  }

  /* package */ void onAfterUpdateTransaction() {
    GlideUrl sourceToLoad = createUrlFromSourceMap(mSourceMap);

    if (sourceToLoad == null) {
      mRequestManager.clear(this);
      setImageDrawable(null);
      mLoadedSource = null;
    } else if (!sourceToLoad.equals(mLoadedSource)) {
      mLoadedSource = sourceToLoad;
      ImageLoadEventsManager eventsManager = new ImageLoadEventsManager(getId(), mEventEmitter);
      mProgressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), eventsManager);
      eventsManager.onLoadStarted();
      mRequestManager
          .load(sourceToLoad)
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
}
