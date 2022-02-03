package abi42_0_0.host.exp.exponent.modules.api.reanimated;

import abi42_0_0.com.facebook.react.bridge.JSApplicationCausedNativeException;
import abi42_0_0.com.facebook.react.bridge.NoSuchKeyException;
import abi42_0_0.com.facebook.react.bridge.ReadableMap;
import abi42_0_0.com.facebook.react.bridge.ReadableType;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class MapUtils {
  public static int getInt(ReadableMap map,  @Nonnull String name, String errorMsg) {
    try {
      return map.getInt(name);
    } catch (NoSuchKeyException e) {
      throw new JSApplicationCausedNativeException(errorMsg);
    }
  }

  @Nullable
  public static String getString(ReadableMap map,  @Nonnull String name, String errorMsg) {
    try {
      return map.getString(name);
    } catch (NoSuchKeyException e) {
      throw new JSApplicationCausedNativeException(errorMsg);
    }
  }
}
