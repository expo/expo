package expo.modules.payments.stripe;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.text.TextUtils;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.modules.payments.stripe.dialog.AddCardDialogFragment;
import expo.modules.payments.stripe.util.ArgCheck;
import expo.modules.payments.stripe.util.Converters;
import expo.modules.payments.stripe.util.Fun0;
import com.google.android.gms.wallet.WalletConstants;
import com.stripe.android.SourceCallback;
import com.stripe.android.Stripe;
import com.stripe.android.TokenCallback;
import com.stripe.android.model.Source;
import com.stripe.android.model.SourceParams;
import com.stripe.android.model.Token;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import expo.core.ExportedModule;

import static expo.modules.payments.stripe.PayFlow.NO_CURRENT_ACTIVITY_MSG;
import static expo.modules.payments.stripe.util.Converters.convertSourceToWritableMap;
import static expo.modules.payments.stripe.util.Converters.convertTokenToWritableMap;
import static expo.modules.payments.stripe.util.Converters.createBankAccount;
import static expo.modules.payments.stripe.util.Converters.createCard;
import static expo.modules.payments.stripe.util.Converters.getStringOrNull;
import static expo.modules.payments.stripe.util.InitializationOptions.ANDROID_PAY_MODE_KEY;
import static expo.modules.payments.stripe.util.InitializationOptions.ANDROID_PAY_MODE_PRODUCTION;
import static expo.modules.payments.stripe.util.InitializationOptions.PUBLISHABLE_KEY;
import static expo.modules.payments.stripe.util.InitializationOptions.ANDROID_PAY_MODE_TEST;

