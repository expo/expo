package abi48_0_0.host.exp.exponent.modules.api.components.lottie;

import android.graphics.ColorFilter;
import android.widget.ImageView;

import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import com.airbnb.lottie.LottieProperty;
import com.airbnb.lottie.RenderMode;
import com.airbnb.lottie.TextDelegate;
import com.airbnb.lottie.SimpleColorFilter;
import com.airbnb.lottie.model.KeyPath;
import com.airbnb.lottie.value.LottieValueCallback;
import abi48_0_0.com.facebook.react.bridge.ReadableArray;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.bridge.ReadableType;
import abi48_0_0.com.facebook.react.bridge.ColorPropConverter;
import java.lang.ref.WeakReference;
import java.util.regex.Pattern;
/**
 * Class responsible for applying the properties to the LottieView.
 * The way react-native works makes it impossible to predict in which order properties will be set,
 * also some of the properties of the LottieView needs to be set simultaneously.
 *
 * To solve this, instance of this class accumulates all changes to the view and applies them at
 * the end of react transaction, so it could control how changes are applied.
 */
public class LottieAnimationViewPropertyManager {

  private final WeakReference<LottieAnimationView> viewWeakReference;

  private String animationJson;
  private Float progress;
  private Boolean loop;
  private Float speed;

  /**
   * Should be set to true if one of the animationName related parameters has changed as a result
   * of last reconciliation. We need to update the animation in this case.
   */
  private boolean animationNameDirty;

  private String animationName;
  private ImageView.ScaleType scaleType;
  private String imageAssetsFolder;
  private Boolean enableMergePaths;
  private ReadableArray colorFilters;
  private ReadableArray textFilters;
  private RenderMode renderMode;

  public LottieAnimationViewPropertyManager(LottieAnimationView view) {
    this.viewWeakReference = new WeakReference<>(view);
  }

  public void setAnimationName(String animationName) {
    this.animationName = animationName;
    this.animationNameDirty = true;
  }

  public void setAnimationJson(String json) {
    this.animationJson = json;
  }

  public void setProgress(Float progress) {
    this.progress = progress;
  }

  public void setSpeed(float speed) {
    this.speed = speed;
  }

  public void setLoop(boolean loop) {
    this.loop = loop;
  }

  public void setScaleType(ImageView.ScaleType scaleType) {
    this.scaleType = scaleType;
  }

  public void setRenderMode(RenderMode renderMode) {
    this.renderMode = renderMode;
  }

  public void setImageAssetsFolder(String imageAssetsFolder) {
    this.imageAssetsFolder = imageAssetsFolder;
  }

  public void setEnableMergePaths(boolean enableMergePaths) {
    this.enableMergePaths = enableMergePaths;
  }

  public void setColorFilters(ReadableArray colorFilters) {
    this.colorFilters = colorFilters;
  }

  public void setTextFilters(ReadableArray textFilters) {
    this.textFilters = textFilters;
  }

  /**
   * Updates the view with changed fields.
   * Majority of the properties here are independent so they are has to be reset to null
   * as soon as view is updated with the value.
   *
   * The only exception from this rule is the group of the properties for the animation.
   * For now this is animationName and cacheStrategy. These two properties are should be set
   * simultaneously if the dirty flag is set.
   */
  public void commitChanges() {
    LottieAnimationView view = viewWeakReference.get();
    if (view == null) {
      return;
    }

    if (textFilters != null && textFilters.size() > 0) {
      TextDelegate textDelegate = new TextDelegate(view);
      for (int i = 0; i < textFilters.size(); i++) {
        ReadableMap current = textFilters.getMap(i);
        String searchText = current.getString("find");
        String replacementText = current.getString("replace");
        textDelegate.setText(searchText, replacementText);
      }
      view.setTextDelegate(textDelegate);
    }

    if (animationJson != null) {
      view.setAnimationFromJson(animationJson, Integer.toString(animationJson.hashCode()));
      animationJson = null;
    }

    if (animationNameDirty) {
      view.setAnimation(animationName);
      animationNameDirty = false;
    }

    if (progress != null) {
      view.setProgress(progress);
      progress = null;
    }

    if (loop != null) {
      view.setRepeatCount(loop ? LottieDrawable.INFINITE : 0);
      loop = null;
    }

    if (speed != null) {
      view.setSpeed(speed);
      speed = null;
    }

    if (scaleType != null) {
      view.setScaleType(scaleType);
      scaleType = null;
    }

    if (renderMode != null) {
      view.setRenderMode(renderMode);
      renderMode = null;
    }

    if (imageAssetsFolder != null) {
      view.setImageAssetsFolder(imageAssetsFolder);
      imageAssetsFolder = null;
    }

    if (enableMergePaths != null) {
      view.enableMergePathsForKitKatAndAbove(enableMergePaths);
      enableMergePaths = null;
    }

    if (colorFilters != null && colorFilters.size() > 0) {
      for (int i = 0 ; i < colorFilters.size() ; i++) {
        ReadableMap current = colorFilters.getMap(i);
        int color;
        if (current.getType("color") == ReadableType.Map) {
          color = ColorPropConverter.getColor(current.getMap("color"), view.getContext());
        } else {
          color = current.getInt("color");
        }
        String path = current.getString("keypath");
        ColorFilter colorFilter = new SimpleColorFilter(color);
        String pathWithGlobstar = path +".**";
        String[] keys = pathWithGlobstar.split(Pattern.quote("."));
        KeyPath keyPath = new  KeyPath(keys);
        LottieValueCallback<ColorFilter> callback = new LottieValueCallback<>(colorFilter);
        view.addValueCallback(keyPath, LottieProperty.COLOR_FILTER, callback);
      }
    }
  }
}
