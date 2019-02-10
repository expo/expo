package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;

import expo.modules.bluetooth.EXBTQueue;

public abstract class Action {

    private BluetoothDevice mBluetoothDevice;
    private EXBTQueue mOwnerQueue;

    public Action(BluetoothDevice bluetoothDevice) {
        mBluetoothDevice = bluetoothDevice;
    }

    public abstract void execute(BluetoothGatt bluetoothGatt);

    public BluetoothDevice getDevice() {
        return mBluetoothDevice;
    }

    public int getTimoutInMillis() {
        return 10000; // 10 seconds
    }

    public abstract boolean hasAvailableCompletionCallback();

    public void setOwnerQueue(EXBTQueue queue) {
        mOwnerQueue = queue;
    }

    public EXBTQueue getBundle() {
        return mOwnerQueue;
    }

}
