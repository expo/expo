package expo.modules.core.interfaces;

import java.util.List;
import java.util.Map;

public interface Arguments {
  boolean containsKey(String key);

  Object get(String key);

  boolean getBoolean(String key);

  boolean getBoolean(String key, boolean defaultValue);

  double getDouble(String key);

  double getDouble(String key, double defaultValue);

  int getInt(String key);

  int getInt(String key, int defaultValue);

  long getLong(String key);

  long getLong(String key, long defaultValue);

  String getString(String key);

  String getString(String key, String defaultValue);

  List getList(String key);

  List getList(String key, List defaultValue);

  Map getMap(String key);

  Map getMap(String key, Map defaultValue);

  Arguments getArguments(String key);

  boolean isEmpty();

  int size();
}
