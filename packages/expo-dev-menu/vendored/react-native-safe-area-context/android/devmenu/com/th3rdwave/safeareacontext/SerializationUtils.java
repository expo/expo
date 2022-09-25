package devmenu.com.th3rdwave.safeareacontext;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;

import java.util.Map;

/* package */ class SerializationUtils {
  static WritableMap edgeInsetsToJsMap(EdgeInsets insets) {
    WritableMap insetsMap = Arguments.createMap();
    insetsMap.putDouble("top", PixelUtil.toDIPFromPixel(insets.top));
    insetsMap.putDouble("right", PixelUtil.toDIPFromPixel(insets.right));
    insetsMap.putDouble("bottom", PixelUtil.toDIPFromPixel(insets.bottom));
    insetsMap.putDouble("left", PixelUtil.toDIPFromPixel(insets.left));
    return insetsMap;
  }

  static Map<String, Float> edgeInsetsToJavaMap(EdgeInsets insets) {
    return MapBuilder.of(
        "top",
        PixelUtil.toDIPFromPixel(insets.top),
        "right",
        PixelUtil.toDIPFromPixel(insets.right),
        "bottom",
        PixelUtil.toDIPFromPixel(insets.bottom),
        "left",
        PixelUtil.toDIPFromPixel(insets.left));
  }

  static WritableMap rectToJsMap(Rect rect) {
    WritableMap rectMap = Arguments.createMap();
    rectMap.putDouble("x", PixelUtil.toDIPFromPixel(rect.x));
    rectMap.putDouble("y", PixelUtil.toDIPFromPixel(rect.y));
    rectMap.putDouble("width", PixelUtil.toDIPFromPixel(rect.width));
    rectMap.putDouble("height", PixelUtil.toDIPFromPixel(rect.height));
    return rectMap;
  }

  static Map<String, Float> rectToJavaMap(Rect rect) {
    return MapBuilder.of(
        "x",
        PixelUtil.toDIPFromPixel(rect.x),
        "y",
        PixelUtil.toDIPFromPixel(rect.y),
        "width",
        PixelUtil.toDIPFromPixel(rect.width),
        "height",
        PixelUtil.toDIPFromPixel(rect.height));
  }
}
