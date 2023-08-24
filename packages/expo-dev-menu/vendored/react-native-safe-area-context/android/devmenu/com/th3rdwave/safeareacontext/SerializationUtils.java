package devmenu.com.th3rdwave.safeareacontext;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;

import java.util.Map;

/* package */ class SerializationUtils {
  static Map<String, Float> edgeInsetsToJavaMap(EdgeInsets insets) {
    return MapBuilder.of(
      "top",
      PixelUtil.toDIPFromPixel(insets.getTop()),
      "right",
      PixelUtil.toDIPFromPixel(insets.getRight()),
      "bottom",
      PixelUtil.toDIPFromPixel(insets.getBottom()),
      "left",
      PixelUtil.toDIPFromPixel(insets.getLeft()));
  }

  static Map<String, Float> rectToJavaMap(Rect rect) {
    return MapBuilder.of(
      "x",
      PixelUtil.toDIPFromPixel(rect.getX()),
      "y",
      PixelUtil.toDIPFromPixel(rect.getY()),
      "width",
      PixelUtil.toDIPFromPixel(rect.getWidth()),
      "height",
      PixelUtil.toDIPFromPixel(rect.getHeight())
    );
  }
}
