package expo.modules.bluetooth.helpers;

import android.util.Base64;

public class Base64Helper {
  public static String fromBase64(byte[] bytes) {
    if (bytes == null) {
      return null;
    }
    return Base64.encodeToString(bytes, Base64.NO_WRAP);
  }

  public static byte[] toBase64(String base64) {
    if (base64 == null) {
      return null;
    }
    return Base64.decode(base64, Base64.NO_WRAP);
  }
}