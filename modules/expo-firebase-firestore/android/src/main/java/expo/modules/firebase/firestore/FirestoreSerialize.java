package expo.modules.firebase.firestore;

import android.os.Bundle;
import android.os.Parcelable;
import android.util.Base64;
import android.util.Log;

import com.google.firebase.firestore.Blob;
import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldPath;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.GeoPoint;
import com.google.firebase.firestore.QuerySnapshot;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class FirestoreSerialize {
  private static final String TAG = FirestoreSerialize.class.getCanonicalName();
  private static final String KEY_CHANGES = "changes";
  private static final String KEY_DATA = "data";
  private static final String KEY_DOC_CHANGE_DOCUMENT = "document";
  private static final String KEY_DOC_CHANGE_NEW_INDEX = "newIndex";
  private static final String KEY_DOC_CHANGE_OLD_INDEX = "oldIndex";
  private static final String KEY_DOC_CHANGE_TYPE = "type";
  private static final String KEY_DOCUMENTS = "documents";
  private static final String KEY_METADATA = "metadata";
  private static final String KEY_PATH = "path";

  /**
   * Convert a DocumentSnapshot instance into a Bundle
   *
   * @param documentSnapshot DocumentSnapshot
   * @return Bundle
   */
  static Bundle documentSnapshotToBundle(DocumentSnapshot documentSnapshot) {
    Bundle documentMap = new Bundle();

    documentMap.putString(KEY_PATH, documentSnapshot.getReference().getPath());
    if (documentSnapshot.exists()) {
      documentMap.putBundle(KEY_DATA, objectMapToBundle(documentSnapshot.getData()));
    }
    // metadata
    if (documentSnapshot.getMetadata() != null) {
      Bundle metadata = new Bundle();
      metadata.putBoolean("fromCache", documentSnapshot.getMetadata().isFromCache());
      metadata.putBoolean("hasPendingWrites", documentSnapshot.getMetadata().hasPendingWrites());
      documentMap.putBundle(KEY_METADATA, metadata);
    }

    return documentMap;
  }

  public static Bundle querySnapshotToBundle(QuerySnapshot querySnapshot) {
    Bundle queryMap = new Bundle();

    List<DocumentChange> documentChanges = querySnapshot.getDocumentChanges();
    queryMap.putParcelableArrayList(KEY_CHANGES, documentChangesToList(documentChanges));

    // documents
    ArrayList documents = new ArrayList();
    List<DocumentSnapshot> documentSnapshots = querySnapshot.getDocuments();
    for (DocumentSnapshot documentSnapshot : documentSnapshots) {
      documents.add(documentSnapshotToBundle(documentSnapshot));
    }
    queryMap.putParcelableArrayList(KEY_DOCUMENTS, documents);

    // metadata
    if (querySnapshot.getMetadata() != null) {
      Bundle metadata = new Bundle();
      metadata.putBoolean("fromCache", querySnapshot.getMetadata().isFromCache());
      metadata.putBoolean("hasPendingWrites", querySnapshot.getMetadata().hasPendingWrites());
      queryMap.putBundle(KEY_METADATA, metadata);
    }

    return queryMap;
  }

  /**
   * Convert a List of DocumentChange instances into a ArrayList
   *
   * @param documentChanges List<DocumentChange>
   * @return ArrayList
   */
  static ArrayList documentChangesToList(List<DocumentChange> documentChanges) {
    ArrayList documentChangesWritable = new ArrayList();
    for (DocumentChange documentChange : documentChanges) {
      documentChangesWritable.add(documentChangeToBundle(documentChange));
    }
    return documentChangesWritable;
  }

  /**
   * Convert a DocumentChange instance into a Bundle
   *
   * @param documentChange DocumentChange
   * @return Bundle
   */
  static Bundle documentChangeToBundle(DocumentChange documentChange) {
    Bundle documentChangeMap = new Bundle();

    switch (documentChange.getType()) {
      case ADDED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, "added");
        break;
      case REMOVED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, "removed");
        break;
      case MODIFIED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, "modified");
    }

    documentChangeMap.putBundle(KEY_DOC_CHANGE_DOCUMENT,
      documentSnapshotToBundle(documentChange.getDocument()));
    documentChangeMap.putInt(KEY_DOC_CHANGE_NEW_INDEX, documentChange.getNewIndex());
    documentChangeMap.putInt(KEY_DOC_CHANGE_OLD_INDEX, documentChange.getOldIndex());

    return documentChangeMap;
  }

  /**
   * Converts an Object Map into a Bundle.
   *
   * @param map Map<String, Object>
   * @return Bundle
   */
  static Bundle objectMapToBundle(Map<String, Object> map) {
    Bundle writableMap = new Bundle();
    for (Map.Entry<String, Object> entry : map.entrySet()) {
      Bundle typeMap = buildTypeMap(entry.getValue());
      writableMap.putBundle(entry.getKey(), typeMap);
    }
    return writableMap;
  }

  /**
   * Converts an Object array into a List.
   *
   * @param array Object[]
   * @return List
   */
  private static List<Bundle> objectArrayToList(Object[] array) {
    List<Bundle> writableArray = new ArrayList();

    for (Object item : array) {
      Bundle typeMap = buildTypeMap(item);
      writableArray.add(typeMap);
    }

    return writableArray;
  }

  /**
   * Detects an objects type and creates a Map to represent the type and value.
   *
   * @param value Object
   */
  private static Bundle buildTypeMap(Object value) {
    Bundle typeMap = new Bundle();
    if (value == null) {
      typeMap.putString("type", "null");
      typeMap.remove("value");
    } else {
      if (value instanceof Boolean) {
        typeMap.putString("type", "boolean");
        typeMap.putBoolean("value", (Boolean) value);
      } else if (value instanceof Integer) {
        typeMap.putString("type", "number");
        typeMap.putDouble("value", ((Integer) value).doubleValue());
      } else if (value instanceof Long) {
        typeMap.putString("type", "number");
        typeMap.putDouble("value", ((Long) value).doubleValue());
      } else if (value instanceof Double) {
        typeMap.putString("type", "number");
        typeMap.putDouble("value", (Double) value);
      } else if (value instanceof Float) {
        typeMap.putString("type", "number");
        typeMap.putDouble("value", ((Float) value).doubleValue());
      } else if (value instanceof String) {
        typeMap.putString("type", "string");
        typeMap.putString("value", (String) value);
      } else if (Map.class.isAssignableFrom(value.getClass())) {
        typeMap.putString("type", "object");
        typeMap.putBundle("value", objectMapToBundle((Map<String, Object>) value));
      } else if (List.class.isAssignableFrom(value.getClass())) {
        typeMap.putString("type", "array");
        List<Object> list = (List<Object>) value;
        Object[] array = list.toArray(new Object[list.size()]);
        typeMap.putParcelableArrayList("value", (ArrayList<? extends Parcelable>) objectArrayToList(array));
      } else if (value instanceof DocumentReference) {
        typeMap.putString("type", "reference");
        typeMap.putString("value", ((DocumentReference) value).getPath());
      } else if (value instanceof GeoPoint) {
        typeMap.putString("type", "geopoint");
        Bundle geoPoint = new Bundle();
        geoPoint.putDouble("latitude", ((GeoPoint) value).getLatitude());
        geoPoint.putDouble("longitude", ((GeoPoint) value).getLongitude());
        typeMap.putBundle("value", geoPoint);
      } else if (value instanceof Date) {
        typeMap.putString("type", "date");
        typeMap.putDouble("value", ((Date) value).getTime());
      } else if (value instanceof Blob) {
        typeMap.putString("type", "blob");
        typeMap.putString("value", Base64.encodeToString(((Blob) value).toBytes(), Base64.NO_WRAP));
      } else {
        Log.e(TAG, "buildTypeMap: Cannot convert object of type " + value.getClass());
        typeMap.putString("type", "null");
        typeMap.remove("value");
      }
    }

    return typeMap;
  }

  static Map<String, Object> parseReadableMap(FirebaseFirestore firestore, Map<String, Object> readableMap) {
    Map<String, Object> map = new HashMap<>();
    if (readableMap != null) {
      Set<String> iterator = readableMap.keySet();
      for (String key : iterator) {
        map.put(key, parseTypeMap(firestore, (Map<String, Object>) readableMap.get(key)));
      }
    }
    return map;
  }

  static List<Object> parseReadableArray(FirebaseFirestore firestore, List readableArray) {
    List<Object> list = new ArrayList<>();
    if (readableArray != null) {
      for (int i = 0; i < readableArray.size(); i++) {
        list.add(parseTypeMap(firestore, (Map<String, Object>) readableArray.get(i)));
      }
    }
    return list;
  }

  static Object parseTypeMap(FirebaseFirestore firestore, Map<String, Object> typeMap) {
    String type = (String) typeMap.get("type");
    if ("boolean".equals(type)) {
      return typeMap.get("value");
    } else if ("number".equals(type)) {
      return typeMap.get("value");
    } else if ("string".equals(type)) {
      return typeMap.get("value");
    } else if ("null".equals(type)) {
      return null;
    } else if ("array".equals(type)) {
      return parseReadableArray(firestore, (List) typeMap.get("value"));
    } else if ("object".equals(type)) {
      return parseReadableMap(firestore, (Map<String, Object>) typeMap.get("value"));
    } else if ("reference".equals(type)) {
      String path = (String) typeMap.get("value");
      return firestore.document(path);
    } else if ("geopoint".equals(type)) {
      Map<String, Object> geoPoint = (Map<String, Object>) typeMap.get("value");
      return new GeoPoint((double)geoPoint.get("latitude"), (double)geoPoint.get("longitude"));
    } else if ("blob".equals(type)) {
      String base64String = (String) typeMap.get("value");
      return Blob.fromBytes(Base64.decode(base64String, Base64.NO_WRAP));
    } else if ("date".equals(type)) {
      Double time = (Double) typeMap.get("value");
      return new Date(time.longValue());
    } else if ("documentid".equals(type)) {
      return FieldPath.documentId();
    } else if ("fieldvalue".equals(type)) {
      String value = (String) typeMap.get("value");
      if ("delete".equals(value)) {
        return FieldValue.delete();
      } else if ("timestamp".equals(value)) {
        return FieldValue.serverTimestamp();
      } else {
        Log.e(TAG, "parseTypeMap: Invalid fieldvalue: " + value);
        return null;
      }
    } else {
      Log.e(TAG, "parseTypeMap: Cannot convert object of type " + type);
      return null;
    }
  }

  public static List<Object> parseDocumentBatches(FirebaseFirestore firestore, List readableArray) {
    List<Object> writes = new ArrayList<>(readableArray.size());
    for (int i = 0; i < readableArray.size(); i++) {
      Map<String, Object> write = new HashMap<>();
      Map<String, Object> map = (Map<String, Object>) readableArray.get(i);
      if (map.containsKey("data")) {
        write.put("data", parseReadableMap(firestore, (Map<String, Object>) map.get("data")));
      }
      if (map.containsKey("options")) {
        write.put("options", map.get("options"));
      }
      write.put("path", map.get("path"));
      write.put("type", map.get("type"));

      writes.add(write);
    }
    return writes;
  }
}
