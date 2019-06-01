package expo.modules.inapppurchases;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.AcknowledgePurchaseResponseListener;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.BillingClient.FeatureType;
import com.android.billingclient.api.BillingClient.SkuType;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.Purchase.PurchasesResult;
import com.android.billingclient.api.PurchaseHistoryResponseListener;
import com.android.billingclient.api.PurchaseHistoryRecord;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.SkuDetails;
import com.android.billingclient.api.SkuDetailsParams;
import com.android.billingclient.api.SkuDetailsResponseListener;
import org.unimodules.core.Promise;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;

/**
 * Handles all the interactions with Play Store (via Billing library), maintains connection to
 * it through BillingClient and caches temporary states/data if needed
 */
public class BillingManager implements PurchasesUpdatedListener {
    private static final String TAG = "BillingManager";

    // Default value of mBillingClientResponseCode until BillingManager was not yet initialized
    public static final int BILLING_MANAGER_NOT_INITIALIZED  = -1;
    public static final String PURCHASING_ITEM = "Purchasing Item";
    public static final String ACKNOWLEDGING_PURCHASE = "Acknowledging Item";
    private int mBillingClientResponseCode = BILLING_MANAGER_NOT_INITIALIZED;

    protected static final HashMap<String, Promise> promises = new HashMap<>();
    private final List<Purchase> mPurchases = new ArrayList<>();
    private final HashMap<String, SkuDetails> mSkuDetailsMap = new HashMap<>();
    private BillingClient mBillingClient;
    private boolean mIsServiceConnected;
    private final Activity mActivity;
    private BillingUpdatesListener mBillingUpdatesListener;

