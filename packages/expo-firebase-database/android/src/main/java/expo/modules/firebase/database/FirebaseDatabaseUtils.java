package expo.modules.firebase.database;

import android.os.Bundle;
import android.os.Parcelable;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.MutableData;

import java.util.ArrayList;
import java.util.List;

import expo.modules.firebase.app.Utils;

public class FirebaseDatabaseUtils {
  private static final String TAG = FirebaseDatabaseUtils.class.getCanonicalName();;

  /**
   * @param dataSnapshot
   * @param previousChildName
   * @return
   */
  public static Bundle snapshotToMap(DataSnapshot dataSnapshot, @Nullable String previousChildName) {
    Bundle result = new Bundle();
    Bundle snapshot = snapshotToMap(dataSnapshot);

    result.putBundle("snapshot", snapshot);
    result.putString("previousChildName", previousChildName);
    return result;
  }

  /**
   * @param dataSnapshot
   * @return
   */
  public static Bundle snapshotToMap(DataSnapshot dataSnapshot) {
    Bundle snapshot = new Bundle();

    snapshot.putString("key", dataSnapshot.getKey());
    snapshot.putBoolean("exists", dataSnapshot.exists());
    snapshot.putBoolean("hasChildren", dataSnapshot.hasChildren());
    snapshot.putDouble("childrenCount", dataSnapshot.getChildrenCount());
    snapshot.putStringArrayList("childKeys", getChildKeys(dataSnapshot));
    Utils.mapPutValue("priority", dataSnapshot.getPriority(), snapshot);

    if (!dataSnapshot.hasChildren()) {
      Utils.mapPutValue("value", dataSnapshot.getValue(), snapshot);
    } else {
      Object value = castValue(dataSnapshot);
      if (value instanceof ArrayList) {
        snapshot.putParcelableArrayList("value", (ArrayList<? extends Parcelable>) value);
      } else {
        snapshot.putBundle("value", (Bundle) value);
      }
    }

    return snapshot;
  }

  /**
   * @param snapshot
   * @param <Any>
   * @return
   */
  public static <Any> Any castValue(DataSnapshot snapshot) {
    if (snapshot.hasChildren()) {
      if (isArray(snapshot)) {
        return (Any) buildArray(snapshot);
      } else {
        return (Any) buildMap(snapshot);
      }
    } else {
      if (snapshot.getValue() != null) {
        String type = snapshot.getValue().getClass().getName();
        switch (type) {
          case "java.lang.Boolean":
          case "java.lang.Long":
          case "java.lang.Double":
          case "java.lang.String":
            return (Any) (snapshot.getValue());
          default:
            Log.w(TAG, "Invalid type: " + type);
            return null;
        }
      }
      return null;
    }
  }

  /**
   * @param mutableData
   * @param <Any>
   * @return
   */
  public static <Any> Any castValue(MutableData mutableData) {
    if (mutableData.hasChildren()) {
      if (isArray(mutableData)) {
        return (Any) buildArray(mutableData);
      } else {
        return (Any) buildMap(mutableData);
      }
    } else {
      if (mutableData.getValue() != null) {
        String type = mutableData.getValue().getClass().getName();
        switch (type) {
          case "java.lang.Boolean":
          case "java.lang.Long":
          case "java.lang.Double":
          case "java.lang.String":
            return (Any) (mutableData.getValue());
          default:
            Log.w(TAG, "Invalid type: " + type);
            return null;
        }
      }
      return null;
    }
  }

  /**
   * Data should be treated as an array if:
   * 1) All the keys are integers
   * 2) More than half the keys between 0 and the maximum key in the object have non-empty values
   * <p>
   * Definition from: https://firebase.googleblog.com/2014/04/best-practices-arrays-in-firebase.html
   *
   * @param snapshot
   * @return
   */
  private static boolean isArray(DataSnapshot snapshot) {
    long expectedKey = -1;
    long maxAllowedKey = (snapshot.getChildrenCount() * 2) - 1;
    for (DataSnapshot child : snapshot.getChildren()) {
      try {
        long key = Long.parseLong(child.getKey());
        if (key > expectedKey && key <= maxAllowedKey) {
          expectedKey = key;
        } else {
          return false;
        }
      } catch (NumberFormatException ex) {
        return false;
      }
    }
    return true;
  }

