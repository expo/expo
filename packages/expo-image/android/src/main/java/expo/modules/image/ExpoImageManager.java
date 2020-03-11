package expo.modules.image;

import android.view.View;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

import androidx.appcompat.widget.AppCompatCheckBox;
import androidx.annotation.NonNull;

public class ExpoImageManager extends SimpleViewManager<View> {
  private static final String REACT_CLASS = "ExpoImage";

  private RequestManager mRequestManager;

  public ExpoImageManager(ReactApplicationContext applicationContext) {
    mRequestManager = Glide.with(applicationContext);
  }

  @NonNull
  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @NonNull
  @Override
  public View createViewInstance(@NonNull ThemedReactContext context) {
    // TODO: Implement some actually useful functionality
    AppCompatCheckBox cb = new AppCompatCheckBox(c);
    cb.setChecked(true);
    return cb;
  }
}
