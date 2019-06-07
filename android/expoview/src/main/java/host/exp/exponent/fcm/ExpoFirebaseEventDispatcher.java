package host.exp.exponent.fcm;

import android.app.IntentService;
import android.content.Intent;
import android.os.Bundle;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;

import expo.modules.notifications.push.fcm.ExpoFcmMessagingService;
import host.exp.exponent.ABIVersion;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.notifications.PushNotificationHelper;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;

public class ExpoFirebaseEventDispatcher extends IntentService {

  public final static String METHOD_KEY = "METHOD_KEY";
  public final static String ON_NEW_TOKEN = "onNewToken";
  public final static String ON_NEW_MESSAGE = "onNewMessage";

  public final static String TOKEN_KEY = "tokenKey";
  public final static String MESSAGE_KEY = "messageKey";

  public final static String BASE_SDK = "36.0.0";

  public ExpoFirebaseEventDispatcher() {
    super("ExpoFirebaseEventDispatcher");
  }

  @Override
  protected void onHandleIntent(Intent intent) {
    switch (intent.getStringExtra(METHOD_KEY)) {
      case ON_NEW_TOKEN:
        onNewToken(intent.getStringExtra(TOKEN_KEY));
        break;
      case ON_NEW_MESSAGE:
        onNewMessage(intent.getBundleExtra(MESSAGE_KEY));
        break;
      default:
        break;
    }
  }

  private void onNewMessage(Bundle message) {
    RemoteMessage remoteMessage = new RemoteMessage(message);
    String experienceId = message.getString("experienceId");

    ExponentDB.experienceIdToExperience(experienceId, new ExponentDB.ExperienceResultListener() {
      @Override
      public void onSuccess(ExperienceDBObject experience) {
        try {

          JSONObject manifest = new JSONObject(experience.manifest);
          String version = manifest.getString(ExponentManifest.MANIFEST_SDK_VERSION_KEY);

          if (version.equals("UNVERSIONED")) {

            new ExpoFcmMessagingService().onMessageReceived(remoteMessage);

          } else if (ABIVersion.toNumber(version) < ABIVersion.toNumber(BASE_SDK)) {

            PushNotificationHelper.getInstance().onMessageReceived(
                getApplicationContext(),
                message.getString("experienceId"),
                message.getString("channelId"),
                message.getString("message"),
                message.getString("body"),
                message.getString("title"),
                message.getString("categoryId")
            );

          } else {

            FirebaseMessagingService service = getServiceForAbi(version);
            if (service != null) {
              service.onMessageReceived(remoteMessage);
            }

          }

        } catch (JSONException e) {
          e.printStackTrace();
        }
      }

      @Override
      public void onFailure() {

      }
    });
  }

  private void onNewToken(String token) {
    FcmRegistrationIntentService.registerForeground(getApplicationContext(), token);

    FirebaseMessagingService unversionedService = new ExpoFcmMessagingService();
    unversionedService.onNewToken(token);

    for (String abiVersion : getAbiVersionsWithNotificationsUnimodule()) {
      FirebaseMessagingService service = getServiceForAbi(abiVersion);
      if (service != null) {
        service.onNewToken(token);
      }
    }
  }

  FirebaseMessagingService getServiceForAbi(String abi) {
    String abiNumber = abi.split(".")[0];
    String className = "abi" + abiNumber +  "_0_0.expo.modules.notifications.push.fcm.ExpoFcmMessagingService";
    try {
      Class<?> serviceClass = Class.forName(className);
      Constructor<?> ctor = serviceClass.getConstructor();
      Object object = ctor.newInstance();
      return (FirebaseMessagingService) object;
    } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException | InstantiationException | InvocationTargetException e) {
      e.printStackTrace();
    }
    return null;
  }

  void triggerServiceOnNewToken(FirebaseMessagingService service, String token) {
    service.onNewToken(token);
  }

  void triggerServiceOnNewMessage(FirebaseMessagingService service, RemoteMessage message) {
    service.onMessageReceived(message);
  }

  List<String> getAbiVersionsWithNotificationsUnimodule() {
    ArrayList<String> abis = new ArrayList<>();

    for (String abi : Constants.SDK_VERSIONS_LIST) {
      if (ABIVersion.toNumber(abi) >= ABIVersion.toNumber(BASE_SDK)) {
        abis.add(abi);
      }
    }

    return abis;
  }

}
