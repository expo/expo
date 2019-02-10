package expo.modules.bluetooth.actions;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;

public class DisconnectAction extends Action {

    public DisconnectAction(BluetoothDevice device) {
        super(device);
    }

    @Override
    public void execute(BluetoothGatt gatt) {
        gatt.disconnect();
    }

    @Override
    public boolean hasAvailableCompletionCallback() {
        return true;
    }
}
