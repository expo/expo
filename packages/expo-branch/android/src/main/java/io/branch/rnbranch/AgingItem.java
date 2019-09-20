package io.branch.rnbranch;

/**
 * Created by jdee on 3/8/17.
 */

public class AgingItem<ValueType> {
    private long mAccessTime = System.currentTimeMillis();
    private ValueType mItem = null;

    public AgingItem(ValueType item) {
        mItem = item;
    }

    public ValueType get() {
        mAccessTime = System.currentTimeMillis();
        return mItem;
    }

    public long getAccessTime() {
        return mAccessTime;
    }
}
