package expo.modules.bluetooth.helpers;

import java.util.LinkedHashMap;

import expo.modules.bluetooth.objects.Peripheral;

public class PeripheralHashMap<K, V> extends LimitedHashMap<K, V> {

    public PeripheralHashMap(int size) {
        super(size);
    }

    @Override
    protected boolean removeEldestEntry(java.util.Map.Entry oldest) {
        if (size() > getMaxSize() && oldest.getValue() instanceof Peripheral) {
            ((Peripheral) oldest.getValue()).disconnect();
        }
        return super.removeEldestEntry(oldest);
    }
}
