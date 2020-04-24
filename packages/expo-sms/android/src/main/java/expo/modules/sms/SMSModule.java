package expo.modules.sms;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Telephony;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.services.UIManager;

import androidx.annotation.Nullable;

public class SMSModule extends ExportedModule implements LifecycleEventListener {
  private static final String TAG = "ExpoSMS";
  private static final String ERROR_TAG = "E_SMS";

  private static final String OPTIONS_ATTACHMENTS_KEY = "attachments";

  private ModuleRegistry mModuleRegistry;
  private Promise mPendingPromise;
  private boolean mSMSComposerOpened = false;

  SMSModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    if (mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  @Override
  public void onDestroy() {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = null;
  }

  @ExpoMethod
  public void sendSMSAsync(
      final ArrayList<String> addresses,
      final String message,
      final @Nullable Map<String, Object> options,
      final Promise promise) {
    if (mPendingPromise != null) {
      promise.reject(ERROR_TAG + "_SENDING_IN_PROGRESS", "Different SMS sending in progress. Await the old request and then try again.");
      return;
    }

    Intent SMSIntent = new Intent(Intent.ACTION_SEND);
    String defaultSMSPackage = Telephony.Sms.getDefaultSmsPackage(getContext());
    if (defaultSMSPackage != null){
      SMSIntent.setPackage(defaultSMSPackage);
    } else {
      promise.reject(ERROR_TAG + "_NO_SMS_APP", "No messaging application available");
      return;
    }
    SMSIntent.setType("text/plain");
    final String smsTo = constructRecipients(addresses);
    SMSIntent.putExtra("address", smsTo);

    SMSIntent.putExtra("exit_on_sent", true);
    SMSIntent.putExtra("compose_mode", true);
    SMSIntent.putExtra(Intent.EXTRA_TEXT, message);
    SMSIntent.putExtra("sms_body", message);

    if (options != null) {
      if (options.containsKey(OPTIONS_ATTACHMENTS_KEY)) {
        final List<Map<String, String>> attachments = (List<Map<String, String>>) options.get(OPTIONS_ATTACHMENTS_KEY);
        if (attachments != null && !attachments.isEmpty()) {
          Map<String, String> attachment = attachments.get(0);
          SMSIntent.putExtra(Intent.EXTRA_STREAM, Uri.parse(attachment.get("uri")));
          SMSIntent.setType(attachment.get("mimeType"));
        }
      }
    }

    mPendingPromise = promise;

    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    activityProvider.getCurrentActivity().startActivity(SMSIntent);

    mSMSComposerOpened = true;
  }

  @ExpoMethod
  public void isAvailableAsync(final Promise promise) {
    if (getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }

  @Override
  public void onHostResume() {
    if (mSMSComposerOpened && mPendingPromise != null) {
      // the only way to check the status of the message is to query the device's SMS database
      // but this requires READ_SMS permission, which Google is heavily restricting beginning Jan 2019
      // so we just resolve with an unknown value
      Bundle result = new Bundle();
      result.putString("result", "unknown");
      mPendingPromise.resolve(result);
      mPendingPromise = null;
    }
    mSMSComposerOpened = false;
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }

  private String constructRecipients(List<String> addresses) {
    if (addresses.size() > 0) {
      final StringBuilder addressesBuilder = new StringBuilder(addresses.get(0));
      for (String address : addresses) {
        addressesBuilder.append(';').append(address);
      }
      return addressesBuilder.toString();
    }
    return "";
  }

}
