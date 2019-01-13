package expo.modules.bluetooth;

  import java.util.UUID;
  import java.util.regex.Matcher;
  import java.util.regex.Pattern;

public class UUIDHelper {

  // base UUID used to build 128 bit Bluetooth UUIDs
  public static final String UUID_BASE = "0000XXXX-0000-1000-8000-00805f9b34fb";

  // handle 16 and 128 bit UUIDs
  public static UUID uuidFromString(String uuid) {

    if (uuid.length() == 4) {
      uuid = UUID_BASE.replace("XXXX", uuid);
    }
    return UUID.fromString(uuid);
  }

  // return 16 bit UUIDs where possible
  public static String uuidToString(UUID uuid) {
    String longUUID = uuid.toString();
    Pattern pattern = Pattern.compile("0000(.{4})-0000-1000-8000-00805f9b34fb", Pattern.CASE_INSENSITIVE);
    Matcher matcher = pattern.matcher(longUUID);
    if (matcher.matches()) {
      // 16 bit UUID
      return matcher.group(1);
    } else {
      return longUUID;
    }
  }
}