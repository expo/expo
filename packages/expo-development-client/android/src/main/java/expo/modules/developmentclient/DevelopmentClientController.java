package expo.modules.developmentclient;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.preference.PreferenceManager;

import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;

import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.annotation.Nullable;

public class DevelopmentClientController {
  // Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.176:8090";
  private final String DEV_LAUNCHER_HOST = null;

  // Host to which network requests always fails, forcing React Native to use our embedded bundle
  private final String FAKE_HOST = "127.0.0.1:1234";

  // Must be in sync with value in `DevSupportManagerImpl` from React Native internals
  private static final String JS_BUNDLE_FILE_NAME = "ReactNativeDevBundle.js";

  // Singleton instance
  private static DevelopmentClientController sInstance;

  private Context mContext;

  private DevelopmentClientController(Context context) {
    mContext = context;

    // Delete React Native's cached development JS bundle so that it always loads the latest one.
    File jsBundleTempFile = new File(context.getFilesDir(), JS_BUNDLE_FILE_NAME);
    if (jsBundleTempFile.exists()) {
      jsBundleTempFile.delete();
    }

    // If we're using a development server for our launcher UI, set the host to that. Else use the
    // fake host so React Native thinks the packager is down and uses our embedded bundle.
    saveDebugHTTPHost(DEV_LAUNCHER_HOST != null ? DEV_LAUNCHER_HOST : FAKE_HOST);
  }

  public static DevelopmentClientController getInstance() {
    if (sInstance == null) {
      throw new IllegalStateException("DevelopmentClientController.getInstance() was called before the module was initialized");
    }
    return sInstance;
  }

  public static void initialize(Context context) {
    if (sInstance == null) {
      sInstance = new DevelopmentClientController(context);
    }
  }

  public @Nullable String getJSBundleFile() {
    if (DEV_LAUNCHER_HOST != null) {
      // If we're using a development URL for the launcher, don't return anything here. React Native
      // will then try to load from the bundler.
      return null;
    }

    // React Native needs an actual file path, while the embedded bundle is a 'raw resource' which
    // doesn't have a true file path. So we write it out to a temporary file then return a path
    // to that file.
    File bundle = new File(mContext.getCacheDir().getAbsolutePath() + "/expo_development_client_android.bundle");
    try {
      // TODO(nikki): We could cache this? Biasing toward always using latest for now...
      FileOutputStream output = new FileOutputStream(bundle);
      InputStream input = mContext.getResources().openRawResource(R.raw.expo_development_client_android);
      IOUtils.copy(input, output);
      output.close();
      return bundle.getAbsolutePath();
    } catch (IOException e) {
      return null;
    }
  }

  private void saveDebugHTTPHost(String host) {
    // React Native's internal `PackagerConnectionSettings` reads from this
    SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(mContext);
    SharedPreferences.Editor editor = sharedPreferences.edit();
    editor.putString("debug_http_host", host);
    editor.commit();
  }

  void loadApp(ReactContext reactContext, String url, ReadableMap options) {
    // Set the host from the given URL
    Uri uri = Uri.parse(url);
    saveDebugHTTPHost(uri.getHost() + ":" + uri.getPort());

    // Read orientation config
    final int orientation =
        options.hasKey("orientation") && options.getString("orientation").equals("landscape") ?
            ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE :
            ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT;

    // Restart the bridge on the main thread
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        reactContext.getCurrentActivity().setRequestedOrientation(orientation);
        ((ReactApplication) mContext).getReactNativeHost().getReactInstanceManager().recreateReactContextInBackground();
      }
    });
  }
}
