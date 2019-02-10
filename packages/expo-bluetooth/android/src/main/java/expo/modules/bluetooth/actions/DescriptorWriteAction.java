package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattDescriptor;
import android.util.Log;

import java.util.UUID;

public class DescriptorWriteAction extends Action {

    private final UUID mService;
    private final UUID mCharacteristic;
    private final UUID mDescriptor;
    private final GattActionHandler.DescriptorRead mCallback;

    public DescriptorWriteAction(BluetoothDevice device, UUID service, UUID characteristic, UUID descriptor, GattActionHandler.DescriptorRead callback) {
        super(device);
        mService = service;
        mCharacteristic = characteristic;
        mDescriptor = descriptor;
        mCallback = callback;
    }

    @Override
    public void execute(BluetoothGatt gatt) {
        Log.d("DWriteAction", "Reading from " + mDescriptor);
        BluetoothGattDescriptor descriptor = gatt.getService(mService).getCharacteristic(mCharacteristic).getDescriptor(mDescriptor);
        gatt.readDescriptor(descriptor);
    }

    @Override
    public boolean hasAvailableCompletionCallback() {
        return true;
    }

    public void onRead(BluetoothGattDescriptor descriptor) {
        mCallback.invoke(descriptor.getValue());
    }
}
