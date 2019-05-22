package expo.modules.inapppurchases;

import java.util.ArrayList;
import java.util.Map;
import java.util.List;

import android.content.Context;
import android.app.Activity;
import android.util.Log;

import com.android.billingclient.api.SkuDetails;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;

public class InAppPurchasesModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String TAG = InAppPurchasesModule.class.getSimpleName();
  private static final String NAME = "ExpoInAppPurchases";

  private BillingManager mBillingManager;

  private ModuleRegistry mModuleRegistry;

  public InAppPurchasesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void connectToAppStoreAsync(final Promise promise) {
    Activity activity = getCurrentActivity();
    mBillingManager = new BillingManager(activity);
    mBillingManager.startConnectionAndQueryHistory(promise);
  }

  @ExpoMethod
  public void queryPurchasableItemsAsync(String billingType, List<String> itemList, final Promise promise) {
    mBillingManager.queryPurchasableItems(itemList, billingType, promise);
  }

  @ExpoMethod
  public void initiatePurchaseFlowAsync(String skuId, String oldSku, final Promise promise) {
    mBillingManager.initiatePurchaseFlow(skuId, oldSku, promise);
  }

  @ExpoMethod
  public void getBillingResponseCodeAsync(final Promise promise) {
    promise.resolve(mBillingManager.getBillingClientResponseCode());
  }

  @ExpoMethod
  public void disconnectAsync(final Promise promise) {
    if (mBillingManager != null) {
      mBillingManager.destroy();
    }
    promise.resolve(null);
  }


  private Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

}
