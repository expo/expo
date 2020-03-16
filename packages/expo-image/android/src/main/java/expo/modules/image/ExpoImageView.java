package expo.modules.image;

import android.annotation.SuppressLint;
import android.widget.ImageView;

import com.bumptech.glide.RequestManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;

@SuppressLint("ViewConstructor")
public class ExpoImageView extends AppCompatImageView {
  private static final String SOURCE_URI_KEY = "uri";

  private RequestManager mRequestManager;

  public ExpoImageView(ReactContext context, RequestManager requestManager) {
    super(context);

    mRequestManager = requestManager;

    // For now let's set scale type to FIT_XY
    // to make behavior same on all platforms.
    setScaleType(ImageView.ScaleType.FIT_XY);
  }

  /* package */ void setSource(@Nullable ReadableMap sourceMap) {
    if (sourceMap == null || sourceMap.getString(SOURCE_URI_KEY) == null) {
      mRequestManager.clear(this);
      setImageDrawable(null);
      return;
    }

    mRequestManager
        .load(sourceMap.getString(SOURCE_URI_KEY))
        .into(this);
  }

  /* package */ void onDrop() {
    mRequestManager.clear(this);
  }
}