public class StripeModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String META_DATA_SCHEME_KEY = "standaloneStripeScheme";
  private static final String MODULE_NAME = StripeModule.class.getSimpleName();
  private static final String TAG = "### " + MODULE_NAME + ": ";
  private static HashMap<Integer, WeakReference<StripeModule>> sMapOfInstances = new HashMap<>();

  private Context mContext;
  private ModuleRegistry mModuleRegistry = null;

  public static StripeModule getInstance(int tag) {
    WeakReference<StripeModule> res = sMapOfInstances.get(tag);
    if(res == null) {
      return null;
    }
    return res.get();
  }

  public static int getLastTag() {
    return sCounter.get();
  }

  public Stripe getStripe() {
    return mStripe;
  }

  @Nullable
  private Promise mCreateSourcePromise;

  @Nullable
  private Source mCreatedSource;

  private String mPublicKey;
  private Stripe mStripe;
  private PayFlow mPayFlow;

  private int mTag = 0;
  private static final AtomicInteger sCounter = new AtomicInteger(0);


  private final ActivityEventListener mActivityEventListener = new ActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
      boolean handled = getPayFlow().onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onNewIntent(Intent intent) {
      // Do nothing...
    }
  };


  public StripeModule(Context context) {
    super(context);
    this.mContext = context;
    mTag = sCounter.incrementAndGet();
    sMapOfInstances.put(mTag, new WeakReference<StripeModule>(this));
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @ExpoMethod
  public void init(@NonNull Map<String, Object> options, Promise promise) {
    ArgCheck.nonNull(options);

    String newPubKey = Converters.getStringOrNull(options, PUBLISHABLE_KEY);
    String newAndroidPayMode = Converters.getStringOrNull(options, ANDROID_PAY_MODE_KEY);

    if (newPubKey != null && !TextUtils.equals(newPubKey, mPublicKey)) {
      ArgCheck.notEmptyString(newPubKey);

      mPublicKey = newPubKey;
      mStripe = new Stripe(mContext, mPublicKey);
      getPayFlow().setPublishableKey(mPublicKey);
    }

    if (newAndroidPayMode != null) {
      ArgCheck.isTrue(ANDROID_PAY_MODE_TEST.equals(newAndroidPayMode) || ANDROID_PAY_MODE_PRODUCTION.equals(newAndroidPayMode));

      getPayFlow().setEnvironment(androidPayModeToEnvironment(newAndroidPayMode));
    }

    promise.resolve(null);
  }

  private PayFlow getPayFlow() {
    if (mPayFlow == null) {
      mPayFlow = PayFlow.create(
        new Fun0<Activity>() { public Activity call() {
          return getCurrentActivity();
        }}
      );
    }

    return mPayFlow;
  }

  private Activity getCurrentActivity() {
    return mModuleRegistry.getModule(ActivityProvider.class).getCurrentActivity();
  }

  private static int androidPayModeToEnvironment(@NonNull String androidPayMode) {
    ArgCheck.notEmptyString(androidPayMode);
    return ANDROID_PAY_MODE_TEST.equals(androidPayMode.toLowerCase()) ? WalletConstants.ENVIRONMENT_TEST : WalletConstants.ENVIRONMENT_PRODUCTION;
  }

  @ExpoMethod
  public void deviceSupportsAndroidPay(final Promise promise) {
    getPayFlow().deviceSupportsAndroidPay(false, promise);
  }

  @ExpoMethod
  public void canMakeAndroidPayPayments(final Promise promise) {
    getPayFlow().deviceSupportsAndroidPay(true, promise);
  }

  @ExpoMethod
  public void createTokenWithCard(final Map<String, Object> cardData, final Promise promise) {
    try {
      ArgCheck.nonNull(mStripe);
      ArgCheck.notEmptyString(mPublicKey);

      mStripe.createToken(
        createCard(cardData),
        mPublicKey,
        new TokenCallback() {
          public void onSuccess(Token token) {
            promise.resolve(convertTokenToWritableMap(token));
          }
          public void onError(Exception error) {
            error.printStackTrace();
            promise.reject(TAG, error.getMessage());
          }
        });
    } catch (Exception e) {
      promise.reject(TAG, e.getMessage());
    }
  }

  @ExpoMethod
  public void createTokenWithBankAccount(final Map<String, Object> accountData, final Promise promise) {
    try {
      ArgCheck.nonNull(mStripe);
      ArgCheck.notEmptyString(mPublicKey);

      mStripe.createBankAccountToken(
        createBankAccount(accountData),
        mPublicKey,
        null,
        new TokenCallback() {
          public void onSuccess(Token token) {
            promise.resolve(convertTokenToWritableMap(token));
          }
          public void onError(Exception error) {
            error.printStackTrace();
            promise.reject(TAG, error.getMessage());
          }
        });
    } catch (Exception e) {
      promise.reject(TAG, e.getMessage());
    }
  }

  @ExpoMethod
  public void paymentRequestWithCardForm(Map<String, Object> unused, final Promise promise) {
    Activity currentActivity = getCurrentActivity();
    try {
      ArgCheck.nonNull(currentActivity);
      ArgCheck.notEmptyString(mPublicKey);

      final AddCardDialogFragment cardDialog = AddCardDialogFragment.newInstance(mPublicKey, mTag);
      cardDialog.setPromise(promise);
      cardDialog.show(currentActivity.getFragmentManager(), "AddNewCard");
    } catch (Exception e) {
      promise.reject(TAG, e.getMessage());
    }
  }

  @ExpoMethod
  public void paymentRequestWithAndroidPay(final Map<String, Object> payParams, final Promise promise) {
    getPayFlow().paymentRequestWithAndroidPay(payParams, promise);
  }

  @ExpoMethod
  public void createSourceWithParams(final Map<String, Object> options, final Promise promise) {
    String sourceType = (String)options.get("type");
    SourceParams sourceParams = null;

    if (isPropertyEmpty(options.get("returnURL"))) {
      Application application = getCurrentActivity().getApplication();
      Context context =  application.getApplicationContext();
      String prefix = getClass().getPackage().getName();
      try {
        ApplicationInfo applicationInfo = application.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
        Bundle bundle = applicationInfo.metaData;
        String standaloneScheme = bundle.getString(META_DATA_SCHEME_KEY);
        if (standaloneScheme != null) {
          prefix += "." + standaloneScheme;
        }
      } catch (Exception e) {
        // custom standaloneStripeScheme doesn't exist
        // using the default scheme - package name
      }
      String newReturnURL = prefix + "://" + mTag;
      options.put("returnURL", newReturnURL);
    }

    switch (sourceType) {
      case "alipay":
        sourceParams = SourceParams.createAlipaySingleUseParams(
            Math.round((Double)options.get("amount")),
            (String)options.get("currency"),
            getStringOrNull(options, "name"),
            getStringOrNull(options, "email"),
            (String)options.get("returnURL"));
        break;
      case "bancontact":
        sourceParams = SourceParams.createBancontactParams(
            Math.round((Double)options.get("amount")),
            (String)options.get("name"),
            (String)options.get("returnURL"),
            getStringOrNull(options, "statementDescriptor"));
        break;
      case "bitcoin":
        sourceParams = SourceParams.createBitcoinParams(
            Math.round((Double)options.get("amount")), (String)options.get("currency"), (String)options.get("email"));
        break;
      case "giropay":
        sourceParams = SourceParams.createGiropayParams(
            Math.round((Double)options.get("amount")),
            (String)options.get("name"),
            (String)options.get("returnURL"),
            getStringOrNull(options, "statementDescriptor"));
        break;
      case "ideal":
        sourceParams = SourceParams.createIdealParams(
            Math.round((Double)options.get("amount")),
            (String)options.get("name"),
            (String)options.get("returnURL"),
            getStringOrNull(options, "statementDescriptor"),
            getStringOrNull(options, "bank"));
        break;
      case "sepaDebit":
        sourceParams = SourceParams.createSepaDebitParams(
            (String)options.get("name"),
            (String)options.get("iban"),
            getStringOrNull(options, "addressLine1"),
            (String)options.get("city"),
            (String)options.get("postalCode"),
            (String)options.get("country"));
        break;
      case "sofort":
        sourceParams = SourceParams.createSofortParams(
            Math.round((Double)options.get("amount")),
            (String)options.get("returnURL"),
            (String)options.get("country"),
            getStringOrNull(options, "statementDescriptor"));
        break;
      case "threeDSecure":
        sourceParams = SourceParams.createThreeDSecureParams(
            Math.round(((Double)options.get("amount"))),
            (String)options.get("currency"),
            (String)options.get("returnURL"),
            (String)options.get("card"));
        break;
    }

    ArgCheck.nonNull(sourceParams);

    mStripe.createSource(sourceParams, new SourceCallback() {
      @Override
      public void onError(Exception error) {
        promise.reject(error);
      }

      @Override
      public void onSuccess(Source source) {
        if (Source.REDIRECT.equals(source.getFlow())) {
          Activity currentActivity = getCurrentActivity();
          if (currentActivity == null) {
            promise.reject(TAG, NO_CURRENT_ACTIVITY_MSG);
          } else {
            mCreateSourcePromise = promise;
            mCreatedSource = source;
            String redirectUrl = source.getRedirect().getUrl();
            Intent browserIntent = new Intent(currentActivity, OpenBrowserActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra(OpenBrowserActivity.EXTRA_URL, redirectUrl)
                .putExtra("tag", mTag);
            currentActivity.startActivity(browserIntent);
          }
        } else {
          promise.resolve(convertSourceToWritableMap(source));
        }
      }
    });
  }

  private boolean isPropertyEmpty(Object property) {
    if (property == null) {
      return true;
    }
    if (property instanceof String) {
      String stringProp = (String) property;
      return stringProp.equals("");
    }
    return false;
  }

  void processRedirect(@Nullable Uri redirectData) {
    if (mCreatedSource == null || mCreateSourcePromise == null) {

      return;
    }

    if (redirectData == null) {

      mCreateSourcePromise.reject(TAG, "Cancelled");
      mCreatedSource = null;
      mCreateSourcePromise = null;
      return;
    }

    final String clientSecret = redirectData.getQueryParameter("client_secret");
    if (!mCreatedSource.getClientSecret().equals(clientSecret)) {
      mCreateSourcePromise.reject(TAG, "Received redirect uri but there is no source to process");
      mCreatedSource = null;
      mCreateSourcePromise = null;
      return;
    }

    final String sourceId = redirectData.getQueryParameter("source");
    if (!mCreatedSource.getId().equals(sourceId)) {
      mCreateSourcePromise.reject(TAG, "Received wrong source id in redirect uri");
      mCreatedSource = null;
      mCreateSourcePromise = null;
      return;
    }

    final Promise promise = mCreateSourcePromise;

    // Nulls those properties to avoid processing them twice
    mCreatedSource = null;
    mCreateSourcePromise = null;

    new AsyncTask<Void, Void, Void>() {
      @Override
      protected Void doInBackground(Void... voids) {
        Source source = null;
        try {
          source = mStripe.retrieveSourceSynchronous(sourceId, clientSecret);
        } catch (Exception e) {

          return null;
        }

        switch (source.getStatus()) {
          case Source.CHARGEABLE:
          case Source.CONSUMED:
            promise.resolve(convertSourceToWritableMap(source));
            break;
          case Source.CANCELED:
            promise.reject(TAG, "User cancelled source redirect");
            break;
          case Source.PENDING:
          case Source.FAILED:
          case Source.UNKNOWN:
            promise.reject(TAG, "Source redirect failed");
        }
        return null;
      }
    }.execute();
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    this.mModuleRegistry = moduleRegistry;

    // Add the listener for `onActivityResult`
    mModuleRegistry.getModule(UIManager.class).registerActivityEventListener(mActivityEventListener);
  }
}
