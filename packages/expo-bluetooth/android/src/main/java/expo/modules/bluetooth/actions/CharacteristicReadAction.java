package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.util.Log;

import java.util.UUID;


public class CharacteristicReadAction extends Action {
    private final UUID mService;
    private final UUID mCharacteristic;
    private final GattActionHandler.CharacteristicRead mCallback;

    public CharacteristicReadAction(BluetoothDevice device, UUID service, UUID characteristic, GattActionHandler.CharacteristicRead callback) {
        super(device);
        mService = service;
        mCharacteristic = characteristic;
        mCallback = callback;
    }

    @Override
    public void execute(BluetoothGatt gatt) {
        Log.d("CReadAction", "writing to " + mCharacteristic);
        BluetoothGattCharacteristic characteristic = gatt.getService(mService).getCharacteristic(mCharacteristic);
        gatt.readCharacteristic(characteristic);
    }

    @Override
    public boolean hasAvailableCompletionCallback() {
        return true;
    }

    public void onRead(BluetoothGattCharacteristic characteristic) {
        mCallback.invoke(characteristic.getValue());
    }
}
