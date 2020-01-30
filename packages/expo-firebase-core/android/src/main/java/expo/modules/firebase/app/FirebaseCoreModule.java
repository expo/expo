package expo.modules.firebase.core;

import android.app.Activity;
import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

public class FirebaseCoreModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoFirebaseCore";

  protected static final String ERROR_EXCEPTION = "E_FIREBASE_CORE";

  static final String DEFAULT_APP_NAME = "[DEFAULT]";

  private Context mContext;
  private Map<String, String> mDefaultOptions;

  public FirebaseCoreModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("DEFAULT_NAME", getAppName());

    if (mDefaultOptions == null) {
      FirebaseOptions options = getAppOptions();
      mDefaultOptions = FirebaseCoreOptions.toJSON(options);
    }

    if (mDefaultOptions != null) {
      constants.put("DEFAULT_OPTIONS", mDefaultOptions);
    }

    return constants;
  }

  public String getAppName() {
    FirebaseApp app = getFirebaseApp(null);
    return (app != null) ? app.getName() : DEFAULT_APP_NAME;
  }

  public FirebaseOptions getAppOptions() {
    FirebaseApp app = getFirebaseApp(null);
    return (app != null) ? app.getOptions() : FirebaseOptions.fromResource(mContext);
  }

  public boolean isAppAccessible(final String name) {
    return true;
  }

  public FirebaseApp updateFirebaseApp(final FirebaseOptions options, final String name) {
    FirebaseApp app = getFirebaseApp(name);
    if (app != null) {
      if (options == null) {
        app.delete();
      } else {
        if (!FirebaseCoreOptions.isEqual(options, app.getOptions())) {
          app.delete();
          if (name == null) {
            app = FirebaseApp.initializeApp(mContext, options);
          } else {
            app = FirebaseApp.initializeApp(mContext, options, name);
          }
        }
      }
    } else {
      if (options != null) {
        if (name == null) {
          app = FirebaseApp.initializeApp(mContext, options);
        } else {
          app = FirebaseApp.initializeApp(mContext, options, name);
        }
      }
    }

    return app;
  }

  public static FirebaseApp getFirebaseApp(String name) {
    FirebaseApp app;
    try {
      return (name == null) ? FirebaseApp.getInstance() : FirebaseApp.getInstance(name);
    } catch (Exception e) {
      return null;
    }
  }
}
