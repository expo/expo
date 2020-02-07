package versioned.host.exp.exponent.modules.universal;

import android.content.Context;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import host.exp.exponent.kernel.ExperienceId;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.unimodules.core.ModuleRegistry;

import expo.modules.firebase.core.FirebaseCoreService;
import expo.modules.firebase.core.FirebaseCoreOptions;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import java.io.UnsupportedEncodingException;

public class ScopedFirebaseCoreService extends FirebaseCoreService {

  private ModuleRegistry mModuleRegistry;
  private String mProtectedAppName;
  private String mAppName;
  private FirebaseOptions mAppOptions;

  public ScopedFirebaseCoreService(Context context, JSONObject manifest, ExperienceId experienceId) {
    super(context);

    // Get the default firebase app name
    FirebaseApp defaultApp = getFirebaseApp(null);
    mProtectedAppName = (defaultApp != null) ? defaultApp.getName() : "[DEFAULT]";

    // Get experience key & unique app name
    String experienceKey = getEncodedExperienceId(experienceId);
    mAppName = "__sandbox_" + experienceKey;
    mAppOptions = getOptionsFromManifest(manifest);

    // Delete all previously created apps, except for the "default" one
    // which will be updated/created/deleted only when it has changed
    List<FirebaseApp> apps = FirebaseApp.getApps(context);
    for (FirebaseApp app : apps) {
      if (!app.getName().equals(mProtectedAppName) && !app.getName().equals(mAppName)) {
        app.delete();
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
      String base64 = Base64.encodeToString(data, Base64.URL_SAFE | Base64.NO_PADDING);
      return base64.replace("\n", "").replace("\r", "");
    } catch (UnsupportedEncodingException e) {
      return Integer.toString(experienceId.hashCode());
    }
  }

  // Overriden

  @Override
  public String getAppName() {
    return mAppName;
  }

  @Override
  public FirebaseOptions getAppOptions() {
    return mAppOptions;
  }

  @Override
  public boolean isAppAccessible(final String name) {
    if ((mProtectedAppName != null) && mProtectedAppName.equals(name)) {
      return false;
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

  private static FirebaseOptions getOptionsFromManifest(JSONObject manifest) {
    try {
      JSONObject android = manifest.has("android") ? manifest.getJSONObject("android") : null;
      String googleServicesFileString = ((android != null) && android.has("googleServicesFile"))
          ? android.getString("googleServicesFile")
          : null;
      JSONObject googleServicesFile = (googleServicesFileString != null) ? new JSONObject(googleServicesFileString)
          : null;

      // Read project-info settings
      // https://developers.google.com/android/guides/google-services-plugin
      Map<String, String> json = new HashMap<>();
      addJSONStringToMap(googleServicesFile, json, "project_info.project_id", "projectId");
      addJSONStringToMap(googleServicesFile, json, "project_info.project_number", "messagingSenderId");
      addJSONStringToMap(googleServicesFile, json, "project_info.firebase_url", "databaseURL");
      addJSONStringToMap(googleServicesFile, json, "project_info.storage_bucket", "storageBucket");

      // Read client info settings. The client is resolved as follows:
      // 1. Use client with the name "host.exp.exponent" when possible
      // 2. Use first encountered client
      JSONArray clients = googleServicesFile.getJSONArray("client");
      JSONObject client = (clients.length() > 0) ? clients.getJSONObject(0) : null;
      for (int i = 0; i < clients.length(); i++) {
        JSONObject c = clients.getJSONObject(i);
        String packageName = getJSONStringByPath(c, "client_info.android_client_info.package_name");
        if ((packageName != null) && packageName.equals("host.exp.exponent")) {
          client = c;
          break;
        }
      }
      addJSONStringToMap(client, json, "client_info.mobilesdk_app_id", "appId");
      addJSONStringToMap(client, json, "services.analytics_service.analytics_property.tracking_id", "trackingId");
      JSONArray apiKey = client.getJSONArray("api_key");
      if ((apiKey != null) && (apiKey.length() > 0)) {
        addJSONStringToMap(apiKey.getJSONObject(0), json, "current_key", "apiKey");
      }

      if (!json.containsKey("appId"))
        return null;
      return FirebaseCoreOptions.fromJSON(json);
    } catch (Exception err) {
      return null;
    }
  }
}
