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

import expo.modules.notifications.notifications.model.NotificationCategory;

/**
 * A fairly straightforward {@link SharedPreferences} wrapper to be used by {@link ExpoNotificationSchedulerService}.
 * Saves and reads notification category information (identifiers, actions, and options) to and from persistent storage.
 * <p>
 * A notification category with identifier = 123abc will be persisted under key:
 * {@link SharedPreferencesNotificationCategoriesStore#NOTIFICATION_CATEGORY_KEY_PREFIX}123abc
 */
public class SharedPreferencesNotificationCategoriesStore {
  private static final String SHARED_PREFERENCES_NAME = "expo.modules.notifications.SharedPreferencesNotificationCategoriesStore";

  private static final String NOTIFICATION_CATEGORY_KEY_PREFIX = "notification_category-";

  private SharedPreferences mSharedPreferences;

  public SharedPreferencesNotificationCategoriesStore(Context context) {
    mSharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
  }

  /**
   * Fetches notification category info for given identifier.
   *
   * @param identifier Identifier of the category.
   * @return Category information: actions and options.
   * @throws JSONException          Thrown if notification category could not be interpreted as a JSON object.
   * @throws IOException            Thrown if there is an error when fetching the category from storage.
   * @throws ClassNotFoundException Thrown if there is an error when interpreting the category fetched from storage.
   */
  public NotificationCategory getNotificationCategory(String identifier) throws IOException, ClassNotFoundException {
    return deserializeNotificationCategory(mSharedPreferences.getString(preferencesNotificationCategoryKey(identifier), null));
  }

  /**
   * Fetches all categories, ignoring invalid ones.
   * <p>
   * Goes through all the {@link SharedPreferences} entries, interpreting only the ones conforming
   * to the expected format.
   *
   * @return Map with identifiers as keys and category info as values
   */
  public Collection<NotificationCategory> getAllNotificationCategories() {
    Collection<NotificationCategory> allCategories = new ArrayList<>();

    for (Map.Entry<String, ?> entry : mSharedPreferences.getAll().entrySet()) {
      try {
        if (entry.getKey().startsWith(NOTIFICATION_CATEGORY_KEY_PREFIX)) {
          allCategories.add(deserializeNotificationCategory((String) entry.getValue()));
        }
      } catch (ClassNotFoundException | IOException e) {
        // do nothing
      }
    }

    return allCategories;
  }

  /**
   * Saves given category in persistent storage.
   *
   * @param notificationCategory Notification category
   * @throws IOException Thrown if there is an error while serializing the category
   */
  public void saveNotificationCategory(NotificationCategory notificationCategory) throws IOException {
    mSharedPreferences.edit()
        .putString(preferencesNotificationCategoryKey(notificationCategory.getIdentifier()), serializeNotificationCategory(notificationCategory))
        .apply();
  }

  /**
   * Removes notification category for the given identifier.
   *
   * @param identifier Category identifier
   */
  public void removeNotificationCategory(String identifier) {
    SharedPreferences.Editor editor = mSharedPreferences.edit();
    removeNotificationCategory(editor, identifier);
    editor.apply();
  }

  /**
   * Perform category removal on provided {@link SharedPreferences.Editor} instance. Can be reused
   * to batch deletion.
   *
   * @param editor     Editor to apply changes onto
   * @param identifier Category identifier
   * @return Returns a reference to the same Editor object, so you can
   * chain put calls together.
   */
  private SharedPreferences.Editor removeNotificationCategory(SharedPreferences.Editor editor, String identifier) {
    return editor.remove(preferencesNotificationCategoryKey(identifier));
  }

  /**
   * Removes all categories, returning removed IDs.
   */
  public Collection<String> removeAllNotificationCategories() {
    Collection<String> deletedCategories = new ArrayList<>();
    SharedPreferences.Editor editor = mSharedPreferences.edit();
    for (NotificationCategory category : getAllNotificationCategories()) {
      String identifier = category.getIdentifier();
      removeNotificationCategory(editor, identifier);
      deletedCategories.add(identifier);
    }
    editor.apply();
    return deletedCategories;
  }

  /**
   * Serializes the category to a Base64-encoded string.
   *
   * @param notificationCategory Notification category to serialize
   * @return Base64-encoded, serialized category
   * @throws IOException Thrown if there is an error while writing category to string.
   */
  private String serializeNotificationCategory(NotificationCategory notificationCategory) throws IOException {
    try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
         ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
      objectOutputStream.writeObject(notificationCategory);
      return Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP);
    }
  }

  /**
   * Deserializes the category from the string representation.
   *
   * @param category Base64-encoded, serialized category representation
   * @return Deserialized category
   * @throws IOException            Thrown if there is an error while reading category from String
   * @throws ClassNotFoundException Thrown if the deserialization failes due to class not being found.
   * @throws InvalidClassException  Thrown if the category is of invalid class.
   */
  private NotificationCategory deserializeNotificationCategory(String category) throws IOException, ClassNotFoundException, InvalidClassException {
    byte[] data = Base64.decode(category, Base64.NO_WRAP);
    try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(data);
         ObjectInputStream ois = new ObjectInputStream(byteArrayInputStream)) {
      Object o = ois.readObject();
      if (o instanceof NotificationCategory) {
        return (NotificationCategory) o;
      }
      throw new InvalidClassException("Expected serialized notification category to be an instance of NotificationCategory. Found: " + o.toString());
    }
  }

  /**
   * @param identifier Category identifier
   * @return Key under which the notification category will be persisted in storage.
   */
  private String preferencesNotificationCategoryKey(String identifier) {
    return NOTIFICATION_CATEGORY_KEY_PREFIX + identifier;
  }
}
