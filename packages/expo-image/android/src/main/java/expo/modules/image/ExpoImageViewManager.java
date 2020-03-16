package expo.modules.image;

import com.bumptech.glide.Glide;
import com.bumptech.glide.RequestManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class ExpoImageViewManager extends SimpleViewManager<ExpoImageView> {
  private static final String REACT_CLASS = "ExpoImage";

  private RequestManager mRequestManager;

  public ExpoImageViewManager(ReactApplicationContext applicationContext) {
    mRequestManager = Glide.with(applicationContext);
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  // Props setters

  @ReactProp(name = "source")
  public void setSource(ExpoImageView view, @Nullable ReadableMap sourceMap) {
    view.setSource(sourceMap);
  }

  // View lifecycle

  @NonNull
  @Override
  public ExpoImageView createViewInstance(@NonNull ThemedReactContext context) {
    return new ExpoImageView(context, mRequestManager);
  }

  @Override
  public void onDropViewInstance(@NonNull ExpoImageView view) {
    view.onDrop();
    super.onDropViewInstance(view);
  }
}
