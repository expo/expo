package expo.modules.image;

import android.annotation.SuppressLint;
import android.graphics.drawable.Drawable;
import android.widget.ImageView;

import com.bumptech.glide.RequestManager;
import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.load.model.GlideUrl;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.target.Target;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.network.ProgressListener;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.lang.ref.WeakReference;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;
import expo.modules.image.events.ImageErrorEvent;
import expo.modules.image.events.ImageLoadEndEvent;
import expo.modules.image.events.ImageLoadEvent;
import expo.modules.image.events.ImageLoadStartEvent;
import expo.modules.image.events.ImageProgressEvent;
import expo.modules.image.okhttp.OkHttpClientProgressInterceptor;
import expo.modules.image.okhttp.OkHttpClientResponseInterceptor;
import expo.modules.image.okhttp.ResponseListener;
import okhttp3.MediaType;
import okhttp3.Response;
import okhttp3.ResponseBody;

@SuppressLint("ViewConstructor")
public class ExpoImageView extends AppCompatImageView implements ResponseListener, ProgressListener {
  private static final String SOURCE_URI_KEY = "uri";

  private OkHttpClientProgressInterceptor mProgressInterceptor;
  private OkHttpClientResponseInterceptor mResponseInterceptor;
  private RequestManager mRequestManager;
  private ReadableMap mSourceMap;
  private GlideUrl mLoadedSource;
  private MediaType mMediaType;
  private RCTEventEmitter mEventEmitter;

  public ExpoImageView(ReactContext context, RequestManager requestManager, OkHttpClientProgressInterceptor progressInterceptor, OkHttpClientResponseInterceptor responseInterceptor) {
    super(context);

    mEventEmitter = context.getJSModule(RCTEventEmitter.class);
    mRequestManager = requestManager;
    mProgressInterceptor = progressInterceptor;
    mResponseInterceptor = responseInterceptor;

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
      mMediaType = null;
      if (mEventEmitter != null) {
        new ImageLoadStartEvent(getId()).dispatch(mEventEmitter);
      }
      mResponseInterceptor.registerResponseListener(sourceToLoad.toStringUrl(), this);
      mProgressInterceptor.registerProgressListener(sourceToLoad.toStringUrl(), this);
      mRequestManager
          .load(sourceToLoad)
          .listener(createRequestListener())
          .into(this);
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

  @Override
  public void onResponse(String requestUrl, Response response) {
    ResponseBody body = response.body();
    if (body != null && requestUrl.equals(mLoadedSource.toStringUrl())) {
      mMediaType = body.contentType();
    }
  }

  @Override
  public void onProgress(long bytesWritten, long contentLength, boolean done) {
    if (mEventEmitter != null) {
      new ImageProgressEvent(getId(), bytesWritten, contentLength, done).dispatch(mEventEmitter);
    }
  }

  private RequestListener<Drawable> createRequestListener() {
    final WeakReference<ExpoImageView> weakThis = new WeakReference<>(this);
    return new RequestListener<Drawable>() {
      @Override
      public boolean onLoadFailed(@Nullable GlideException e, Object model, Target<Drawable> target, boolean isFirstResource) {
        ExpoImageView view = weakThis.get();
        if (view != null && view.mEventEmitter != null) {
          new ImageErrorEvent(getId(), e).dispatch(view.mEventEmitter);
        }
        onFinished();
        return false;
      }

      @Override
      public boolean onResourceReady(Drawable resource, Object model, Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
        ExpoImageView view = weakThis.get();
        if (view != null && view.mEventEmitter != null) {
          new ImageLoadEvent(getId(), resource, model, dataSource, view.mMediaType).dispatch(view.mEventEmitter);
        }
        onFinished();
        return false;
      }

      private void onFinished() {
        ExpoImageView view = weakThis.get();
        if (view != null && view.mEventEmitter != null) {
          new ImageLoadEndEvent(getId()).dispatch(view.mEventEmitter);
        }
      }
    };
  }
}
