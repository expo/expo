package expo.modules.bluetooth;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.util.Log;

public class BLEManager {

  private final Context mContext;

  private BluetoothAdapter mBluetoothAdapter;

  private BluetoothManager mBluetoothManager;

  private BLEManager(Context context) {
    mContext = context;
  }

  public boolean initialize() {

    // For API level 18 and above, get a reference to BluetoothAdapter
    // through BluetoothManager.
    if (mBluetoothManager == null) {
      mBluetoothManager = (BluetoothManager) mContext
          .getSystemService(Context.BLUETOOTH_SERVICE);
      if (mBluetoothManager == null) {
        return false;
      }
    }

    if (mBluetoothAdapter == null) {
      mBluetoothAdapter = mBluetoothManager.getAdapter();
      if (mBluetoothAdapter == null) {
        return false;
      }
    }

    return mBluetoothAdapter.isEnabled() || mBluetoothAdapter.enable();
  }
}
