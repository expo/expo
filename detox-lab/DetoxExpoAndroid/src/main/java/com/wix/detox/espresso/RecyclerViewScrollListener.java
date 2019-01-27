package com.wix.detox.espresso;

/**
 * Created by simonracz on 14/08/2017.
 */

import android.support.annotation.NonNull;

import com.wix.detox.Delegator;

import org.joor.Reflect;

import java.lang.reflect.Proxy;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * ScrollListener for RecyclerViews.
 *
 * As we do not statically link to a RecyclerView lib. This class
 * doesn't implement the interface directly. We use a Proxy class to
 * hook up to scroll listener methods with reflection.
 */
public class RecyclerViewScrollListener {
    private static final String LOG_TAG = "detox";

    public static final String CLASS_RECYCLERVIEW = "android.support.v7.widget.RecyclerView";
    private static final String CLASS_SCROLL_LISTENER = "android.support.v7.widget.RecyclerView.OnScrollListener";
    private static final String METHOD_ADD_LISTENER = "addOnScrollListener";
    private static final String METHOD_REMOVE_LISTENER = "removeOnScrollListener";

    private Object recyclerView;

    private AtomicBoolean scrolled = new AtomicBoolean(false);

    RecyclerViewScrollListener(@NonNull Object recyclerView) {
        this.recyclerView = recyclerView;
        setUp();
    }

    private static Object proxyListener = null;

    private void setUp() {
        Class<?> listener = null;
        try {
            listener = Class.forName(CLASS_SCROLL_LISTENER);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Cant find ScrollListener interface on RecyclerView", e);
        }

        Class[] proxyInterfaces = new Class[]{listener};
        proxyListener = Proxy.newProxyInstance(
                listener.getClassLoader(),
                proxyInterfaces,
                new Delegator(proxyInterfaces, new Object[] { this })
        );

        Reflect.on(recyclerView).call(METHOD_ADD_LISTENER, proxyListener);
    }

    /**
     * Returns whether the RecyclerView has scrolled since the last time this
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
     * Call this method to remove the hook from the RecyclerView.
     */
    public void cleanup() {
        Reflect.on(recyclerView).call(METHOD_REMOVE_LISTENER, proxyListener);
    }

    //Proxy calls it
    public void onScrollStateChanged(Object recyclerView, int newState) {
        // empty
    }

    //Proxy calls it
    public void onScrolled(Object recyclerView, int dx, int dy) {
        scrolled.set(true);
    }

}
