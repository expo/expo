package expo.modules.bluetooth.objects;

import android.os.Bundle;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import expo.modules.bluetooth.BluetoothConstants;

public class EXBluetoothObject implements EXBluetoothObjectInterface {

  protected EXBluetoothObject mParent;
  protected Object mNativeData;
  public EXBluetoothObject(Object nativeData, Object parent) {
    mNativeData = nativeData;
    if (parent != null && parent instanceof EXBluetoothObject) {
      mParent = (EXBluetoothObject) parent;
    }
  }

  public static ArrayList<Bundle> listToJSON(List<EXBluetoothObject> input) {
    if (input == null) return null;

    ArrayList<Bundle> output = new ArrayList();
    for (EXBluetoothObject value : input) {
      output.add(value.toJSON());
    }
    return output;
  }

  @Override
  public String getID() {
    // TODO: Assert override
    return null;
  }

  @Override
  public UUID getUUID() {
    return null;
  }

  @Override
  public Bundle toJSON() {
    Bundle output = new Bundle();
    output.putString(BluetoothConstants.JSON.ID, getID());
    return output;
  }

  public Object getNativeData() {
    return mNativeData;
  }

  @Override
  public EXBluetoothObject getParent() {
    return mParent;
  }

  @Override
  public Peripheral getPeripheral() {
    return null;
  }

  @Override
  public String transactionIdForOperation(String operation) {
    return operation + "|" + getID();
  }
}
