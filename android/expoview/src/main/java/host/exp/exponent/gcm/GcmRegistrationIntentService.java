// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;

import java.io.IOException;

import host.exp.exponent.notifications.ExponentNotificationIntentService;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

public class GcmRegistrationIntentService extends ExponentNotificationIntentService {

  private static final String TAG = GcmRegistrationIntentService.class.getSimpleName();

  public GcmRegistrationIntentService() {
    super(TAG);
  }

  @Override
  public String getToken() throws IOException {
    InstanceID instanceID = InstanceID.getInstance(this);
    return instanceID.getToken(Exponent.getInstance().getGCMSenderId(),
        GoogleCloudMessaging.INSTANCE_ID_SCOPE, null);
  }

  @Override
  public String getSharedPrefsKey() {
    return ExponentSharedPreferences.GCM_TOKEN_KEY;
  }

  @Override
  public String getServerType() {
    return "gcm";
  }
}
