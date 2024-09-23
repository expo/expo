package expo.modules.notifications.notifications;

import android.content.ContentResolver;
import android.content.Context;
import android.net.Uri;
import android.provider.Settings;

import androidx.annotation.Nullable;

/**
 * A shared logic between ContentBuilders ({@link ArgumentsNotificationContentBuilder}
 * and {@link RemoteNotificationContent}) for resolving sounds based on the "soundName" property.
 */
public class SoundResolver {
  private Context mContext;

  public SoundResolver(Context context) {
    mContext = context;
  }

  /**
   * For given filename tries to resolve a raw resource by basename.
   *
   * @param filename A sound's filename
   * @return null if there was no sound found for the filename or a {@link Uri} to the raw resource
   * if one could be found.
   */
  @Nullable
  public Uri resolve(@Nullable String filename) {
    if (filename == null || filename.length() == 0) {
      return null;
    }

    String packageName = mContext.getPackageName();
    String resourceName = filenameToBasename(filename);
    int resourceId = mContext.getResources().getIdentifier(resourceName, "raw", packageName);
    // If resourceId is 0, then the resource does not exist.
    // Returning null falls back to using a default sound.
    if (resourceId != 0) {
      return new Uri.Builder()
        .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
        .authority(packageName)
        .appendPath("raw")
        .appendPath(resourceName)
        .build();
    }

    return Settings.System.DEFAULT_NOTIFICATION_URI;
  }

  private String filenameToBasename(String filename) {
    if (!filename.contains(".")) {
      return filename;
    }

    return filename.substring(0, filename.lastIndexOf('.'));
  }
}
