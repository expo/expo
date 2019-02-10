package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;

public abstract class GattActionHandler {

    static interface DescriptorRead {
        void invoke(byte[] input);
    }
    static interface CharacteristicRead {
        void invoke(byte[] input);
    }
    public interface CharacteristicChange {
        void invoke(String deviceAddress, BluetoothGattCharacteristic characteristic);
    }
    
}
