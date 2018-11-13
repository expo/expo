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
 
   // Keys
   private static final String TYPE = "type";
   private static final String VALUE = "value";
   private static final String KEY_DATA = "data";
   private static final String KEY_PATH = "path";
   private static final String KEY_META = "metadata";
   private static final String KEY_CHANGES = "changes";
   private static final String KEY_OPTIONS = "options";
   private static final String KEY_LATITUDE = "latitude";
   private static final String KEY_LONGITUDE = "longitude";
   private static final String KEY_DOCUMENTS = "documents";
   private static final String KEY_DOC_CHANGE_TYPE = "type";
   private static final String KEY_META_FROM_CACHE = "fromCache";
   private static final String KEY_DOC_CHANGE_DOCUMENT = "document";
   private static final String KEY_DOC_CHANGE_NEW_INDEX = "newIndex";
   private static final String KEY_DOC_CHANGE_OLD_INDEX = "oldIndex";
   private static final String KEY_META_HAS_PENDING_WRITES = "hasPendingWrites";
 
   // Types
   private static final String TYPE_NAN = "nan";
   private static final String TYPE_NULL = "null";
   private static final String TYPE_BLOB = "blob";
   private static final String TYPE_DATE = "date";
   private static final String TYPE_ARRAY = "array";
   private static final String TYPE_STRING = "string";
   private static final String TYPE_NUMBER = "number";
   private static final String TYPE_OBJECT = "object";
   private static final String TYPE_BOOLEAN = "boolean";
   private static final String TYPE_GEOPOINT = "geopoint";
   private static final String TYPE_INFINITY = "infinity";
   private static final String TYPE_REFERENCE = "reference";
   private static final String TYPE_DOCUMENTID = "documentid";
   private static final String TYPE_FIELDVALUE = "fieldvalue";
   private static final String TYPE_FIELDVALUE_DELETE = "delete";
   private static final String TYPE_FIELDVALUE_TIMESTAMP = "timestamp";
   private static final String TYPE_FIELDVALUE_UNION = "union";
   private static final String TYPE_FIELDVALUE_REMOVE = "remove";
   private static final String TYPE_FIELDVALUE_TYPE = "type";
   private static final String TYPE_FIELDVALUE_ELEMENTS = "elements";
 
   // Document Change Types
   private static final String CHANGE_ADDED = "added";
   private static final String CHANGE_MODIFIED = "modified";
   private static final String CHANGE_REMOVED = "removed";

  /**
   * Convert a DocumentSnapshot instance into a Bundle
   *
   * @param documentSnapshot DocumentSnapshot
   * @return Bundle
   */
  static Bundle documentSnapshotToBundle(DocumentSnapshot documentSnapshot) {
    Bundle metadata = new Bundle();
    Bundle documentMap = new Bundle();
    SnapshotMetadata snapshotMetadata = documentSnapshot.getMetadata();
    
    // build metadata
    metadata.putBoolean(KEY_META_FROM_CACHE, snapshotMetadata.isFromCache());
    metadata.putBoolean(KEY_META_HAS_PENDING_WRITES, snapshotMetadata.hasPendingWrites());
    documentMap.putMap(KEY_META, metadata);
    documentMap.putString(KEY_PATH, documentSnapshot.getReference().getPath());
    if (documentSnapshot.exists()) {
      documentMap.putBundle(KEY_DATA, objectMapToBundle(documentSnapshot.getData()));
    }
    return documentMap;
  }

    /**
   * Convert a Firestore QuerySnapshot instance to a RN serializable WritableMap type map
   *
   * @param querySnapshot QuerySnapshot
   * @return WritableMap
   */
  static WritableMap snapshotToBundle(QuerySnapshot querySnapshot) {
    WritableMap metadata = Arguments.createMap();
    WritableMap writableMap = Arguments.createMap();
    WritableArray documents = Arguments.createArray();

    SnapshotMetadata snapshotMetadata = querySnapshot.getMetadata();
    List<DocumentSnapshot> documentSnapshots = querySnapshot.getDocuments();
    List<DocumentChange> documentChanges = querySnapshot.getDocumentChanges();

    // convert documents documents
    for (DocumentSnapshot documentSnapshot : documentSnapshots) {
      documents.pushMap(snapshotToWritableMap(documentSnapshot));
    }

    // build metadata
    metadata.putBoolean(KEY_META_FROM_CACHE, snapshotMetadata.isFromCache());
    metadata.putBoolean(KEY_META_HAS_PENDING_WRITES, snapshotMetadata.hasPendingWrites());

    // set metadata
    writableMap.putMap(KEY_META, metadata);

    // set documents
    writableMap.putArray(KEY_DOCUMENTS, documents);

    // set document changes
    writableMap.putArray(
      KEY_CHANGES,
      documentChangesToWritableArray(documentChanges)
    );

    return writableMap;
  }

  /**
   * Convert a List of DocumentChange instances into a React Native WritableArray
   *
   * @param documentChanges List<DocumentChange>
   * @return WritableArray
   */
  private static WritableArray documentChangesToWritableArray(List<DocumentChange> documentChanges) {
    WritableArray documentChangesWritable = Arguments.createArray();

    for (DocumentChange documentChange : documentChanges) {
      documentChangesWritable.pushMap(documentChangeToWritableMap(documentChange));
    }

    return documentChangesWritable;
  }


  /**
   * Convert a DocumentChange instance into a React Native WritableMap
   *
   * @param documentChange DocumentChange
   * @return WritableMap
   */
  private static WritableMap documentChangeToWritableMap(DocumentChange documentChange) {
    WritableMap documentChangeMap = Arguments.createMap();

    switch (documentChange.getType()) {
      case ADDED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_ADDED);
        break;
      case MODIFIED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_MODIFIED);
        break;
      case REMOVED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_REMOVED);
        break;
    }

    documentChangeMap.putMap(
      KEY_DOC_CHANGE_DOCUMENT,
      snapshotToWritableMap(documentChange.getDocument())
    );

    documentChangeMap.putInt(KEY_DOC_CHANGE_NEW_INDEX, documentChange.getNewIndex());
    documentChangeMap.putInt(KEY_DOC_CHANGE_OLD_INDEX, documentChange.getOldIndex());

    return documentChangeMap;
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
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_ADDED);
        break;
      case MODIFIED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_MODIFIED);
        break;
      case REMOVED:
        documentChangeMap.putString(KEY_DOC_CHANGE_TYPE, CHANGE_REMOVED);
        break;
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
      typeMap.putString(TYPE, TYPE_NULL);
      typeMap.putNull(VALUE);
      return typeMap;
    }

    if (value instanceof Boolean) {
      typeMap.putString(TYPE, TYPE_BOOLEAN);
      typeMap.putBoolean(VALUE, (Boolean) value);
      return typeMap;
    }

    if (value instanceof Integer) {
      typeMap.putString(TYPE, TYPE_NUMBER);
      typeMap.putDouble(VALUE, ((Integer) value).doubleValue());
      return typeMap;
    }

    if (value instanceof Double) {
      Double doubleValue = (Double) value;

      if (Double.isInfinite(doubleValue)) {
        typeMap.putString(TYPE, TYPE_INFINITY);
        return typeMap;
      }

      if (Double.isNaN(doubleValue)) {
        typeMap.putString(TYPE, TYPE_NAN);
        return typeMap;
      }

      typeMap.putString(TYPE, TYPE_NUMBER);
      typeMap.putDouble(VALUE, doubleValue);
      return typeMap;
    }

    if (value instanceof Float) {
      typeMap.putString(TYPE, TYPE_NUMBER);
      typeMap.putDouble(VALUE, ((Float) value).doubleValue());
      return typeMap;
    }

    if (value instanceof Long) {
      typeMap.putString(TYPE, TYPE_NUMBER);
      typeMap.putDouble(VALUE, ((Long) value).doubleValue());
      return typeMap;
    }

    if (value instanceof String) {
      typeMap.putString(TYPE, TYPE_STRING);
      typeMap.putString(VALUE, (String) value);
      return typeMap;
    }

    if (value instanceof Date) {
      typeMap.putString(TYPE, TYPE_DATE);
      typeMap.putDouble(VALUE, ((Date) value).getTime());
      return typeMap;
    }

    if (Map.class.isAssignableFrom(value.getClass())) {
      typeMap.putString(TYPE, TYPE_OBJECT);
      typeMap.putMap(VALUE, objectMapToWritable((Map<String, Object>) value));
      return typeMap;
    }

    if (List.class.isAssignableFrom(value.getClass())) {
      typeMap.putString(TYPE, TYPE_ARRAY);
      List<Object> list = (List<Object>) value;
      Object[] array = list.toArray(new Object[list.size()]);
      typeMap.putArray(VALUE, objectArrayToWritable(array));
      return typeMap;
    }

    if (value instanceof DocumentReference) {
      typeMap.putString(TYPE, TYPE_REFERENCE);
      typeMap.putString(VALUE, ((DocumentReference) value).getPath());
      return typeMap;
    }

    if (value instanceof GeoPoint) {
      WritableMap geoPoint = Arguments.createMap();

      geoPoint.putDouble(KEY_LATITUDE, ((GeoPoint) value).getLatitude());
      geoPoint.putDouble(KEY_LONGITUDE, ((GeoPoint) value).getLongitude());

      typeMap.putMap(VALUE, geoPoint);
      typeMap.putString(TYPE, TYPE_GEOPOINT);

      return typeMap;
    }

    if (value instanceof Blob) {
      typeMap.putString(TYPE, TYPE_BLOB);
      typeMap.putString(VALUE, Base64.encodeToString(((Blob) value).toBytes(), Base64.NO_WRAP));
      return typeMap;
    }

    Log.w(TAG, "Unknown object of type " + value.getClass());
    typeMap.putString(TYPE, TYPE_NULL);
    typeMap.putNull(VALUE);
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

  static List<Object> parseReadableArray(
    FirebaseFirestore firestore, 
    List readableArray
    ) {
    List<Object> list = new ArrayList<>();
    if (readableArray != null) {
      for (int i = 0; i < readableArray.size(); i++) {
        list.add(parseTypeMap(firestore, (Map<String, Object>) readableArray.get(i)));
      }
    }
    return list;
  }

  static Object parseTypeMap(FirebaseFirestore firestore, Map<String, Object> typeMap) {
    String type = (String) typeMap.get(TYPE);

    if (TYPE_NULL.equals(type)) {
      return null;
    }

    if (TYPE_BOOLEAN.equals(type)) {
      return typeMap.getBoolean(VALUE);
    }

    if (TYPE_NAN.equals(type)) {
      return Double.NaN;
    }

    if (TYPE_NUMBER.equals(type)) {
      return typeMap.getDouble(VALUE);
    }

    if (TYPE_INFINITY.equals(type)) {
      return Double.POSITIVE_INFINITY;
    }

    if (TYPE_STRING.equals(type)) {
      return typeMap.getString(VALUE);
    }

    if (TYPE_ARRAY.equals(type)) {
      return parseReadableArray(firestore, (List)typeMap.get(VALUE));
    }

    if (TYPE_OBJECT.equals(type)) {
      return parseReadableMap(firestore, (Map<String, Object>) typeMap.get(VALUE));
    }

    if (TYPE_DATE.equals(type)) {
      Double time = typeMap.getDouble(VALUE);
      return new Date(time.longValue());
    }

    /* --------------------------
     *  Firestore Specific Types
     * -------------------------- */

    if (TYPE_DOCUMENTID.equals(type)) {
      return FieldPath.documentId();
    }

    if (TYPE_GEOPOINT.equals(type)) {
      ReadableMap geoPoint = typeMap.getMap(VALUE);
      return new GeoPoint(geoPoint.getDouble(KEY_LATITUDE), geoPoint.getDouble(KEY_LONGITUDE));
    }

    if (TYPE_BLOB.equals(type)) {
      String base64String = typeMap.getString(VALUE);
      return Blob.fromBytes(Base64.decode(base64String, Base64.NO_WRAP));
    }

    if (TYPE_REFERENCE.equals(type)) {
      String path = typeMap.getString(VALUE);
      return firestore.document(path);
    }

    if (TYPE_FIELDVALUE.equals(type)) {
      ReadableMap fieldValueMap = typeMap.getMap(VALUE);
      String fieldValueType = fieldValueMap.getString(TYPE_FIELDVALUE_TYPE);


      if (TYPE_FIELDVALUE_TIMESTAMP.equals(fieldValueType)) {
        return FieldValue.serverTimestamp();
      }

      if (TYPE_FIELDVALUE_DELETE.equals(fieldValueType)) {
        return FieldValue.delete();
      }

      if (TYPE_FIELDVALUE_UNION.equals(fieldValueType)) {
        ReadableArray elements = fieldValueMap.getArray(TYPE_FIELDVALUE_ELEMENTS);
        return FieldValue.arrayUnion(elements.toArrayList().toArray());
      }

      if (TYPE_FIELDVALUE_REMOVE.equals(fieldValueType)) {
        ReadableArray elements = fieldValueMap.getArray(TYPE_FIELDVALUE_ELEMENTS);
        return FieldValue.arrayRemove(elements.toArrayList().toArray());
      }

      Log.w(TAG, "Unknown FieldValue type: " + fieldValueType);
      return null;
    }

    Log.w(TAG, "Unknown object of type " + type);
    return null;
  }

  public static List<Object> parseDocumentBatches(FirebaseFirestore firestore, List readableArray) {
    List<Object> writes = new ArrayList<>(readableArray.size());
    for (int i = 0; i < readableArray.size(); i++) {
      Map<String, Object> write = new HashMap<>();
      Map<String, Object> map = (Map<String, Object>) readableArray.get(i);

      write.put(TYPE, map.get(TYPE));
      write.put(KEY_PATH, map.get(KEY_PATH));

      if (map.containsKey(KEY_DATA)) {
        write.put(KEY_DATA, parseReadableMap(firestore, (Map<String, Object>) map.get(KEY_DATA)));
      }
      if (map.containsKey(KEY_OPTIONS)) {
        write.put(KEY_OPTIONS, map.get(KEY_OPTIONS));
      }

      writes.add(write);
    }
    return writes;
  }
}