    private Set<String> mTokensToBeConsumed;

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
        mActivity = activity;
        mBillingUpdatesListener = new UpdateListener();
        mBillingClient =
                BillingClient
                        .newBuilder(activity)
                        .enablePendingPurchases()
                        .setListener(this)
                        .build();
    }

    public void startConnectionAndQueryHistory(final Promise promise) {
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
                queryPurchases(promise);
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
     * Start a purchase or subscription replace flow
     */
    public void purchaseItemAsync(final String skuId, final String oldSku, final Promise promise) {
        // Save promise to HashMap to resolve later
        promises.put(PURCHASING_ITEM, promise);

        // oldSku is for subscription replacements and may be null.
        Runnable purchaseFlowRequest = new Runnable() {
            @Override
            public void run() {
            Log.d(TAG, "Launching in-app purchase flow. Replace old SKU? " + (oldSku != null));

            SkuDetails skuDetails = mSkuDetailsMap.get(skuId);
            BillingFlowParams purchaseParams = BillingFlowParams.newBuilder()
                    .setSkuDetails(skuDetails).setOldSku(oldSku).build();
            mBillingClient.launchBillingFlow(mActivity, purchaseParams);
            }
        };

        executeServiceRequest(purchaseFlowRequest);
    }

    public Context getContext() {
        return mActivity;
    }

    /**
     * Handle a callback that purchases were updated from the Billing library
     */
    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingResponseCode.OK) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
            mBillingUpdatesListener.onPurchasesUpdated(mPurchases);
            Log.d(TAG, "Done updating purchases");
        } else {
            if (result.getResponseCode() == BillingResponseCode.USER_CANCELED) {
                Log.i(TAG, "onPurchasesUpdated() - user cancelled the purchase flow - skipping");
            } else {
                Log.w(TAG, "onPurchasesUpdated() got unknown resultCode: " + result);
            }
            Bundle response = new Bundle();
            response.putInt("responseCode", result.getResponseCode());
            Promise promise = promises.get(PURCHASING_ITEM);
            if (promise != null) {
                promises.put(PURCHASING_ITEM, null);
                promise.resolve(response);
            }
        }
    }

    public void acknowledgePurchaseAsync(String purchaseToken, final Promise promise) {
        AcknowledgePurchaseResponseListener acknowledgePurchaseResponseListener = new AcknowledgePurchaseResponseListener() {
            @Override
            public void onAcknowledgePurchaseResponse(BillingResult billingResult) {
                Bundle response = new Bundle();
                response.putInt("responseCode", billingResult.getResponseCode());

                promise.resolve(response);
            }
        };

        AcknowledgePurchaseParams acknowledgePurchaseParams =
                AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchaseToken)
                        .build();
        mBillingClient.acknowledgePurchase(acknowledgePurchaseParams, acknowledgePurchaseResponseListener);
    }

    public void consumeAsync(final String purchaseToken, final Promise promise) {
        // If we've already scheduled to consume this token - no action is needed (this could happen
        // if you received the token when querying purchases inside onReceive() and later from
        // onActivityResult()
        if (mTokensToBeConsumed == null) {
            mTokensToBeConsumed = new HashSet<>();
        } else if (mTokensToBeConsumed.contains(purchaseToken)) {
            Log.i(TAG, "Token was already scheduled to be consumed - skipping...");
            Bundle response = new Bundle();
            response.putInt("responseCode", BillingClient.BillingResponseCode.OK);
            promise.resolve(response);
            return;
        }

        promises.put(ACKNOWLEDGING_PURCHASE, promise);
        mTokensToBeConsumed.add(purchaseToken);

        // Generating Consume Response listener
        final ConsumeResponseListener onConsumeListener = new ConsumeResponseListener() {
            @Override
            public void onConsumeResponse(BillingResult billingResult, String purchaseToken) {
                // If billing service was disconnected, we try to reconnect 1 time
                // (feel free to introduce your retry policy here).
                mBillingUpdatesListener.onConsumeFinished(purchaseToken, billingResult);
            }
        };

        // Creating a runnable from the request to use it inside our connection retry policy below
        Runnable consumeRequest = new Runnable() {
            @Override
            public void run() {
                ConsumeParams consumeParams =
                        ConsumeParams.newBuilder()
                                .setPurchaseToken(purchaseToken)
                                .setDeveloperPayload(null)
                                .build();
                // Consume the purchase async
                mBillingClient.consumeAsync(consumeParams, onConsumeListener);
            }
        };

        executeServiceRequest(consumeRequest);
    }

    /**
     * Handles the purchase
     * @param purchase Purchase to be handled
     */
    private void handlePurchase(Purchase purchase) {
        Log.d(TAG, "Got a verified purchase: " + purchase);
        mPurchases.add(purchase);
    }

    /**
     * Returns the value Billing client response code or BILLING_MANAGER_NOT_INITIALIZED if the
     * client connection response was not received yet.
     */
    public int getBillingClientResponseCode() {
        return mBillingClientResponseCode;
    }

    /**
     * Query purchases across various use cases and deliver the result in a formalized way through
     * a listener
     */
    public void queryPurchases(final Promise promise) {
        Runnable queryToExecute = new Runnable() {
            @Override
            public void run() {
            long time = System.currentTimeMillis();
            PurchasesResult purchasesResult = mBillingClient.queryPurchases(SkuType.INAPP);
            Log.i(TAG, "Querying purchases elapsed time: " + (System.currentTimeMillis() - time)
                    + "ms");
            // If there are subscriptions supported, we add subscription rows as well
            if (areSubscriptionsSupported()) {
                PurchasesResult subscriptionResult
                        = mBillingClient.queryPurchases(SkuType.SUBS);
                Log.i(TAG, "Querying purchases and subscriptions elapsed time: "
                        + (System.currentTimeMillis() - time) + "ms");
                Log.i(TAG, "Querying subscriptions result code: "
                        + subscriptionResult.getResponseCode()
                        + " res: " + subscriptionResult.getPurchasesList().size());

                if (subscriptionResult.getResponseCode() == BillingResponseCode.OK) {
                    purchasesResult.getPurchasesList().addAll(
                            subscriptionResult.getPurchasesList());
                } else {
                    Log.e(TAG, "Got an error response trying to query subscription purchases");
                }
            } else if (purchasesResult.getResponseCode() == BillingResponseCode.OK) {
                Log.i(TAG, "Skipped subscription purchases query since they are not supported");
            } else {
                Log.w(TAG, "queryPurchases() got an error response code: "
                        + purchasesResult.getResponseCode());
            }
            onQueryPurchasesFinished(purchasesResult, promise);
            }
        };

        executeServiceRequest(queryToExecute);
    }

    /**
     * Does the same thing as queryPurchases except makes a network request (instead of using Google Play cache)
     * and returns all records for every SKU of a given type, even if they're expired/consumed
     */
    public void queryPurchaseHistoryAsync(final String itemType, final Promise promise) {
        Runnable queryToExecute = new Runnable() {
            @Override
            public void run() {
                mBillingClient.queryPurchaseHistoryAsync(itemType,
                new PurchaseHistoryResponseListener() {
                    @Override
                    public void onPurchaseHistoryResponse(BillingResult billingResult,
                                                          List<PurchaseHistoryRecord> purchasesList) {
                        Bundle response = new Bundle();
                        response.putInt("responseCode", billingResult.getResponseCode());
                        if (billingResult.getResponseCode() == BillingResponseCode.OK
                                && purchasesList != null) {
                            ArrayList<String> jsonStrings = new ArrayList<>();
                            for (PurchaseHistoryRecord record : purchasesList) {
                                jsonStrings.add(record.getOriginalJson());
                            }
                            response.putStringArrayList("results", jsonStrings);
                        }
                        promise.resolve(response);
                    }
                });
            }
        };

        executeServiceRequest(queryToExecute);
    }

    /**
     * Handle a result from querying of purchases and report an updated list to the listener
     */
    private void onQueryPurchasesFinished(PurchasesResult result, final Promise promise) {
        // Have we been disposed of in the meantime? If so, or bad result code, then quit
        if (mBillingClient == null || result.getResponseCode() != BillingResponseCode.OK) {
            Log.w(TAG, "Billing client was null or result code (" + result.getResponseCode()
                    + ") was bad - quitting");
            return;
        }

        Log.d(TAG, "Query inventory was successful.");

        BillingResult billingResult = result.getBillingResult();
        List<Purchase> purchasesList = result.getPurchasesList();
        ArrayList<String> jsonStrings = new ArrayList<>();
        for (Purchase purchase : purchasesList) {
            jsonStrings.add(purchase.getOriginalJson());
        }

        // Update purchases inventory with new list of purchases
        mPurchases.clear();
        onPurchasesUpdated(billingResult, purchasesList);

        final Bundle response = new Bundle();
        response.putInt("responseCode", billingResult.getResponseCode());
        response.putStringArrayList("results", jsonStrings);
        Log.d(TAG, "Resolving connectToAppStoreAsync promise with response code: "
                + billingResult.getResponseCode() + " and purchases list: " + purchasesList);
        promise.resolve(response);
    }

    public void querySkuDetailsAsync(final String itemType, final List<String> skuList,
                                     final SkuDetailsResponseListener listener) {
        // Creating a runnable from the request to use it inside our connection retry policy below
        Runnable queryRequest = new Runnable() {
            @Override
            public void run() {
            // Query the purchase async
            SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
            params.setSkusList(skuList).setType(itemType);
            mBillingClient.querySkuDetailsAsync(params.build(),
                new SkuDetailsResponseListener() {
                @Override
                public void onSkuDetailsResponse(BillingResult billingResult,
                                                 List<SkuDetails> skuDetailsList) {
                    listener.onSkuDetailsResponse(billingResult, skuDetailsList);
                }
            });
            }
        };

        executeServiceRequest(queryRequest);
    }

    public void queryPurchasableItems(
            List<String> itemList,
            final @SkuType String billingType,
            final Promise promise
    ) {
        Log.d(TAG, "Calling queryPurchasableItems");
        Log.d(TAG, "Billing Type: " + billingType);
        Log.d(TAG, "Item List: " + itemList);
        final Bundle response = new Bundle();
        querySkuDetailsAsync(billingType, itemList,
            new SkuDetailsResponseListener() {
                @Override
                public void onSkuDetailsResponse(BillingResult billingResult, List<SkuDetails> skuDetailsList) {
                    final int responseCode = billingResult.getResponseCode();
                    Log.d(TAG, "Got a SkuDetailsResponse with code: " + responseCode);
                    response.putInt("responseCode", responseCode);
                    if(responseCode != BillingResponseCode.OK) {
                        Log.w(TAG, "Unsuccessful query for type: " + billingType
                                + ". Error code: " + responseCode);
                    } else if (skuDetailsList != null && skuDetailsList.size() > 0) {
                        Log.d(TAG, "Successfully got results back: " + skuDetailsList);
                        ArrayList<String> jsonStrings = new ArrayList<>();
                        for (SkuDetails skuDetails : skuDetailsList) {
                            mSkuDetailsMap.put(skuDetails.getSku(), skuDetails);
                            jsonStrings.add(skuDetails.getOriginalJson());
                        }

                        response.putStringArrayList("results", jsonStrings);
                    }
                    promise.resolve(response);
                }
            }
        );
    }

    private void executeServiceRequest(Runnable runnable) {
        if (mIsServiceConnected) {
            runnable.run();
        } else {
            // If billing service was disconnected, we try to reconnect 1 time.
            startServiceConnection(runnable);
        }
    }

    /**
     * Checks if subscriptions are supported for current client
     * <p>Note: This method does not automatically retry for RESULT_SERVICE_DISCONNECTED.
     * It is only used in unit tests and after queryPurchases execution, which already has
     * a retry-mechanism implemented.
     * </p>
     */
    public boolean areSubscriptionsSupported() {
        BillingResult billingResult = mBillingClient.isFeatureSupported(FeatureType.SUBSCRIPTIONS);
        int responseCode = billingResult.getResponseCode();
        if (responseCode != BillingResponseCode.OK) {
            Log.w(TAG, "areSubscriptionsSupported() got an error response: " + responseCode);
        }
        return responseCode == BillingResponseCode.OK;
    }

    /**
     * Clear the resources
     */
    public void destroy() {
        Log.d(TAG, "Destroying the manager.");

        if (mBillingClient != null && mBillingClient.isReady()) {
            mBillingClient.endConnection();
            mBillingClient = null;
        }
    }

}