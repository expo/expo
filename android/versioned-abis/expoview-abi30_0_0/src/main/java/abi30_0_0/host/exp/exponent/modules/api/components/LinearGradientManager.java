package abi30_0_0.host.exp.exponent.modules.api.components;

import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi30_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;

public class LinearGradientManager extends SimpleViewManager<LinearGradientView> {
    public static final String REACT_CLASS = "ExponentLinearGradient";
    public static final String PROP_COLORS = "colors";
    public static final String PROP_LOCATIONS = "locations";
    public static final String PROP_START_POS = "startPoint";
    public static final String PROP_END_POS = "endPoint";
    public static final String PROP_BORDER_RADII = "borderRadii";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected LinearGradientView createViewInstance(ThemedReactContext context) {
        return new LinearGradientView(context);
    }

    @ReactProp(name=PROP_COLORS)
    public void setColors(LinearGradientView gradientView, ReadableArray colors) {
        gradientView.setColors(colors);
    }

    @ReactProp(name=PROP_LOCATIONS)
    public void setLocations(LinearGradientView gradientView, ReadableArray locations) {
        if (locations != null) {
            gradientView.setLocations(locations);
        }
    }

    @ReactProp(name=PROP_START_POS)
    public void setStartPosition(LinearGradientView gradientView, ReadableArray startPos) {
        gradientView.setStartPosition(startPos);
    }

    @ReactProp(name=PROP_END_POS)
    public void setEndPosition(LinearGradientView gradientView, ReadableArray endPos) {
        gradientView.setEndPosition(endPos);
    }

    // temporary solution until following issue is resolved:
    // https://github.com/facebook/react-native/issues/3198
    @ReactProp(name=PROP_BORDER_RADII)
    public void setBorderRadii(LinearGradientView gradientView, ReadableArray borderRadii) {
        gradientView.setBorderRadii(borderRadii);
    }
}
