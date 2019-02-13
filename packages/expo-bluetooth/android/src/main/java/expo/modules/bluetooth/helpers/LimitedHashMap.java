package expo.modules.bluetooth.helpers;

import java.util.LinkedHashMap;

public class LimitedHashMap<K, V> extends LinkedHashMap<K, V> {

    private final int mMaxSize;

    public LimitedHashMap(int maxSize) {
        super((int) Math.ceil(maxSize / 0.75) + 1, 0.75f, true);
        mMaxSize = maxSize;
    }

    public int getMaxSize() {
        return mMaxSize;
    }

    @Override
    protected boolean removeEldestEntry(java.util.Map.Entry eldest) {
        return size() > mMaxSize;
    }
}
