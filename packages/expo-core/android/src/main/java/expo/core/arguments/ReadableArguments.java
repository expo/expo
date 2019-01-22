package expo.core.arguments;

import android.os.Bundle;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface ReadableArguments {
  Collection<String> keys();

  boolean containsKey(String key);

  Object get(String key);

  boolean getBoolean(String key);

  boolean getBoolean(String key, boolean defaultValue);

  double getDouble(String key);

  double getDouble(String key, double defaultValue);

  int getInt(String key);

  int getInt(String key, int defaultValue);

  String getString(String key);

  String getString(String key, String defaultValue);

  List getList(String key);

  List getList(String key, List defaultValue);

  Map getMap(String key);

  Map getMap(String key, Map defaultValue);

  ReadableArguments getArguments(String key);

  boolean isEmpty();

  int size();

  Bundle toBundle();
}
