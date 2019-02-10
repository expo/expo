package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;

//import org.droidparts.Injector;
//import org.droidparts.annotation.inject.InjectDependency;

import java.util.UUID;

import expo.modules.bluetooth.CentralManager;

public class UpdateNotificationAction extends Action {

//    @InjectDependency
    CentralManager mCentralManager;

    private final UUID mServiceUuid;
    private final UUID mCharacteristicUuid;
    private final UUID mDescriptorUuid;

    public UpdateNotificationAction(BluetoothDevice device, UUID serviceUuid, UUID characteristicUuid, UUID descriptorUuid) {
        super(device);
//        Injector.inject(Injector.getApplicationContext(), this);
        mServiceUuid = serviceUuid;
        mCharacteristicUuid = characteristicUuid;
        mDescriptorUuid = descriptorUuid;
    }

    @Override
    public void execute(BluetoothGatt gatt) {
        BluetoothGattCharacteristic characteristic = gatt.getService(mServiceUuid).getCharacteristic(mCharacteristicUuid);
        boolean enable = true;
        gatt.setCharacteristicNotification(characteristic, enable);
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(mDescriptorUuid);
        descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
        gatt.writeDescriptor(descriptor);
    }

    @Override
    public boolean hasAvailableCompletionCallback() {
        return false;
    }
}
