package expo.modules.imagemanipulator.arguments;

import android.support.annotation.Nullable;

import java.util.Map;

public class Utilities {
  @Nullable
  static Boolean getBooleanFromOptions(Map<?, ?> options, String key, String pathForError) throws IllegalArgumentException {
    if (!options.containsKey(key)) {
      return null;
    }
    if (!(options.get(key) instanceof Boolean)) {
      throw new IllegalArgumentException("'" + pathForError + "' must be a Boolean value");
    }
    return (Boolean) options.get(key);
  }

  @Nullable
  static Double getDoubleFromOptions(Map<?, ?> options, String key, String pathForError) throws IllegalArgumentException {
    if (!options.containsKey(key)) {
      return null;
    }
    if (!(options.get(key) instanceof Double)) {
      throw new IllegalArgumentException("'" + pathForError + "' must be a Number value");
    }
    return ((Double) options.get(key));
  }

  static Map ensureMap(Object options, String pathForError) throws IllegalArgumentException {
    if (options instanceof Map<?,?>){
      return (Map) options;
    }
    throw new IllegalArgumentException("'" + pathForError + "' must be an object");
  }
}
