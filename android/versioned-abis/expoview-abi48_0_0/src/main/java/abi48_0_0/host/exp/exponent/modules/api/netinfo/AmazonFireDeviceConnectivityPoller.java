package abi48_0_0.host.exp.exponent.modules.api.netinfo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Handler;

/**
 * A component similar to ConnectivityReceiver (and its implementations) that goes through
 * register/unregister cycles. It is only active on an Amazon Fire device (e.g. FireTV Stick). It
 * will continuously issue an intent to FireOS to check for internet connectivity and listen to the
 * response via broadcast receiver.
 *
 * <p>This is required since FireOs does not report network capabilities correctly
 * (NetworkCapabilities.NET_CAPABILITY_VALIDATED is true when offline) even when the OS knows that
 * the internet is not reachable.
 *
 * <p>The caller component is responsible to responding to callbacks of the device going online or
 * offline.
 */
public class AmazonFireDeviceConnectivityPoller {
    /** Intent action for triggering FireOS connectivity checking. */
    private static final String ACTION_CONNECTIVITY_CHECK =
            "com.amazon.tv.networkmonitor.CONNECTIVITY_CHECK";

    /** Broadcast sent by NetMon FireOS component when the device cannot reach the internet. */
    private static final String ACTION_INTERNET_DOWN = "com.amazon.tv.networkmonitor.INTERNET_DOWN";

    /** Broadcast sent by NetMon FireOS component when the can reach the internet. */
    private static final String ACTION_INTERNET_UP = "com.amazon.tv.networkmonitor.INTERNET_UP";

    /** Interval (in milliseconds) of how often to check for connectivity. */
    private static final long POLLING_INTERVAL_MS = 10 * 1000;

    private final Receiver receiver = new Receiver();
    private final Context context;
    private final ConnectivityChangedCallback callback;

    private final Runnable checker = new PollerTask();
    private Handler handler;
    private boolean pollerRunning = false;

    /** Callback interface that will be invoked when internet connectivity status changes. */
    public interface ConnectivityChangedCallback {
        /**
         * Called when internet connectivity status changes.
         *
         * @param isConnected
         */
        void onAmazonFireDeviceConnectivityChanged(boolean isConnected);
    }

    AmazonFireDeviceConnectivityPoller(Context context, ConnectivityChangedCallback callback) {
        this.context = context;
        this.callback = callback;
    }

    public void register() {
        if (!isFireOsDevice()) {
            return;
        }

        registerReceiver();
        startPoller();
    }

    public void unregister() {
        if (!isFireOsDevice()) {
            return;
        }

        stopPoller();
        unregisterReceiver();
    }

    private boolean isFireOsDevice() {
        // https://developer.amazon.com/docs/fire-tv/identify-amazon-fire-tv-devices.html
        // https://developer.amazon.com/docs/fire-tablets/ft-specs-custom.html
        return Build.MANUFACTURER.equals("Amazon")
                && (Build.MODEL.startsWith("AF") || Build.MODEL.startsWith("KF"));
    }

    private void registerReceiver() {
        if (receiver.registered) {
            return;
        }

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_INTERNET_DOWN);
        filter.addAction(ACTION_INTERNET_UP);
        context.registerReceiver(receiver, filter);

        receiver.registered = true;
    }

    private void startPoller() {
        if (pollerRunning) {
            return;
        }

        // NOTE: since this is usually called on the right thread, we construct
        //       the handler here rather than in the constructor.
        handler = new Handler();
        pollerRunning = true;
        handler.post(checker);

        // NOTE: In the future, WorkManager or another approach to the polling task
        //       would work better. For now though this is the simpler way to keep
        //       checking for connectivity.
    }

    private void unregisterReceiver() {
        if (!receiver.registered) {
            return;
        }

        context.unregisterReceiver(receiver);
        receiver.registered = false;
    }

    private void stopPoller() {
        if (!pollerRunning) {
            return;
        }

        pollerRunning = false;
        handler.removeCallbacksAndMessages(null);
        handler = null;
    }

    private class Receiver extends BroadcastReceiver {
        boolean registered = false;

        private Boolean lastIsConnected;

        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent == null ? null : intent.getAction();
            boolean isConnected;
            if (ACTION_INTERNET_DOWN.equals(action)) {
                isConnected = false;
            } else if (ACTION_INTERNET_UP.equals(action)) {
                isConnected = true;
            } else {
                return;
            }

            if (lastIsConnected == null || lastIsConnected != isConnected) {
                lastIsConnected = isConnected;
                callback.onAmazonFireDeviceConnectivityChanged(isConnected);
            }
        }
    }

    private class PollerTask implements Runnable {
        @Override
        public void run() {
            if (!pollerRunning) {
                return;
            }

            Intent checkIntent = new Intent(ACTION_CONNECTIVITY_CHECK);
            context.sendBroadcast(checkIntent);

            handler.postDelayed(checker, POLLING_INTERVAL_MS);
        }
    }
}
