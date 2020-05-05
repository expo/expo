package expo.modules.updates.db;

import android.net.Uri;
import android.util.Log;

import expo.modules.updates.db.enums.HashType;
import expo.modules.updates.db.enums.UpdateStatus;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.util.Date;
import java.util.UUID;

import androidx.room.TypeConverter;

public class Converters {

  private static final String TAG = Converters.class.getSimpleName();

  @TypeConverter
  public static Date longToDate(Long value) {
    return value == null ? null : new Date(value);
  }

  @TypeConverter
  public static Long dateToLong(Date date) {
    return date == null ? null : date.getTime();
  }


  @TypeConverter
  public static Uri stringToUri(String string) {
    return string == null ? null : Uri.parse(string);
  }

  @TypeConverter
  public static String uriToString(Uri uri) {
    return uri == null ? null : uri.toString();
  }


  @TypeConverter
  public static JSONObject stringToJsonObject(String string) {
    if (string == null) {
      return null;
    }
    JSONObject jsonObject;
    try {
      jsonObject = new JSONObject(string);
    } catch (JSONException e) {
      Log.e(TAG, "Could not convert string to JSONObject", e);
      jsonObject = new JSONObject();
    }
    return jsonObject;
  }

  @TypeConverter
  public static String jsonObjectToString(JSONObject jsonObject) {
    if (jsonObject == null) {
      return null;
    }
    return jsonObject.toString();
  }


  @TypeConverter
  public static UUID bytesToUuid(byte[] bytes) {
    ByteBuffer bb = ByteBuffer.wrap(bytes);
    long firstLong = bb.getLong();
    long secondLong = bb.getLong();
    return new UUID(firstLong, secondLong);
  }

  @TypeConverter
  public static byte[] uuidToBytes(UUID uuid) {
    ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
    bb.putLong(uuid.getMostSignificantBits());
    bb.putLong(uuid.getLeastSignificantBits());
    return bb.array();
  }


  @TypeConverter
  public static UpdateStatus intToStatus(int value) {
    switch (value) {
      case 0:
        return UpdateStatus.FAILED;
      case 1:
        return UpdateStatus.READY;
      case 2:
        return UpdateStatus.LAUNCHABLE;
      case 3:
        return UpdateStatus.PENDING;
      case 5:
        return UpdateStatus.EMBEDDED;
      case 4:
      default:
        return UpdateStatus.UNUSED;
    }
  }

  @TypeConverter
  public static int statusToInt(UpdateStatus status) {
    switch (status) {
      case FAILED:
        return 0;
      case READY:
        return 1;
      case LAUNCHABLE:
        return 2;
      case PENDING:
        return 3;
      case EMBEDDED:
        return 5;
      case UNUSED:
      default:
        return 4;
    }
  }


  @TypeConverter
  public static HashType intToHashType(int value) {
    return HashType.SHA256; // only one hash type for now, SHA256 = 0
  }

  @TypeConverter
  public static int hashTypeToInt(HashType hashType) {
    return 0; // only one hash type for now, SHA256 = 0
  }
}
