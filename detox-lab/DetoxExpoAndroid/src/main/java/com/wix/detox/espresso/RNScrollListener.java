package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.util.Log;
import android.widget.AbsListView;

import org.joor.Reflect;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by simonracz on 09/08/2017.
 */

public class RNScrollListener implements AbsListView.OnScrollListener {
    private final static String LOG_TAG = "detox";
    private static final String FIELD_SCROLL_LISTENER = "mOnScrollListener";

    private AbsListView.OnScrollListener savedListener = null;
    private AbsListView listView;

    public AtomicBoolean scrolled = new AtomicBoolean(false);

    /**
     * Returns whether the AbsListview has scrolled since the last time this
     * method was called.
     *
     * It resets the scrolled state on each call.
     *
     * @return scrolled
     */
    public boolean didScroll() {
        boolean ret = scrolled.getAndSet(false);
        return ret;
    }

    /**
     * Call this method to remove the hook from the AbsListView and
     * reset the scrollListener to the original listener.
     */
    public void cleanup() {
        listView.setOnScrollListener(savedListener);
    }

    public RNScrollListener(@NonNull AbsListView listView) {
        this.listView = listView;
        savedListener = Reflect.on(listView).field(FIELD_SCROLL_LISTENER).get();
        listView.setOnScrollListener(this);
    }

    @Override
    public void onScrollStateChanged(AbsListView view, int scrollState) {
        if (savedListener != null) {
            savedListener.onScrollStateChanged(view, scrollState);
        }
    }

    @Override
    public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
        Log.d(LOG_TAG, "onScroll called");
        scrolled.set(true);
        if (savedListener != null) {
            savedListener.onScroll(view, firstVisibleItem, visibleItemCount, totalItemCount);
        }
    }
}
