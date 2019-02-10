package expo.modules.bluetooth;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelUuid;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.services.UIManager;
import expo.modules.bluetooth.helpers.UUIDHelper;
import expo.modules.bluetooth.objects.Peripheral;

interface PeripheralScanningDelegate {
  void onPeripheralFound(BluetoothDevice device, int RSSI, ScanRecord scanRecord);

  void onPeripheralScanningError(BluetoothError error);
}

public class BluetoothScanManager {

  protected BluetoothAdapter adapter;
  protected ModuleRegistry moduleRegistry;
  protected boolean isScanning = false;
  PeripheralScanningDelegate mDelegate;
  private ScanCallback mScanCallback = new ScanCallback() {
    @Override
    public void onScanResult(int callbackType, ScanResult result) {
      super.onScanResult(callbackType, result);
      if (!isScanning) {
        return;
      }
      sendScanResult(result);
    }

    @Override
    public void onBatchScanResults(List<ScanResult> results) {
      super.onBatchScanResults(results);
      if (!isScanning) {
        return;
      }
      for (ScanResult result : results) {
        sendScanResult(result);
      }
    }

    @Override
    public void onScanFailed(int errorCode) {
      super.onScanFailed(errorCode);
      isScanning = false;

      BluetoothError error = BluetoothError.fromScanCallbackErrorCode(errorCode);

      if (mDelegate != null) {
        mDelegate.onPeripheralScanningError(error);
      }
    }
  };

  public BluetoothScanManager(BluetoothAdapter adapter, ModuleRegistry moduleRegistry, PeripheralScanningDelegate delegate) {
    this.adapter = adapter;
    this.moduleRegistry = moduleRegistry;
    mDelegate = delegate;
  }

  private void sendScanResult(final ScanResult result) {
    if (mDelegate != null) {
      mDelegate.onPeripheralFound(result.getDevice(), result.getRssi(), result.getScanRecord());
    }
  }

  public void stopScan() {
    isScanning = false;
    adapter.getBluetoothLeScanner().stopScan(mScanCallback);
  }

  public void scan(ArrayList serviceUUIDs, Map<String, Object> options) {
    ScanSettings.Builder scanSettingsBuilder = new ScanSettings.Builder();
    List<ScanFilter> filters = new ArrayList<>();

    if (options.containsKey("androidScanMode") && options.get("androidScanMode") != null) {
      String scanModeString = (String) options.get("androidScanMode");
      int scanMode = Serialize.ScanMode_JSONToNative(scanModeString);
      scanSettingsBuilder.setScanMode(scanMode);
    }

    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP_MR1) {
      if (options.containsKey("androidNumberOfMatches") && options.get("androidNumberOfMatches") != null) {
        scanSettingsBuilder.setNumOfMatches(((Number) options.get("androidNumberOfMatches")).intValue());
      }
      if (options.containsKey("androidMatchMode") && options.get("androidMatchMode") != null) {
        scanSettingsBuilder.setMatchMode(((Number) options.get("androidMatchMode")).intValue());
      }
    }

    if (serviceUUIDs.size() > 0) {
      for (int i = 0; i < serviceUUIDs.size(); i++) {
        ScanFilter filter = new ScanFilter.Builder().setServiceUuid(new ParcelUuid(UUIDHelper.toUUID((String) serviceUUIDs.get(i)))).build();
        filters.add(filter);
      }
    }

    isScanning = true;
    adapter
        .getBluetoothLeScanner()
        .startScan(
            filters,
            scanSettingsBuilder.build(),
            mScanCallback);
  }
}