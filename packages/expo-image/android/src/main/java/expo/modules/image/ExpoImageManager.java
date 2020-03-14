package expo.modules.image;

import android.widget.ImageView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class ExpoImageManager extends SimpleViewManager<ImageView> {
  private static final String REACT_CLASS = "ExpoImage";

  private static final String SOURCE_URI_KEY = "uri";

  private RequestManager mRequestManager;

  public ExpoImageManager(ReactApplicationContext applicationContext) {
    mRequestManager = Glide.with(applicationContext);
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  // Props setters

  @ReactProp(name = "source")
  public void setSource(ImageView view, @Nullable ReadableMap sourceMap) {
    if (sourceMap == null || sourceMap.getString(SOURCE_URI_KEY) == null) {
      mRequestManager.clear(view);
      view.setImageDrawable(null);
      return;
    }

    mRequestManager
        .load(sourceMap.getString(SOURCE_URI_KEY))
        .into(view);
  }

  // View lifecycle

  @NonNull
  @Override
  public ImageView createViewInstance(@NonNull ThemedReactContext context) {
    ImageView imageView = new ImageView(context);

    // For now let's set scale type to FIT_XY
    // to make behavior same on all platforms.
    imageView.setScaleType(ImageView.ScaleType.FIT_XY);

    return imageView;
  }

  @Override
  public void onDropViewInstance(@NonNull ImageView view) {
    mRequestManager.clear(view);
    super.onDropViewInstance(view);
  }
}
