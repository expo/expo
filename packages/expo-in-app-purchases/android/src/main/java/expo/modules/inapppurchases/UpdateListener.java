package expo.modules.inapppurchases;

import java.util.List;

import expo.modules.inapppurchases.BillingManager.BillingUpdatesListener;

import android.app.Activity;
import android.util.Log;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.Purchase;

/**
 * Handler to billing updates
 */
public class UpdateListener implements BillingUpdatesListener {
    private static final String TAG = "UpdateListener";

    @Override
    public void onBillingClientSetupFinished() {
        //Activity activity = InAppPurchasesModule.getCurrentActivity();
        // Do something with the activity
        // mActivity.onBillingManagerSetupFinished();
    }

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
        Log.i(TAG, "Size of purchaseList: " + purchaseList.size());
        Log.i(TAG, "Purchase List: " + purchaseList);

        for (Purchase purchase : purchaseList) {
            // The user needs to save the state of what has and has not been purchased
            // As an API it would be best to simply return the result of getSku()
            // and have the user handle that since we cannot determine their SKU_IDs
            // ahead of time.
            switch (purchase.getSku()) {
                /*
                case PremiumDelegate.SKU_ID:
                    Log.d(TAG, "You are Premium! Congratulations!!!");
                    mIsPremium = true;
                    break;
                case GasDelegate.SKU_ID:
                    Log.d(TAG, "We have gas. Consuming it.");
                    // We should consume the purchase and fill up the tank once it was consumed
                    mActivity.getBillingManager().consumeAsync(purchase.getPurchaseToken());
                    break;
                case GoldMonthlyDelegate.SKU_ID:
                    mGoldMonthly = true;
                    break;
                case GoldYearlyDelegate.SKU_ID:
                    mGoldYearly = true;
                    break;
                */
            }
        }

        // mActivity.showRefreshedUi();
    }
}