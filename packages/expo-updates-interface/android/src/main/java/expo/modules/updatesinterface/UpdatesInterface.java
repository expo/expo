package expo.modules.updatesinterface;

import android.content.Context;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

/**
 * Interface for modules that depend on expo-updates for loading production updates but do not want
 * to depend on expo-updates or delegate control to the singleton UpdatesController.
 */
public interface UpdatesInterface {

  interface UpdateCallback {
    void onFailure(Exception e);
    void onSuccess(Update update);
    void onProgress(int successfulAssetCount, int failedAssetCount, int totalAssetCount);

    /**
     * Called when a manifest has been downloaded. The return value indicates whether or not to
     * continue downloading the update described by this manifest. Returning `false` will abort the
     * load, and the `onSuccess` callback will be immediately called with a null `update`.
     */
    boolean onManifestLoaded(JSONObject manifest);
  }
  
  interface Update {
    JSONObject getManifest();
    String getLaunchAssetPath();
  }

  void reset();

  void fetchUpdateWithConfiguration(HashMap<String, Object> configuration, Context context, UpdateCallback callback);
}
