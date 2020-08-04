package expo.modules.firebase.core;

import com.google.firebase.FirebaseOptions;

import java.util.Map;
import java.util.HashMap;

public class FirebaseCoreOptions {

  public static FirebaseOptions fromJSON(final Map<String, String> json) {
    if (json == null)
      return null;
    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    if (json.containsKey("apiKey"))
      builder.setApiKey(json.get("apiKey"));
    if (json.containsKey("appId"))
      builder.setApplicationId(json.get("appId"));
    if (json.containsKey("databaseURL"))
      builder.setDatabaseUrl(json.get("databaseURL"));
    if (json.containsKey("messagingSenderId"))
      builder.setGcmSenderId(json.get("messagingSenderId"));
    if (json.containsKey("projectId"))
      builder.setProjectId(json.get("projectId"));
    if (json.containsKey("storageBucket"))
      builder.setStorageBucket(json.get("storageBucket"));
    if (json.containsKey("trackingId"))
      builder.setGaTrackingId(json.get("trackingId"));

    return builder.build();
  }

  public static Map<String, String> toJSON(final FirebaseOptions options) {
    if (options == null)
      return null;
    final Map<String, String> result = new HashMap<>();
    result.put("apiKey", options.getApiKey());
    result.put("appId", options.getApplicationId());
    result.put("databaseURL", options.getDatabaseUrl());
    result.put("messagingSenderId", options.getGcmSenderId());
    result.put("projectId", options.getProjectId());
    result.put("storageBucket", options.getStorageBucket());
    if (options.getGaTrackingId() != null)
      result.put("trackingId", options.getGaTrackingId());

    return result;
  }

  public static boolean isEqual(final FirebaseOptions opts1, final FirebaseOptions opts2) {
    if (opts1 == opts2)
      return true;
    if ((opts1 == null) || (opts2 == null))
      return false;
    return opts1.equals(opts2);
  }
}
