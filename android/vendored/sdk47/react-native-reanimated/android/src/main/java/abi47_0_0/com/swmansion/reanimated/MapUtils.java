package abi47_0_0.com.swmansion.reanimated;

import abi47_0_0.com.facebook.react.bridge.JSApplicationCausedNativeException;
import abi47_0_0.com.facebook.react.bridge.NoSuchKeyException;
import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class MapUtils {
  public static int getInt(ReadableMap map, @Nonnull String name, String errorMsg) {
    try {
      return map.getInt(name);
    } catch (NoSuchKeyException e) {
      throw new JSApplicationCausedNativeException(errorMsg);
    }
  }

  @Nullable
  public static String getString(ReadableMap map, @Nonnull String name, String errorMsg) {
    try {
      return map.getString(name);
    } catch (NoSuchKeyException e) {
      throw new JSApplicationCausedNativeException(errorMsg);
    }
  }
}
