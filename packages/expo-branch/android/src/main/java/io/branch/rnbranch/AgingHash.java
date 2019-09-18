package io.branch.rnbranch;

import java.util.HashMap;
import java.util.Iterator;

/**
 * Created by jdee on 3/8/17.
 */

public class AgingHash<KeyType, ValueType> {
    private long mTtlMillis;
    private HashMap<KeyType, AgingItem<ValueType>> mHash = new HashMap<>();

    public AgingHash(long ttlMillis) {
        mTtlMillis = ttlMillis;
    }

    public long getTtlMillis() {
        return mTtlMillis;
    }

    public void put(KeyType key, ValueType value) {
        ageItems();

        AgingItem<ValueType> item = new AgingItem<>(value);
        mHash.put(key, item);
    }

    public ValueType get(KeyType key) {
        AgingItem<ValueType> item = mHash.get(key);
        if (item == null) return null;

        return item.get();
    }

    public void remove(KeyType key) {
        mHash.remove(key);
    }

    private void ageItems() {
        long now = System.currentTimeMillis();

        Iterator it = mHash.entrySet().iterator();
        while (it.hasNext()) {
            HashMap.Entry pair = (HashMap.Entry) it.next();
            AgingItem<ValueType> item = (AgingItem) pair.getValue();
            if (now - item.getAccessTime() >= mTtlMillis) {
                it.remove();
            }
        }
    }
}
