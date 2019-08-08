package expo.modules.bluetooth;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.ScanRecord;

public interface PeripheralScanningDelegate {

  void onStartScanning();

  void onPeripheralFound(BluetoothDevice device, int RSSI, ScanRecord scanRecord);

  void onStopScanningWithError(BluetoothError error);
}