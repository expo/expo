package expo.modules.bluetooth;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
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

public class BluetoothScanManager {

  protected BluetoothAdapter adapter;
  protected ModuleRegistry moduleRegistry;
  protected AtomicInteger scanSessionId = new AtomicInteger();
  private ScanCallback mScanCallback;

  public BluetoothScanManager(BluetoothAdapter adapter, ModuleRegistry moduleRegistry, ScanCallback scanCallback) {
    this.adapter = adapter;
    this.moduleRegistry = moduleRegistry;
    this.mScanCallback = scanCallback;
  }

  public void stopScan() {
    // update scanSessionId to prevent stopping next scan by running timeout thread
    scanSessionId.incrementAndGet();

    adapter.getBluetoothLeScanner().stopScan(mScanCallback);
  }

  public void scan(ArrayList serviceUUIDs, final int timeout, Map<String, Object> options, Promise callback) {
    ScanSettings.Builder scanSettingsBuilder = new ScanSettings.Builder();
    List<ScanFilter> filters = new ArrayList<>();

    if (options.containsKey("scanMode") && options.get("scanMode") != null) {
      String scanModeString = (String) options.get("scanMode");
      int scanMode = Serialize.ScanMode_JSONToNative(scanModeString);
      scanSettingsBuilder.setScanMode(scanMode);
    }

    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.LOLLIPOP_MR1) {
      if (options.containsKey("numberOfMatches") && options.get("numberOfMatches") != null) {
        scanSettingsBuilder.setNumOfMatches(((Number) options.get("numberOfMatches")).intValue());
      }
      if (options.containsKey("matchMode") && options.get("matchMode") != null) {
        scanSettingsBuilder.setMatchMode(((Number) options.get("matchMode")).intValue());
      }
    }

    if (serviceUUIDs.size() > 0) {
      for (int i = 0; i < serviceUUIDs.size(); i++) {
        ScanFilter filter = new ScanFilter.Builder().setServiceUuid(new ParcelUuid(UUIDHelper.toUUID((String) serviceUUIDs.get(i)))).build();
        filters.add(filter);
        Log.d(BluetoothModule.TAG, "Filter service: " + serviceUUIDs.get(i));
      }
    }

    adapter.getBluetoothLeScanner().startScan(filters, scanSettingsBuilder.build(), mScanCallback);
    if (timeout > 0) {
      Thread thread = new Thread() {
        private int currentScanSession = scanSessionId.incrementAndGet();

        @Override
        public void run() {
          try {
            Thread.sleep(timeout);
          } catch (InterruptedException ignored) {

          }

          moduleRegistry.getModule(UIManager.class).runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {

              // check current scan session was not stopped
              if (scanSessionId.intValue() == currentScanSession) {
                if (adapter.getState() == BluetoothAdapter.STATE_ON) {
                  adapter.getBluetoothLeScanner().stopScan(mScanCallback);
                }
                Bundle map = new Bundle();
                // TODO: Bacon: I don't think this can fail, so maybe it doesn't matter
                BluetoothModule.sendEvent(BluetoothConstants.EVENTS.CENTRAL_DID_STOP_SCANNING, map);
              }
            }
          });
        }
      };
      thread.start();
    }
    callback.resolve(null);
  }


}