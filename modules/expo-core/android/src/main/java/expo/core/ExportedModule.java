package expo.core;

import android.content.Context;

import java.util.Collections;
import java.util.Map;

/**
 * Abstract class for native modules, i. e. modules which export some methods to client code.
 * Use {@link ExpoMethod} to export specific methods to client code.
 */
public abstract class ExportedModule {
  private Context mContext;

  public ExportedModule(Context context) {
    mContext = context;
  }

  public abstract String getName();

  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(Collections.<String, Object>emptyMap());
  }

  protected Context getContext() {
    return mContext;
  }
}
