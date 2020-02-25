package expo.modules.notifications.notifications.service;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import android.util.Pair;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.HashMap;
import java.util.Map;

import androidx.annotation.NonNull;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A fairly straightforward {@link SharedPreferences} wrapper to be used by {@link ExpoNotificationSchedulerService}.
 * Saves and reads notifications (identifiers, requests and triggers) to and from the persistent storage.
 * <p>
 * For a notification of identifier = 123abc:
 * * request will be persisted under key: {@link SharedPreferencesNotificationsStore#REQUEST_KEY_PREFIX}123abc
 * * trigger will be persisted under key: {@link SharedPreferencesNotificationsStore#TRIGGER_KEY_PREFIX}123abc
 */
public class SharedPreferencesNotificationsStore {
  private static final String SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationsStore";

  private static final String REQUEST_KEY_PREFIX = "request-";
  private static final String TRIGGER_KEY_PREFIX = "trigger-";

  private SharedPreferences mSharedPreferences;

  public SharedPreferencesNotificationsStore(Context context) {
    mSharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
  }

  /**
   * Fetches scheduled notification info for given identifier.
   *
   * @param identifier Identifier of the notification.
   * @return Notification information: request and trigger.
   * @throws JSONException          Thrown if notification request could not have been interpreted as a JSON object.
   * @throws IOException            Thrown if there is an error when fetching trigger from the storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting trigger fetched from the storage.
   */
  public Pair<JSONObject, SchedulableNotificationTrigger> getNotification(String identifier) throws JSONException, IOException, ClassNotFoundException {
    JSONObject request = new JSONObject(mSharedPreferences.getString(preferencesRequestKey(identifier), null));
    SchedulableNotificationTrigger trigger = deserializeTrigger(mSharedPreferences.getString(preferencesTriggerKey(identifier), null));
    return new Pair<>(request, trigger);
  }

  /**
   * Fetches all scheduled notifications, ignoring invalid ones.
   * <p>
   * Goes through all the {@link SharedPreferences} entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and notification info as values
   */
  public Map<String, Pair<JSONObject, SchedulableNotificationTrigger>> getAllNotifications() {
    Map<String, Pair<JSONObject, SchedulableNotificationTrigger>> allNotifications = new HashMap<>();

    for (Map.Entry<String, ?> entry : mSharedPreferences.getAll().entrySet()) {
      String key = entry.getKey();
      try {
        String identifier;
        if (key.startsWith(REQUEST_KEY_PREFIX)) {
          identifier = key.substring(REQUEST_KEY_PREFIX.length());
        } else if (key.startsWith(TRIGGER_KEY_PREFIX)) {
          identifier = key.substring(TRIGGER_KEY_PREFIX.length());
        } else {
          continue;
        }

        JSONObject request = null;
        SchedulableNotificationTrigger trigger = null;
        Pair<JSONObject, SchedulableNotificationTrigger> scheduledNotification = allNotifications.get(identifier);
        if (scheduledNotification != null) {
          request = scheduledNotification.first;
          trigger = scheduledNotification.second;
        }

        if (key.startsWith(REQUEST_KEY_PREFIX)) {
          request = new JSONObject((String) entry.getValue());
        } else if (key.startsWith(TRIGGER_KEY_PREFIX)) {
          trigger = deserializeTrigger((String) entry.getValue());
        }
        allNotifications.put(identifier, new Pair<>(request, trigger));
      } catch (JSONException | ClassNotFoundException | IOException e) {
        // do nothing
      }
    }

    // Remove invalid notifications
    for (String key : allNotifications.keySet()) {
      Pair<JSONObject, SchedulableNotificationTrigger> pair = allNotifications.get(key);
      if (pair == null || pair.first == null || pair.second == null) {
        allNotifications.remove(key);
      }
    }

    return allNotifications;
  }

  /**
   * Saves given notification in the persistent storage.
   *
   * @param identifier   Notification identifier
   * @param notification Notification request
   * @param trigger      Notification trigger
   * @throws IOException Thrown if there is an error while serializing trigger
   */
  public void saveNotification(@NonNull String identifier, @NonNull JSONObject notification, @NonNull SchedulableNotificationTrigger trigger) throws IOException {
    mSharedPreferences.edit()
        .putString(preferencesRequestKey(identifier), notification.toString())
        .putString(preferencesTriggerKey(identifier), serializeTrigger(trigger))
        .apply();
  }

  /**
   * Removes notification info for given identifier.
   *
   * @param identifier Notification identifier
   */
  public void removeNotification(String identifier) {
    mSharedPreferences.edit()
        .remove(preferencesRequestKey(identifier))
        .remove(preferencesTriggerKey(identifier))
        .apply();
  }

  /**
   * Serializes the trigger to a Base64-encoded string.
   *
   * @param trigger Schedulable trigger to serialize
   * @return Base64-encoded, serialized trigger
   * @throws IOException Thrown if there is an error while writing trigger to string.
   */
  private String serializeTrigger(SchedulableNotificationTrigger trigger) throws IOException {
    try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
         ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
      objectOutputStream.writeObject(trigger);
      return Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP);
    }
  }

  /**
   * Deserializes trigger from the string representation.
   *
   * @param trigger Base64-encoded, serialized trigger representation
   * @return Deserialized trigger
   * @throws IOException            Thrown if there is an error while reading trigger from String
   * @throws ClassNotFoundException Thrown if the deserialization failes due to class not being found.
   * @throws InvalidClassException  Thrown if the trigger is of invalid class.
   */
  private SchedulableNotificationTrigger deserializeTrigger(String trigger) throws IOException, ClassNotFoundException, InvalidClassException {
    byte[] data = Base64.decode(trigger, Base64.NO_WRAP);
    try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data);
         ObjectInputStream ois = new ObjectInputStream(byteArrayInputStream)) {
      Object o = ois.readObject();
      if (o instanceof SchedulableNotificationTrigger) {
        return (SchedulableNotificationTrigger) o;
      }
      throw new InvalidClassException("Expected serialized trigger to be an instance of SchedulableNotificationTrigger. Found: " + o.toString());
    }
  }

  /**
   * @param identifier Notification identifier
   * @return Key under which notification request will be persisted in the storage.
   */
  private String preferencesRequestKey(String identifier) {
    return REQUEST_KEY_PREFIX + identifier;
  }

  /**
   * @param identifier Notification identifier
   * @return Key under which notification trigger will be persisted in the storage.
   */
  private String preferencesTriggerKey(String identifier) {
    return TRIGGER_KEY_PREFIX + identifier;
  }
}
