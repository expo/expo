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

import java.util.Arrays;
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
      String base64 = Base64.encodeToString(data, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
      return base64;
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

      // Get the client that matches this app. When the Expo Client package was explicitely
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
}
