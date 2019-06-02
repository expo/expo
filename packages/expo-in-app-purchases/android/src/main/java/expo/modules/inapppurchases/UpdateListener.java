package expo.modules.inapppurchases;

import java.util.ArrayList;
import java.util.List;

import android.os.Bundle;
import android.util.Log;

import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.Purchase;

import org.unimodules.core.Promise;

/**
 * Handler to billing updates
 */
public class UpdateListener implements BillingManager.BillingUpdatesListener {
    private static final String TAG = "UpdateListener";

    @Override
    public void onBillingClientSetupFinished() {}

    @Override
    public void onConsumeFinished(String token, BillingResult result) {
        Log.d(TAG, "Consumption finished. Purchase token: " + token + ", result: " + result);
        Bundle response = new Bundle();
        response.putInt("responseCode", result.getResponseCode());
        response.putString("token", token);

        Promise promise = BillingManager.promises.get(BillingManager.ACKNOWLEDGING_PURCHASE);
        if (promise != null) {
            BillingManager.promises.put(BillingManager.ACKNOWLEDGING_PURCHASE, null);
            promise.resolve(response);
        }
        Log.d(TAG, "End consumption flow.");
    }

    @Override
    public void onPurchasesUpdated(List<Purchase> purchaseList) {
        Bundle response = new Bundle();
        ArrayList<Bundle> results = new ArrayList<>();
        for (Purchase purchase : purchaseList) {
            results.add(BillingManager.convertPurchase(purchase));
        }
        response.putParcelableArrayList("results", results);
        response.putInt("responseCode", BillingResponseCode.OK);

        Promise promise = BillingManager.promises.get(BillingManager.PURCHASING_ITEM);
        if (promise != null) {
            BillingManager.promises.put(BillingManager.PURCHASING_ITEM, null);
            promise.resolve(response);
        }
    }
}