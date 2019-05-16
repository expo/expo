package expo.modules.inapppurchases;

import expo.modules.inapppurchases.UpdateListener;

import java.util.List;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.FeatureType;
import com.android.billingclient.api.BillingClient.SkuType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.Purchase.PurchasesResult;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.SkuDetails;
import com.android.billingclient.api.SkuDetailsParams;
import com.android.billingclient.api.SkuDetailsResponseListener;

/**
 * Handles all the interactions with Play Store (via Billing library), maintains connection to
 * it through BillingClient and caches temporary states/data if needed
 */
public class BillingManager implements PurchasesUpdatedListener {
    private static final String TAG = "BillingManager";

    // Default value of mBillingClientResponseCode until BillingManager was not yet initialized
    public static final int BILLING_MANAGER_NOT_INITIALIZED  = -1;
    private int mBillingClientResponseCode = BILLING_MANAGER_NOT_INITIALIZED;

    private BillingClient mBillingClient;
    private boolean mIsServiceConnected;
    private BillingUpdatesListener mBillingUpdatesListener;

    /**
     * Listener to the updates that happen when purchases list was updated or consumption of the
     * item was finished
     */
    public interface BillingUpdatesListener {
        void onBillingClientSetupFinished();
        void onConsumeFinished(String token, BillingResult result);
        void onPurchasesUpdated(List<Purchase> purchases);
    }

    /**
     * Listener for the Billing client state to become connected
     */
    public interface ServiceConnectedListener {
        void onServiceConnected(BillingResult resultCode);
    }

    public BillingManager(Activity activity) {
        Log.d(TAG, "Creating Billing client.");
        mBillingUpdatesListener = new UpdateListener();
        mBillingClient =
                BillingClient
                        .newBuilder(activity)
                        .enablePendingPurchases()
                        .setListener(this)
                        .build();

        Log.d(TAG, "Starting setup.");

        // Start setup. This is asynchronous and the specified listener will be called
        // once setup completes.
        // It also starts to report all the new purchases through onPurchasesUpdated() callback.
        startServiceConnection(new Runnable() {
            @Override
            public void run() {
                // Notifying the listener that billing client is ready
                mBillingUpdatesListener.onBillingClientSetupFinished();
                // IAB is fully set up. Now, let's get an inventory of stuff we own.
                Log.d(TAG, "Setup successful. Querying inventory.");

                //TODO: Query purchases
                //queryPurchases();
            }
        });
    }

    public void startServiceConnection(final Runnable executeOnSuccess) {
        mBillingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                final int responseCode = billingResult.getResponseCode();
                Log.d(TAG, "Setup finished. Response code: " + responseCode);

                if (responseCode == BillingResponseCode.OK) {
                    mIsServiceConnected = true;
                    if (executeOnSuccess != null) {
                        executeOnSuccess.run();
                    }
                }
                mBillingClientResponseCode = responseCode;
            }

            @Override
            public void onBillingServiceDisconnected() {
                mIsServiceConnected = false;
            }
        });
    }

    /**
     * Handle a callback that purchases were updated from the Billing library
     */
    @Override
    public void onPurchasesUpdated(BillingResult resultCode, List<Purchase> purchases) {
        if (resultCode.getResponseCode() == BillingResponseCode.OK) {
            for (Purchase purchase : purchases) {
                //handlePurchase(purchase);
            }
            //mBillingUpdatesListener.onPurchasesUpdated(mPurchases);
        } else if (resultCode.getResponseCode() == BillingResponseCode.USER_CANCELED) {
            Log.i(TAG, "onPurchasesUpdated() - user cancelled the purchase flow - skipping");
        } else {
            Log.w(TAG, "onPurchasesUpdated() got unknown resultCode: " + resultCode);
        }
    }


}