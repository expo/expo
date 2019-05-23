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
        Bundle response = new Bundle();
        response.putInt("responseCode", result.getResponseCode());
        response.putString("token", token);

        mEventEmitter.emit(BillingManager.ACKNOWLEDGE_ITEM_EVENT, response);
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