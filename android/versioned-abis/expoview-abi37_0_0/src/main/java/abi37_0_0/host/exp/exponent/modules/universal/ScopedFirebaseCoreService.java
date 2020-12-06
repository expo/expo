package abi37_0_0.host.exp.exponent.modules.universal;

import android.content.Context;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import host.exp.exponent.kernel.ExperienceId;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import abi37_0_0.org.unimodules.core.ModuleRegistry;
import abi37_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

import abi37_0_0.expo.modules.firebase.core.FirebaseCoreService;
import abi37_0_0.expo.modules.firebase.core.FirebaseCoreOptions;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

import java.io.UnsupportedEncodingException;

public class ScopedFirebaseCoreService extends FirebaseCoreService implements RegistryLifecycleListener {

  private static Map<String, Boolean> mProtectedAppNames = new HashMap<String, Boolean>(); // Map<App-name, isDeleted>

  private String mAppName;
  private FirebaseOptions mAppOptions;

  public ScopedFirebaseCoreService(Context context, JSONObject manifest, ExperienceId experienceId) {
    super(context);

    // Get the default firebase app name
    FirebaseApp defaultApp = getFirebaseApp(null);
    String defaultAppName = (defaultApp != null) ? defaultApp.getName() : DEFAULT_APP_NAME;

    // Get experience key & unique app name
    String experienceKey = getEncodedExperienceId(experienceId);
    mAppName = "__sandbox_" + experienceKey;
    mAppOptions = getOptionsFromManifest(manifest);

    // Add the app to the list of protected app names
    synchronized (mProtectedAppNames) {
      mProtectedAppNames.put(defaultAppName, false);
      mProtectedAppNames.put(mAppName, false);
    }

    // Delete any previously created apps for which the project was unloaded
    // This ensures that the list of Firebase Apps doesn't keep growing
    // for each uniquely loaded project.
    for (FirebaseApp app : FirebaseApp.getApps(context)) {
      Boolean isDeleted = false;
      synchronized (mProtectedAppNames) {
        if (mProtectedAppNames.containsKey(app.getName())) {
          isDeleted = mProtectedAppNames.get(app.getName());
        }
      }
      if (isDeleted) {
        app.delete();
      }
    }

    // Cleanup any deleted apps from the protected-names map
    synchronized (mProtectedAppNames) {
      for (Map.Entry<String, Boolean> entry : mProtectedAppNames.entrySet()) {
        if (entry.getValue()) { // isDeleted
          mProtectedAppNames.remove(entry.getKey());
        }
      }
    }

    // Initialize the firebase app. This will delete/create/update the app
    // if it has changed, and leaves the app untouched when the config
    // is the same.
    updateFirebaseApp(mAppOptions, mAppName);
  }

