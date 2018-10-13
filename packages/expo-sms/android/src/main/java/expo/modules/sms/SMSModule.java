package expo.modules.sms;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.PhoneNumberUtils;

import java.util.ArrayList;
import java.util.Date;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.Permissions;

public class SMSModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener {
  private static final String TAG = "ExpoSMS";
  private static final String ERROR_TAG = "E_SMS";

  private ModuleRegistry mModuleRegistry;
  private Promise mPromise;
  private Date mDate;
  private ArrayList<String> mAddresses;

  SMSModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  @ExpoMethod
  public void sendSMSAsync(final ArrayList<String> addresses, final String message, final Promise promise) {

    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY) &&
        !getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY_CDMA)) {
      promise.reject(ERROR_TAG + "_UNAVAILABLE", "SMS service not available");
      return;
    }

    Permissions permissionsManager = mModuleRegistry.getModule(Permissions.class);
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }

    int[] grantResults = permissionsManager.getPermissions(new String[] { Manifest.permission.READ_SMS });
    if (grantResults.length != 1 || grantResults[0] != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_NO_PERMISSIONS", "SMS permission is not granted. Ensure that user permits SMS usage via permissions module.");
      return;
    }

    if (mPromise != null) {
      promise.reject(ERROR_TAG + "_SENDING_IN_PROGRESS", "Different SMS sending in progress. Await the old request and then try again.");
      return;
    }
    mPromise = promise;
    mDate = new Date();
    mAddresses = new ArrayList<>(addresses);

    final StringBuilder addressesBuilder = new StringBuilder(addresses.get(0));
    for (int idx = 1; idx < addresses.size(); idx++) {
      addressesBuilder.append(';').append(addresses.get(idx));
    }

    final Intent SMSIntent = new Intent(Intent.ACTION_SENDTO);
    final String smsTo = addressesBuilder.toString();
    SMSIntent.setData(Uri.parse("smsto:" + smsTo));
    SMSIntent.putExtra("exit_on_sent", true);
    SMSIntent.putExtra("compose_mode", true);
    SMSIntent.putExtra(Intent.EXTRA_TEXT, message);
    SMSIntent.putExtra("sms_body", message);

    if (SMSIntent.resolveActivity(getContext().getPackageManager()) == null) {
      promise.reject(ERROR_TAG + "_NO_SMS_APP", "No messaging application available");
      return;
    }

    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    activityProvider.getCurrentActivity().startActivity(SMSIntent);
  }

  @ExpoMethod
  public void isAvailableAsync(final Promise promise) {
    if (getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }

  private void checkSMSMessageStatus() {
    if (mPromise == null) {
      return;
    }

    final String[] PROJECTION = {
        Telephony.Sms.ADDRESS,
        Telephony.Sms.STATUS,
    };
    final ContentResolver resolver = getContext().getContentResolver();
    final Uri uri = Telephony.Sms.CONTENT_URI;

    final Bundle result = new Bundle();
    final ArrayList<String> addresses = new ArrayList<>(mAddresses);

    // Querying all SMS messages to check whether user has sent message to every recipient
    Cursor cursor = null;
    try {
      cursor = resolver.query(uri, PROJECTION,
          // Only outgoing messages are checked
          "(type = " + Telephony.Sms.MESSAGE_TYPE_SENT
              + " OR type = " + Telephony.Sms.MESSAGE_TYPE_OUTBOX
              + " OR type = " + Telephony.Sms.MESSAGE_TYPE_QUEUED
              + ") AND date >= ?",
          new String[]{ String.valueOf(mDate.getTime()) },
          null);

      if (cursor != null) {
        boolean goToFirstResult = true;
        boolean rejected = false;
        while (!addresses.isEmpty()) {
          if (goToFirstResult) {
            if (cursor.moveToFirst()) {
              goToFirstResult = false;
            } else {
              break;
            }
          } else {
            if (!cursor.moveToNext()) {
              break;
            }
          }

          final String address = cursor.getString(cursor.getColumnIndex(Telephony.Sms.ADDRESS));
          final int status = cursor.getInt(cursor.getColumnIndex(Telephony.Sms.STATUS));

          // Find recipient address
          String foundAddress = null;
          for (String a : addresses) {
            if (PhoneNumberUtils.compare(address, a)) {
              foundAddress = a;
              break;
            }
          }
          if (foundAddress == null) {
            continue;
          }

          if (status == Telephony.Sms.STATUS_FAILED) {
            rejected = true;
            mPromise.reject(ERROR_TAG + "_SENDING_FAILED", "SMS message sending failed");
            break;
          }

          // Some outgoing message to this number found - success; remove address from searching list
          addresses.remove(foundAddress);
        }

        if (!rejected) {
          // Depending on number of addresses that actually were used:
          // - all/partially:
          //        status: sent
          // - none:
          //        status: cancelled
          if (addresses.isEmpty() || addresses.size() != mAddresses.size()) {
            result.putString("result", "sent");
          } else {
            result.putString("result", "cancelled");
          }
          mPromise.resolve(result);
        }
      }
    } catch (Exception e) {
      mPromise.reject(ERROR_TAG + "_SENDING_FAILED", "Couldn't check SMS status");
    } finally {
      if (cursor != null) {
        cursor.close();
      }
    }

    // cleanup
    mAddresses = null;
    mDate = null;
    mPromise = null;
  }

  @Override
  public void onHostResume() {
    checkSMSMessageStatus();
  }

  @Override
  public void onHostPause() {
    // do nothing
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }
}
