package expo.modules.lineargradient;

import android.content.Context;

import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.ExpoProp;

import java.util.ArrayList;

public class LinearGradientManager extends ViewManager<LinearGradientView> {
  public static final String VIEW_CLASS_NAME = "ExpoLinearGradient";
  public static final String PROP_COLORS = "colors";
  public static final String PROP_LOCATIONS = "locations";
  public static final String PROP_START_POS = "startPoint";
  public static final String PROP_END_POS = "endPoint";
  public static final String PROP_BORDER_RADII = "borderRadii";

  @Override
  public String getName() {
    return VIEW_CLASS_NAME;
  }
  @Override
  public LinearGradientView createViewInstance(Context context) {
    return new LinearGradientView(context);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.SIMPLE;
  }

  @ExpoProp(name = PROP_COLORS)
  public void setColors(LinearGradientView view, final ArrayList<Double> colors) {
    view.setColors(colors);
  }

  @ExpoProp(name = PROP_LOCATIONS)
  public void setLocations(LinearGradientView view, final ArrayList<Double> locations) {
    if (locations != null) {
      view.setLocations(locations);
    }
  }

  @ExpoProp(name = PROP_START_POS)
  public void setStartPosition(LinearGradientView view, final ArrayList<Double> startPos) {
    view.setStartPosition(startPos);
  }

  @ExpoProp(name = PROP_END_POS)
  public void setEndPosition(LinearGradientView view, final ArrayList<Double> endPos) {
    view.setEndPosition(endPos);
  }

  // temporary solution until following issue is resolved:
  // https://github.com/facebook/react-native/issues/3198
  @ExpoProp(name = PROP_BORDER_RADII)
  public void setBorderRadii(LinearGradientView view, final ArrayList<Double> borderRadii) {
    view.setBorderRadii(borderRadii);
  }
}
