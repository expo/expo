package expo.modules.firebase.core;

import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.interfaces.InternalModule;

import java.util.List;
import java.util.Collections;

public class FirebaseCoreService implements InternalModule, FirebaseCoreInterface {
  //protected static final String ERROR_EXCEPTION = "E_FIREBASE_CORE";

  static final String DEFAULT_APP_NAME = "[DEFAULT]";

  private Context mContext;

  public FirebaseCoreService(Context context) {
    super();
    mContext = context;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) FirebaseCoreInterface.class);
  }

  // FirebaseCoreInterface

  public FirebaseApp getDefaultApp() {
    return getFirebaseApp(getAppName());
  }

  // Overridable

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

  // Static

  public static FirebaseApp getFirebaseApp(String name) {
    FirebaseApp app;
    try {
      return (name == null) ? FirebaseApp.getInstance() : FirebaseApp.getInstance(name);
    } catch (Exception e) {
      return null;
    }
  }
}
