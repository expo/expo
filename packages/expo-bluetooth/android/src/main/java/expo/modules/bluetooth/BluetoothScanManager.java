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

public class BluetoothScanManager {

  public boolean isScanning() {
    return mScanCallback != null;
  }

  private BluetoothAdapter mAdapter;

  private boolean mOnlyConnectableDevices = false;
  private PeripheralScanningDelegate mDelegate;
  private ScanCallback mScanCallback;

  private ScanCallback getScanCallback() {
    if (mScanCallback != null) {
      return mScanCallback;
    }
    mScanCallback = new ScanCallback() {
      @Override
      public void onScanResult(int callbackType, ScanResult result) {
        super.onScanResult(callbackType, result);
        sendScanResult(result);
      }

      @Override
      public void onBatchScanResults(List<ScanResult> results) {
        super.onBatchScanResults(results);
        for (ScanResult result : results) {
          sendScanResult(result);
        }
      }

      @Override
      public void onScanFailed(int errorCode) {
        super.onScanFailed(errorCode);
        completelyStopScanner(errorCode);
      }
    };
    return mScanCallback;
  }

  private void completelyStopScanner(int errorCode) {
    /** Scanning seems to start when the instance is created. */

    if (mScanCallback != null ) {
      mAdapter.getBluetoothLeScanner().stopScan(mScanCallback);
      mScanCallback = null;
    }

    if (mDelegate != null) {
      mDelegate.onStopScanningWithError(BluetoothError.fromScanCallbackErrorCode(errorCode));
    }
  }



  public BluetoothScanManager(PeripheralScanningDelegate delegate, BluetoothAdapter adapter) {
    mDelegate = delegate;
    mAdapter = adapter;
  }

  private void sendScanResult(final ScanResult result) {
    if (mOnlyConnectableDevices && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !result.isConnectable()) {
      return;
    }
    if (mDelegate != null) {
      mDelegate.onPeripheralFound(result.getDevice(), result.getRssi(), result.getScanRecord());
    }
  }

  public void stopScan() {
    completelyStopScanner(0);
  }

  public void startScan(ArrayList serviceUUIDs, Map<String, Object> options) {
    mOnlyConnectableDevices = false;

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
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (options.containsKey("androidOnlyConnectable") && options.get("androidOnlyConnectable") != null) {
        mOnlyConnectableDevices = (boolean) options.get("androidOnlyConnectable");
      }
    }

    if (serviceUUIDs.size() > 0) {
      for (int i = 0; i < serviceUUIDs.size(); i++) {
        ScanFilter filter = new ScanFilter.Builder().setServiceUuid(new ParcelUuid(UUIDHelper.toUUID((String) serviceUUIDs.get(i)))).build();
        filters.add(filter);
      }
    }

    mAdapter.getBluetoothLeScanner().startScan(filters, scanSettingsBuilder.build(), getScanCallback());

    if (mDelegate != null) {
      mDelegate.onStartScanning();
    }
  }
}