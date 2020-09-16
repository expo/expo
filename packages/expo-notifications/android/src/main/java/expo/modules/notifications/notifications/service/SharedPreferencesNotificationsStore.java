package expo.modules.notifications.notifications.service;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONException;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InvalidClassException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import expo.modules.notifications.notifications.model.NotificationRequest;

/**
 * A fairly straightforward {@link SharedPreferences} wrapper to be used by {@link NotificationSchedulingHelper}.
 * Saves and reads notifications (identifiers, requests and triggers) to and from the persistent storage.
 * <p>
 * A notification request of identifier = 123abc, it will be persisted under key:
 * {@link SharedPreferencesNotificationsStore#NOTIFICATION_REQUEST_KEY_PREFIX}123abc
 */
public class SharedPreferencesNotificationsStore {
  private static final String SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationsStore";

  private static final String NOTIFICATION_REQUEST_KEY_PREFIX = "notification_request-";

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
  public NotificationRequest getNotificationRequest(String identifier) throws IOException, ClassNotFoundException {
    return deserializeNotificationRequest(mSharedPreferences.getString(preferencesNotificationRequestKey(identifier), null));
  }

  /**
   * Fetches all scheduled notifications, ignoring invalid ones.
   * <p>
   * Goes through all the {@link SharedPreferences} entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and notification info as values
   */
  public Collection<NotificationRequest> getAllNotificationRequests() {
    Collection<NotificationRequest> allNotifications = new ArrayList<>();

    for (Map.Entry<String, ?> entry : mSharedPreferences.getAll().entrySet()) {
      try {
        if (entry.getKey().startsWith(NOTIFICATION_REQUEST_KEY_PREFIX)) {
          allNotifications.add(deserializeNotificationRequest((String) entry.getValue()));
        }
      } catch (ClassNotFoundException | IOException e) {
        // do nothing
      }
    }

    return allNotifications;
  }

  /**
   * Saves given notification in the persistent storage.
   *
   * @param notificationRequest Notification request
   * @throws IOException Thrown if there is an error while serializing trigger
   */
  public void saveNotificationRequest(NotificationRequest notificationRequest) throws IOException {
    mSharedPreferences.edit()
      .putString(preferencesNotificationRequestKey(notificationRequest.getIdentifier()), serializeNotificationRequest(notificationRequest))
      .apply();
  }

  /**
   * Removes notification info for given identifier.
   *
   * @param identifier Notification identifier
   */
  public void removeNotificationRequest(String identifier) {
    SharedPreferences.Editor editor = mSharedPreferences.edit();
    removeNotificationRequest(editor, identifier);
    editor.apply();
  }

  /**
   * Perform notification removal on provided {@link SharedPreferences.Editor} instance. Can be reused
   * to batch deletion.
   *
   * @param editor     Editor to apply changes onto
   * @param identifier Notification identifier
   * @return Returns a reference to the same Editor object, so you can
   * chain put calls together.
   */
  private SharedPreferences.Editor removeNotificationRequest(SharedPreferences.Editor editor, String identifier) {
    return editor.remove(preferencesNotificationRequestKey(identifier));
  }

  /**
   * Removes all notification infos, returning removed IDs.
   */
  public Collection<String> removeAllNotificationRequests() {
    Collection<String> deletedIdentifiers = new ArrayList<>();
    SharedPreferences.Editor editor = mSharedPreferences.edit();
    for (NotificationRequest request : getAllNotificationRequests()) {
      String identifier = request.getIdentifier();
      removeNotificationRequest(editor, identifier);
      deletedIdentifiers.add(identifier);
    }
    editor.apply();
    return deletedIdentifiers;
  }

  /**
   * Serializes the trigger to a Base64-encoded string.
   *
   * @param notificationRequest Notification request to serialize
   * @return Base64-encoded, serialized trigger
   * @throws IOException Thrown if there is an error while writing trigger to string.
   */
  private String serializeNotificationRequest(NotificationRequest notificationRequest) throws IOException {
    try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
         ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
      objectOutputStream.writeObject(notificationRequest);
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
  private NotificationRequest deserializeNotificationRequest(String trigger) throws IOException, ClassNotFoundException, InvalidClassException {
    byte[] data = Base64.decode(trigger, Base64.NO_WRAP);
    try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data);
         ObjectInputStream ois = new ObjectInputStream(byteArrayInputStream)) {
      Object o = ois.readObject();
      if (o instanceof NotificationRequest) {
        return (NotificationRequest) o;
      }
      throw new InvalidClassException("Expected serialized notification request to be an instance of NotificationRequest. Found: " + o.toString());
    }
  }

  /**
   * @param identifier Notification identifier
   * @return Key under which notification request will be persisted in the storage.
   */
  private String preferencesNotificationRequestKey(String identifier) {
    return NOTIFICATION_REQUEST_KEY_PREFIX + identifier;
  }
}
