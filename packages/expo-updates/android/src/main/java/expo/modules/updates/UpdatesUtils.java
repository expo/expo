package expo.modules.updates;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.lang.ref.WeakReference;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import androidx.annotation.Nullable;
import expo.modules.updates.db.entity.AssetEntity;

public class UpdatesUtils {

  private static final String TAG = UpdatesUtils.class.getSimpleName();
  private static final String UPDATES_DIRECTORY_NAME = ".expo-internal";
  private static final String UPDATES_EVENT_NAME = "Expo.nativeUpdatesEvent";

  public static File getOrCreateUpdatesDirectory(Context context) throws Exception {
    File updatesDirectory = new File(context.getFilesDir(), UPDATES_DIRECTORY_NAME);
    boolean exists = updatesDirectory.exists();
    if (exists) {
      if (updatesDirectory.isFile()) {
        throw new Exception("File already exists at the location of the Updates Directory: " + updatesDirectory.toString() + " ; aborting");
      }
    } else {
      if (!updatesDirectory.mkdir()) {
        throw new Exception("Failed to create Updates Directory: mkdir() returned false");
      }
    }
    return updatesDirectory;
  }

  public static String sha256(String string) throws NoSuchAlgorithmException, UnsupportedEncodingException {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] data = string.getBytes("UTF-8");
      md.update(data, 0, data.length);
      byte[] sha1hash = md.digest();
      return bytesToHex(sha1hash);
    } catch (NoSuchAlgorithmException | UnsupportedEncodingException e) {
      Log.e(TAG, "Failed to checksum string via SHA-256", e);
      throw e;
    }
  }

  public static byte[] sha256(File file) throws NoSuchAlgorithmException, IOException {
    try (
        InputStream inputStream = new FileInputStream(file);
        DigestInputStream digestInputStream = new DigestInputStream(inputStream, MessageDigest.getInstance("SHA-256"))
    ) {
      MessageDigest md = digestInputStream.getMessageDigest();
      return md.digest();
    } catch (NoSuchAlgorithmException | IOException e) {
      Log.e(TAG, "Failed to checksum file via SHA-256: " + file.toString(), e);
      throw e;
    }
  }

  public static byte[] sha256AndWriteToFile(InputStream inputStream, File destination) throws NoSuchAlgorithmException, IOException {
    try (
      DigestInputStream digestInputStream = new DigestInputStream(inputStream, MessageDigest.getInstance("SHA-256"))
    ) {
      // write file atomically by writing it to a temporary path and then renaming
      // this protects us against partially written files if the process is interrupted
      File tmpFile = new File(destination.getAbsolutePath() + ".tmp");
      FileUtils.copyInputStreamToFile(digestInputStream, tmpFile);
      if (!tmpFile.renameTo(destination)) {
        throw new IOException("File download was successful, but failed to move from temporary to permanent location " + destination.getAbsolutePath());
      }

      MessageDigest md = digestInputStream.getMessageDigest();
      return md.digest();
    }
  }

  public static String createFilenameForAsset(AssetEntity asset) {
    return asset.key;
  }

  public static void sendEventToReactNative(@Nullable final WeakReference<ReactNativeHost> reactNativeHost, final String eventName, final WritableMap params) {
    if (reactNativeHost != null && reactNativeHost.get() != null) {
      final ReactInstanceManager instanceManager = reactNativeHost.get().getReactInstanceManager();
      AsyncTask.execute(() -> {
        try {
          ReactContext reactContext = null;
          // in case we're trying to send an event before the reactContext has been initialized
          // continue to retry for 5000ms
          for (int i = 0; i < 5; i++) {
            reactContext = instanceManager.getCurrentReactContext();
            if (reactContext != null) {
              break;
            }
            Thread.sleep(1000);
          }

          if (reactContext != null) {
            DeviceEventManagerModule.RCTDeviceEventEmitter emitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
            if (emitter != null) {
              WritableMap eventParams = params;
              if (eventParams == null) {
                eventParams = Arguments.createMap();
              }
              eventParams.putString("type", eventName);
              emitter.emit(UPDATES_EVENT_NAME, eventParams);
              return;
            }
          }

          Log.e(TAG, "Could not emit " + eventName + " event; no event emitter was found.");
        } catch (Exception e) {
          Log.e(TAG, "Could not emit " + eventName + " event; no react context was found.");
        }
      });
    } else {
      Log.e(TAG, "Could not emit " + eventName + " event; UpdatesController was not initialized with an instance of ReactApplication.");
    }
  }

  public static boolean shouldCheckForUpdateOnLaunch(UpdatesConfiguration updatesConfiguration, Context context) {
    if (updatesConfiguration.getUpdateUrl() == null) {
      return false;
    }

    UpdatesConfiguration.CheckAutomaticallyConfiguration configuration = updatesConfiguration.getCheckOnLaunch();

    switch (configuration) {
      case NEVER:
        return false;
      case WIFI_ONLY:
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) {
          Log.e(TAG, "Could not determine active network connection is metered; not checking for updates");
          return false;
        }
        return !cm.isActiveNetworkMetered();
      case ALWAYS:
      default:
        return true;
    }
  }

  public static String getRuntimeVersion(UpdatesConfiguration updatesConfiguration) {
    String runtimeVersion = updatesConfiguration.getRuntimeVersion();
    String sdkVersion = updatesConfiguration.getSdkVersion();
    if (runtimeVersion != null && runtimeVersion.length() > 0) {
      return runtimeVersion;
    } else if (sdkVersion != null && sdkVersion.length() > 0) {
      return sdkVersion;
    } else {
      throw new AssertionError("One of expo_runtime_version or expo_sdk_version must be defined in the Android app manifest");
    }
  }

  // https://stackoverflow.com/questions/9655181/how-to-convert-a-byte-array-to-a-hex-string-in-java
  private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();
  public static String bytesToHex(byte[] bytes) {
    char[] hexChars = new char[bytes.length * 2];
    for (int j = 0; j < bytes.length; j++) {
      int v = bytes[j] & 0xFF;
      hexChars[j * 2] = HEX_ARRAY[v >>> 4];
      hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
    }
    return new String(hexChars);
  }
}
