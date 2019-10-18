package expo.modules.notifications.helpers;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

public class HashMapSerializer {

  public static String serialize(HashMap<String, Object> map) {
    try {
      ByteArrayOutputStream bo = new ByteArrayOutputStream();
      ObjectOutputStream so = new ObjectOutputStream(bo);
      so.writeObject(map);
      so.flush();
      String serialized = bo.toString("ISO-8859-1");
      return  serialized;
    } catch (IOException e) {
      e.printStackTrace();
    }

    return null;
  }

  public static HashMap<String, Object> deserialize(String serializedMap) {
    JSONObject serialized = null;
    try {
      byte b[] = serializedMap.getBytes("ISO-8859-1");
      ByteArrayInputStream bi = new ByteArrayInputStream(b);
      ObjectInputStream si = new ObjectInputStream(bi);
      HashMap<String, Object> map = (HashMap<String, Object>) si.readObject();
      return map;
    } catch (IOException | ClassNotFoundException e) {
      e.printStackTrace();
    }
    return null;
  }
}