  /**
   * Data should be treated as an array if:
   * 1) All the keys are integers
   * 2) More than half the keys between 0 and the maximum key in the object have non-empty values
   * <p>
   * Definition from: https://firebase.googleblog.com/2014/04/best-practices-arrays-in-firebase.html
   *
   * @param mutableData
   * @return
   */
  private static boolean isArray(MutableData mutableData) {
    long expectedKey = -1;
    long maxAllowedKey = (mutableData.getChildrenCount() * 2) - 1;
    for (MutableData child : mutableData.getChildren()) {
      try {
        long key = Long.parseLong(child.getKey());
        if (key > expectedKey && key <= maxAllowedKey) {
          expectedKey++;
        } else {
          return false;
        }
      } catch (NumberFormatException ex) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param snapshot
   * @param <Any>
   * @return
   */
  private static <Any> List buildArray(DataSnapshot snapshot) {
    long expectedKey = 0;
    List array = new ArrayList();
    for (DataSnapshot child : snapshot.getChildren()) {
      long key = Long.parseLong(child.getKey());
      if (key > expectedKey) {
        for (long i = expectedKey; i < key; i++) {
          array.add(null);
        }
        expectedKey = key;
      }
      Any castedChild = castValue(child);
      switch (castedChild.getClass().getName()) {
        case "java.lang.Boolean":
          array.add((Boolean) castedChild);
          break;
        case "java.lang.Long":
          Long longVal = (Long) castedChild;
          array.add((double) longVal);
          break;
        case "java.lang.Double":
          array.add((Double) castedChild);
          break;
        case "java.lang.String":
          array.add((String) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeMap":
          array.add(castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeArray":
          array.add(castedChild);
          break;
        default:
          Log.w(TAG, "Invalid type: " + castedChild.getClass().getName());
          break;
      }
      expectedKey++;
    }
    return array;
  }

  /**
   * @param mutableData
   * @param <Any>
   * @return
   */
  private static <Any> ArrayList buildArray(MutableData mutableData) {
    long expectedKey = 0;
    ArrayList array = new ArrayList();
    for (MutableData child : mutableData.getChildren()) {
      long key = Long.parseLong(child.getKey());
      if (key > expectedKey) {
        for (long i = expectedKey; i < key; i++) {
          array.add(null);
        }
        expectedKey = key;
      }
      Any castedChild = castValue(child);
      switch (castedChild.getClass().getName()) {
        case "java.lang.Boolean":
          array.add((Boolean) castedChild);
          break;
        case "java.lang.Long":
          Long longVal = (Long) castedChild;
          array.add((double) longVal);
          break;
        case "java.lang.Double":
          array.add((Double) castedChild);
          break;
        case "java.lang.String":
          array.add((String) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeMap":
          array.add(castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeArray":
          array.add(castedChild);
          break;
        default:
          Log.w(TAG, "Invalid type: " + castedChild.getClass().getName());
          break;
      }
      expectedKey++;
    }
    return array;
  }

  /**
   * @param snapshot
   * @param <Any>
   * @return
   */
  private static <Any> Bundle buildMap(DataSnapshot snapshot) {
    Bundle map = new Bundle();
    for (DataSnapshot child : snapshot.getChildren()) {
      Any castedChild = castValue(child);

      switch (castedChild.getClass().getName()) {
        case "java.lang.Boolean":
          map.putBoolean(child.getKey(), (Boolean) castedChild);
          break;
        case "java.lang.Long":
          map.putDouble(child.getKey(), (double) ((Long) castedChild));
          break;
        case "java.lang.Double":
          map.putDouble(child.getKey(), (Double) castedChild);
          break;
        case "java.lang.String":
          map.putString(child.getKey(), (String) castedChild);
          break;  
        case "android.os.Bundle":
          map.putBundle(child.getKey(), (Bundle) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeMap":
          map.putBundle(child.getKey(), (Bundle) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeArray":
          map.putParcelableArrayList(child.getKey(), (ArrayList<? extends Parcelable>) castedChild);
          break;
        default:
          Log.w(TAG, "Invalid type: " + castedChild.getClass().getName());
          break;
      }
    }
    return map;
  }

  /**
   * @param mutableData
   * @param <Any>
   * @return
   */
  private static <Any> Bundle buildMap(MutableData mutableData) {
    Bundle map = new Bundle();
    for (MutableData child : mutableData.getChildren()) {
      Any castedChild = castValue(child);

      switch (castedChild.getClass().getName()) {
        case "java.lang.Boolean":
          map.putBoolean(child.getKey(), (Boolean) castedChild);
          break;
        case "java.lang.Long":
          map.putDouble(child.getKey(), (double) ((Long) castedChild));
          break;
        case "java.lang.Double":
          map.putDouble(child.getKey(), (Double) castedChild);
          break;
        case "java.lang.String":
          map.putString(child.getKey(), (String) castedChild);
          break;
        case "android.os.Bundle":
          map.putBundle(child.getKey(), (Bundle) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeMap":
          map.putBundle(child.getKey(), (Bundle) castedChild);
          break;
        case "com.facebook.react.bridge.WritableNativeArray":
          map.putParcelableArrayList(child.getKey(), (ArrayList<? extends Parcelable>) castedChild);
          break;
        default:
          Log.w(TAG, "Invalid type: " + castedChild.getClass().getName());
          break;
      }
    }
    return map;
  }

  /**
   * @param snapshot
   * @return
   */
  public static ArrayList<String> getChildKeys(DataSnapshot snapshot) {
    ArrayList<String> childKeys = new ArrayList();

    if (snapshot.hasChildren()) {
      for (DataSnapshot child : snapshot.getChildren()) {
        childKeys.add(child.getKey());
      }
    }

    return childKeys;
  }

}
