package expo.modules.notifications.push.TokenDispatcher.engines;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.UUID;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class ExpoEngine implements Engine {

  private static final String SERVER_BASE_ADDRESS = "https://exp.host/--/api/v2/push/";
  public static String DEVICE_ID = "deviceId";
  private static String PREF_NAME = ExpoEngine.class.getCanonicalName();

  @Override
  public void sendTokenToServer(String token, Context context) {
    try {
      JSONObject params = new JSONObject();
      params.put("deviceToken", token);
      params.put("deviceId", getOrCreateDeviceId(context));
      params.put("appId", context.getPackageName());
      params.put("type", "fcm");

      RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), params.toString());
      Request request = createRequest(body);

      OkHttpClient client = new OkHttpClient();
      client.newCall(request).execute();
    } catch (IOException | JSONException e) {
      e.printStackTrace();
    }
  }

  @Override
  public String generateToken(String appId, String token, Context context) {
    return getTokenFromExpoServer(appId, token, context);
  }

  private Request createRequest(RequestBody body) {
    Request.Builder builder = new Request.Builder();
    builder.url(SERVER_BASE_ADDRESS + "updateDeviceToken");
    builder.header("Exponent-Platform", "android");
    builder.post(body);
    builder.header("Content-Type", "application/json");
    return builder.build();
  }

  static synchronized String getOrCreateDeviceId(Context context) {
    SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    if (sharedPreferences.contains(DEVICE_ID)) {
      return sharedPreferences.getString(DEVICE_ID, "");
    } else {
      UUID deviceId = UUID.randomUUID();

      SharedPreferences.Editor editor = sharedPreferences.edit();
      editor.putString(DEVICE_ID, deviceId.toString());
      editor.commit();
      return deviceId.toString();
    }
  }

  static String getTokenFromExpoServer(String appId, String token, Context context) {

    JSONObject params = new JSONObject();
    try {
      params.put("deviceId", getOrCreateDeviceId(context));
      params.put("experienceId", appId);
      params.put("appId", context.getApplicationContext().getPackageName());
      params.put("deviceToken", token);
      params.put("type", "fcm");
      params.put("development", false);
    } catch (JSONException e) {
      return null;
    }

    RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), params.toString());
    Request request = createGetTokenRequest(body);

    OkHttpClient client = new OkHttpClient();
    try {
      Response response = client.newCall(request).execute();
      if (!response.isSuccessful()) {
        return null;
      }
      JSONObject result = null;
      result = new JSONObject(response.body().string());
      JSONObject data = result.getJSONObject("data");
      return data.getString("expoPushToken");
    } catch (IOException | JSONException e) {
      e.printStackTrace();
    }
    return null;
  }

  static private Request createGetTokenRequest(RequestBody body) {
    Request.Builder builder = new Request.Builder();
    builder.url(SERVER_BASE_ADDRESS + "getExpoPushToken");
    builder.header("Exponent-Platform", "android");
    builder.post(body);
    builder.header("Content-Type", "application/json");
    return builder.build();
  }
}
