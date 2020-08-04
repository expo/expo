package expo.modules.image.events;

import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;

import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.target.CustomTarget;
import com.bumptech.glide.request.target.Target;
import com.bumptech.glide.request.transition.Transition;
import com.facebook.react.modules.network.ProgressListener;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class ImageLoadEventsManager extends CustomTarget<BitmapFactory.Options> implements RequestListener<Drawable>, ProgressListener {
  private RCTEventEmitter mEventEmitter;
  private int mViewId;

  private BitmapFactory.Options mBitmapFactoryOptions;
  private DataSource mDataSource;
  private Object mModel;

  public ImageLoadEventsManager(int viewId, RCTEventEmitter eventEmitter) {
    mViewId = viewId;
    mEventEmitter = eventEmitter;
  }

  public void onLoadStarted() {
    dispatch(new ImageLoadStartEvent(mViewId));
  }

  @Override
  public void onProgress(long bytesWritten, long contentLength, boolean done) {
    dispatch(new ImageProgressEvent(mViewId, bytesWritten, contentLength, done));
  }

  @Override
  public boolean onLoadFailed(@Nullable GlideException e, Object model, Target<Drawable> target, boolean isFirstResource) {
    dispatch(new ImageErrorEvent(mViewId, e));
    return false;
  }

  @Override
  public void onResourceReady(@NonNull BitmapFactory.Options resource, @Nullable Transition<? super BitmapFactory.Options> transition) {
    mBitmapFactoryOptions = resource;
    onResourceReady();
  }

  @Override
  public boolean onResourceReady(Drawable resource, Object model, Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
    mModel = model;
    mDataSource = dataSource;
    onResourceReady();
    return false;
  }

  private void onResourceReady() {
    if (mModel != null && mDataSource != null && mBitmapFactoryOptions != null) {
      dispatch(new ImageLoadEvent(mViewId, mModel, mDataSource, mBitmapFactoryOptions));
    }
  }

  @Override
  public void onLoadCleared(@Nullable Drawable placeholder) {
    // do nothing
  }

  private void dispatch(Event event) {
    if (mEventEmitter != null) {
      event.dispatch(mEventEmitter);
    }
  }
}
