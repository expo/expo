package expo.modules.bluetooth;

import expo.core.Promise;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothProfile;
import android.os.AsyncTask;
import android.util.Log;

import expo.modules.bluetooth.actions.Action;
import expo.modules.bluetooth.actions.CharacteristicReadAction;
import expo.modules.bluetooth.actions.DescriptorReadAction;
import expo.modules.bluetooth.actions.GattActionHandler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

public class CentralManager {

    private ConcurrentLinkedQueue<Action> mQueue;
    private ConcurrentHashMap<String, BluetoothGatt> mGatts;
    private Action mCurrentOperation;
    private HashMap<UUID, ArrayList<GattActionHandler.CharacteristicChange>> mCharacteristicChangeListeners;
    private AsyncTask<Void, Void, Void> mCurrentOperationTimeout;

    void Log(String str) {
      Log.d("CentralManager", str);
    }
    public CentralManager() {
        mQueue = new ConcurrentLinkedQueue<>();
        mGatts = new ConcurrentHashMap<>();
        mCurrentOperation = null;
        mCharacteristicChangeListeners = new HashMap<>();
    }

    public synchronized void cancelCurrentOperationBundle() {
        Log("Cancelling current operation. Queue size before: " + mQueue.size());
        if (mCurrentOperation != null && mCurrentOperation.getBundle() != null) {
            for (Action op : mCurrentOperation.getBundle().getActions()) {
                mQueue.remove(op);
            }
        }
        Log("Queue size after: " + mQueue.size());
        mCurrentOperation = null;
        drive();
    }

    public synchronized void queue(Action gattOperation) {
        mQueue.add(gattOperation);
        Log("Queueing Gatt operation, size will now become: " + mQueue.size());
        drive();
    }

    private synchronized void drive() {
        if (mCurrentOperation != null) {
            Log("tried to drive, but currentOperation was not null, " + mCurrentOperation);
            return;
        }
        if (mQueue.size() == 0) {
            Log("Queue empty, drive loop stopped.");
            mCurrentOperation = null;
            return;
        }

        final Action operation = mQueue.poll();
        Log("Driving Gatt queue, size will now become: " + mQueue.size());
        setCurrentOperation(operation);


        if (mCurrentOperationTimeout != null) {
            mCurrentOperationTimeout.cancel(true);
        }
        mCurrentOperationTimeout = new AsyncTask<Void, Void, Void>() {
            @Override
            protected synchronized Void doInBackground(Void... voids) {
                try {
                    Log("Starting to do a background timeout");
                    wait(operation.getTimoutInMillis());
                } catch (InterruptedException e) {
                    Log("was interrupted out of the timeout");
                }
                if(isCancelled()) {
                    Log("The timeout was cancelled, so we do nothing.");
                    return null;
                }
                Log("Timeout ran to completion, time to cancel the entire operation bundle. Abort, abort!");
                cancelCurrentOperationBundle();
                return null;
            }

            @Override
            protected synchronized void onCancelled() {
                super.onCancelled();
                notify();
            }
        }.execute();

        final BluetoothDevice device = operation.getDevice();
        if(mGatts.containsKey(device.getAddress())) {
            execute(mGatts.get(device.getAddress()), operation);
        } else {
            device.connectGatt(Injector.getApplicationContext(), true, new BluetoothGattCallback() {
                @Override
                public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
                    super.onConnectionStateChange(gatt, status, newState);

                    EventBus.postEvent(Trigger.TRIGGER_CONNECTION_STATE_CHANGED,
                            new ConnectionStateChangedBundle(
                                    device.getAddress(),
                                    newState));

                    if (status == 133) {
                        Log("Got the status 133 bug, closing gatt");
                        gatt.close();
                        mGatts.remove(device.getAddress());
                        return;
                    }

                    if (newState == BluetoothProfile.STATE_CONNECTED) {
                        Log("Gatt connected to device " + device.getAddress());
                        mGatts.put(device.getAddress(), gatt);
                        gatt.discoverServices();
                    } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                        Log("Disconnected from gatt server " + device.getAddress() + ", newState: " + newState);
                        mGatts.remove(device.getAddress());
                        setCurrentOperation(null);
                        gatt.close();
                        drive();
                    }
                }

                @Override
                public void onDescriptorRead(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
                    super.onDescriptorRead(gatt, descriptor, status);
                    ((DescriptorReadAction) mCurrentOperation).onRead(descriptor);
                    setCurrentOperation(null);
                    drive();
                }

                @Override
                public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
                    super.onDescriptorWrite(gatt, descriptor, status);
                    setCurrentOperation(null);
                    drive();
                }

                @Override
                public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
                    super.onCharacteristicRead(gatt, characteristic, status);
                    ((CharacteristicReadAction) mCurrentOperation).onRead(characteristic);
                    setCurrentOperation(null);
                    drive();
                }

                @Override
                public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                    super.onServicesDiscovered(gatt, status);
                    Log("services discovered, status: " + status);
                    execute(gatt, operation);
                }


                @Override
                public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
                    super.onCharacteristicWrite(gatt, characteristic, status);
                    Log("Characteristic " + characteristic.getUuid() + "written to on device " + device.getAddress());
                    setCurrentOperation(null);
                    drive();
                }

                @Override
                public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
                    super.onCharacteristicChanged(gatt, characteristic);
                    Log("Characteristic " + characteristic.getUuid() + "was changed, device: " + device.getAddress());
                    if (mCharacteristicChangeListeners.containsKey(characteristic.getUuid())) {
                        for (GattActionHandler.CharacteristicChange listener : mCharacteristicChangeListeners.get(characteristic.getUuid())) {
                            listener.invoke(device.getAddress(), characteristic);
                        }
                    }
                }
            });
        }
    }

    private void execute(BluetoothGatt gatt, Action operation) {
        if (operation != mCurrentOperation) {
            return;
        }
        operation.execute(gatt);
        if (!operation.hasAvailableCompletionCallback()) {
            setCurrentOperation(null);
            drive();
        }
    }

    public synchronized void setCurrentOperation(Action currentOperation) {
        mCurrentOperation = currentOperation;
    }

    public BluetoothGatt getGatt(BluetoothDevice device) {
        return mGatts.get(device);
    }

    public void addCharacteristicChangeListener(UUID characteristicUuid, GattActionHandler.CharacteristicChange characteristicChangeListener) {
        if (!mCharacteristicChangeListeners.containsKey(characteristicUuid)) {
            mCharacteristicChangeListeners.put(characteristicUuid, new ArrayList<GattActionHandler.CharacteristicChange>());
        }
        mCharacteristicChangeListeners.get(characteristicUuid).add(characteristicChangeListener);
    }

    public void queue(EXBTQueue bundle) {
        for (Action operation : bundle.getActions()) {
            queue(operation);
        }
    }

    public class ConnectionStateChangedBundle {
        public final int mNewState;
        public final String mAddress;

        public ConnectionStateChangedBundle(String address, int newState) {
            mAddress = address;
            mNewState = newState;
        }
    }
}
