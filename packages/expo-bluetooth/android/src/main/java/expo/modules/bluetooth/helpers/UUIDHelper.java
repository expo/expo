package expo.modules.bluetooth.helpers;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UUIDHelper {

  private static String baseUUIDPrefix = "0000";
  private static String baseUUIDSuffix = "-0000-1000-8000-00805F9B34FB";

  public static UUID toUUID(String uuid) {
    if (uuid == null) return null;
    if (uuid.length() == 4) {
      uuid = baseUUIDPrefix + uuid + baseUUIDSuffix;
    } else if (uuid.length() == 8) {
      uuid = uuid + baseUUIDSuffix;
    }
    try {
      return UUID.fromString(uuid);
    } catch (Throwable e) {
      return null;
    }
  }

  public static String fromUUID(UUID uuid) {
    return toString(uuid);
  }
  public static String toString(UUID uuid) {
    if (uuid == null) return null;
    String longUUID = uuid.toString();
    Pattern pattern = Pattern.compile("0000(.{4})-0000-1000-8000-00805f9b34fb", Pattern.CASE_INSENSITIVE);
    Matcher matcher = pattern.matcher(longUUID);
    if (matcher.matches()) {
      return matcher.group(1);
    } else {
      return longUUID;
    }
  }
}

