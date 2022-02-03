package expo.modules.inapppurchases;

import java.util.ArrayList;
import java.util.List;

import android.os.Bundle;

import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.BillingClient.BillingResponseCode;
import com.android.billingclient.api.Purchase;

import expo.modules.core.interfaces.services.EventEmitter;
import expo.modules.core.Promise;

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
  public void onBillingClientSetupFinished() {
  }

  @Override
  public void onConsumeFinished(String token, BillingResult result) {
    Bundle response = new Bundle();
    response.putInt("responseCode", result.getResponseCode());
    response.putString("token", token);

    Promise promise = BillingManager.promises.get(BillingManager.ACKNOWLEDGING_PURCHASE);
    if (promise != null) {
      BillingManager.promises.put(BillingManager.ACKNOWLEDGING_PURCHASE, null);
      promise.resolve(response);
    }
  }

  @Override
  public void onPurchasesUpdated(List<Purchase> purchaseList) {
    Bundle response = new Bundle();
    ArrayList<Bundle> results = new ArrayList<>();
    for (Purchase purchase : purchaseList) {
      results.add(BillingManager.purchaseToBundle(purchase));
    }
    response.putParcelableArrayList("results", results);
    response.putInt("responseCode", BillingResponseCode.OK);

    mEventEmitter.emit(BillingManager.PURCHASES_UPDATED_EVENT, response);
  }
}
