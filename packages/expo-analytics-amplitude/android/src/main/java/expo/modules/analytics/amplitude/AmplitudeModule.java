package expo.modules.analytics.amplitude;

import android.content.Context;

import com.amplitude.api.Amplitude;
import com.amplitude.api.AmplitudeClient;

import org.json.JSONArray;
import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.List;
import java.util.Map;

public class AmplitudeModule extends ExportedModule {
  private AmplitudeClient mClient;

  public AmplitudeModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoAmplitude";
  }

  protected AmplitudeClient getClient(String apiKey) {
    return Amplitude.getInstance(apiKey);
  }

  @ExpoMethod
  public void initialize(final String apiKey, Promise promise) {
    mClient = getClient(apiKey);
    mClient.initialize(getContext(), apiKey);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUserId(final String userId, Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }

    mClient.setUserId(userId);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUserProperties(final Map<String, Object> properties, Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }
    mClient.setUserProperties(new JSONObject(properties));
  }

  @ExpoMethod
  public void clearUserProperties(Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }

    mClient.clearUserProperties();
  }

  @ExpoMethod
  public void logEvent(final String eventName, Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }

    mClient.logEvent(eventName);
  }

  @ExpoMethod
  public void logEventWithProperties(final String eventName, final Map<String, Object> properties, Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }

    mClient.logEvent(eventName, new JSONObject(properties));
  }

  @ExpoMethod
  public void setGroup(final String groupType, final List<Object> groupNames, Promise promise) {
    if (rejectUnlessInitialized(promise)) {
      return;
    }

    mClient.setGroup(groupType, new JSONArray(groupNames));
  }

  private boolean rejectUnlessInitialized(Promise promise) {
    if (mClient == null) {
      promise.reject("E_NO_INIT", "Amplitude client has not been initialized, are you sure you have configured it with #init(apiKey)?");
      return true;
    }
    return false;
  }
}