  private static String getEncodedExperienceId(ExperienceId experienceId) {
    try {
      String encodedUrl = experienceId.getUrlEncoded();
      byte[] data = encodedUrl.getBytes("UTF-8");
      String base64 = Base64.encodeToString(data, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
      return base64;
    } catch (UnsupportedEncodingException e) {
      return Integer.toString(experienceId.hashCode());
    }
  }

  // Overriden

  @Override
  protected String getAppName() {
    return mAppName;
  }

  @Override
  protected FirebaseOptions getAppOptions() {
    return mAppOptions;
  }

  @Override
  protected boolean isAppAccessible(final String name) {
    synchronized (mProtectedAppNames) {
      if (mProtectedAppNames.containsKey(name) && !mAppName.equals(name)) {
        return false;
      }
    }
    return super.isAppAccessible(name);
  }

  // google-services.json loading

  private static String getJSONStringByPath(JSONObject json, String path) {
    if (json == null)
      return null;
    try {
      String[] paths = path.split("\\.");
      for (int i = 0; i < paths.length; i++) {
        String name = paths[i];
        if (!json.has(name))
          return null;
        if (i == paths.length - 1) {
          return json.getString(name);
        } else {
          json = json.getJSONObject(name);
        }
      }
      return null;
    } catch (Exception err) {
      return null;
    }
  }

  private static void addJSONStringToMap(JSONObject json, Map<String, String> map, String path, String name) {
    String value = getJSONStringByPath(json, path);
    if (value != null)
      map.put(name, value);
  }

  private static JSONObject getClientFromGoogleServices(JSONObject googleServicesFile, List<String> preferredPackageNames) {
    JSONArray clients = (googleServicesFile != null) ? googleServicesFile.optJSONArray("client") : null;
    if (clients == null) {
      return null;
    }

    // Find the client and prefer the ones that are in the preferredPackageNames list.
    // Later in the list means higher priority.
    JSONObject client = null;
    int clientPreferredPackageNameIndex = -1;
    for (int i = 0; i < clients.length(); i++) {
      JSONObject possibleClient = clients.optJSONObject(i);
      if (possibleClient != null) {
        String packageName = getJSONStringByPath(possibleClient, "client_info.android_client_info.package_name");
        int preferredPackageNameIndex = (packageName != null) ? preferredPackageNames.indexOf(packageName) : -1;
        if ((client == null) || (preferredPackageNameIndex > clientPreferredPackageNameIndex)) {
          client = possibleClient;
          clientPreferredPackageNameIndex = preferredPackageNameIndex;
        }
      }
    }
    return client;
  }

  private static FirebaseOptions getOptionsFromManifest(JSONObject manifest) {
    try {
      JSONObject android = manifest.optJSONObject("android");
      String googleServicesFileString = (android != null) ? android.optString("googleServicesFile", null) : null;
      JSONObject googleServicesFile = (googleServicesFileString != null) ? new JSONObject(googleServicesFileString)
        : null;
      String packageName = (android != null) ? android.optString("package") : "";

      // Read project-info settings
      // https://developers.google.com/android/guides/google-services-plugin
      Map<String, String> json = new HashMap<>();
      addJSONStringToMap(googleServicesFile, json, "project_info.project_id", "projectId");
      addJSONStringToMap(googleServicesFile, json, "project_info.project_number", "messagingSenderId");
      addJSONStringToMap(googleServicesFile, json, "project_info.firebase_url", "databaseURL");
      addJSONStringToMap(googleServicesFile, json, "project_info.storage_bucket", "storageBucket");

      // Get the client that matches this app. When the Expo Go package was explicitly
      // configured in google-services.json, then use that app when possible.
      // Otherwise, use the client that matches the package_name specified in app.json.
      // If none of those are found, use first encountered client in google-services.json.
      JSONObject client = getClientFromGoogleServices(googleServicesFile, Arrays.asList(
        packageName,
        "host.exp.exponent"
      ));

      // Read properties from client
      addJSONStringToMap(client, json, "client_info.mobilesdk_app_id", "appId");
      addJSONStringToMap(client, json, "services.analytics_service.analytics_property.tracking_id", "trackingId");
      JSONArray apiKey = (client != null) ? client.optJSONArray("api_key") : null;
      if ((apiKey != null) && (apiKey.length() > 0)) {
        addJSONStringToMap(apiKey.getJSONObject(0), json, "current_key", "apiKey");
      }

      // The appId is the best indicator on whether all required info was available
      // and parsed correctly.
      return json.containsKey("appId") ? FirebaseCoreOptions.fromJSON(json) : null;
    } catch (Exception err) {
      return null;
    }
  }

  // Registry lifecycle events

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    // nop
  }

  @Override
  public void onDestroy() {

    // Mark this Firebase App as deleted. Don't delete it straight
    // away, but mark it for deletion. When loading a new project
    // a check is performed that will cleanup the deleted Firebase apps.
    // This ensures that Firebase Apps don't get deleted/recreated
    // every time a project reload happens, and also also ensures that
    // `isAppAccessible` keeps the app unavailable for other project/packages
    // after unload.
    synchronized (mProtectedAppNames) {
      mProtectedAppNames.put(mAppName, true);
    }
  }
}
