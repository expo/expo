package expo.modules.bluetooth.objects;

import java.util.HashMap;

public interface EXBluetoothParentObjectInterface {
  EXBluetoothChildObject getChild(String uuid);

  HashMap<String, EXBluetoothChildObject> getChildren();

  void clearChildren();
}