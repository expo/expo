package expo.modules.inapppurchases;

import java.util.ArrayList;
import java.util.List;

import android.os.Bundle;
import android.util.Log;

import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.Purchase;

import org.unimodules.core.interfaces.services.EventEmitter;

/**
 * Handler to billing updates
 */
public class UpdateListener implements BillingManager.BillingUpdatesListener {
    private static final String TAG = "UpdateListener";
    private EventEmitter mEventEmitter;

    public UpdateListener(EventEmitter eventEmitter) {
        mEventEmitter = eventEmitter;
    }

    @Override
    public void onBillingClientSetupFinished() {}

    @Override
    public void onConsumeFinished(String token, BillingResult result) {
        Log.d(TAG, "Consumption finished. Purchase token: " + token + ", result: " + result);

        // If you have more than one sku, you probably need to validate that the token matches
        // the SKU you expect.
        // It could be done by maintaining a map (updating it every time you call consumeAsync)
        // of all tokens into SKUs which were scheduled to be consumed and then looking through
        // it here to check which SKU corresponds to a consumed token.
        if (result.getResponseCode() == BillingResponseCode.OK) {
            // Successfully consumed, so we apply the effects of the item in our
            // game world's logic, which in our case means filling the gas tank a bit
            Log.d(TAG, "Consumption successful. Provisioning.");
        }

        // mActivity.showRefreshedUi();
        Log.d(TAG, "End consumption flow.");
    }

    @Override
    public void onPurchasesUpdated(List<Purchase> purchaseList) {
        Bundle response = new Bundle();
        ArrayList<String> results = new ArrayList<>();
        for (Purchase purchase : purchaseList) {
            results.add(purchase.getOriginalJson());
        }
        response.putStringArrayList("results", results);
        response.putInt("responseCode", BillingResponseCode.OK);
        mEventEmitter.emit(BillingManager.PURCHASES_UPDATED_EVENT, response);
    }
}