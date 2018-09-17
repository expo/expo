package expo.modules.firebase.invites;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.ReactContext;
import com.google.android.gms.appinvite.AppInviteInvitation;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.appinvite.FirebaseAppInvite;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import com.google.firebase.dynamiclinks.PendingDynamicLinkData;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.modules.firebase.app.Utils;

public class FirebaseInvitesModule extends ExportedModule
    implements ModuleRegistryConsumer, LifecycleEventListener, ActivityEventListener {

  private static final String TAG = FirebaseInvitesModule.class.getCanonicalName();

  private static final int REQUEST_INVITE = 81283;
  private boolean mInitialInvitationInitialized = false;
  private String mInitialDeepLink = null;
  private String mInitialInvitationId = null;
  private Promise mPromise = null;

  private ModuleRegistry mModuleRegistry;

  public FirebaseInvitesModule(Context context) {
    super(context);

    // TODO:Bacon: Remove React
    if (getApplicationContext() instanceof ReactContext) {
      ((ReactContext) getApplicationContext()).addActivityEventListener(this);
    }
  }

  @Override
  public String getName() {
    return "ExpoFirebaseInvites";
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

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  protected final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  @ExpoMethod
  public void getInitialInvitation(final Promise promise) {
    if (mInitialInvitationInitialized) {
      if (mInitialDeepLink != null || mInitialInvitationId != null) {
        promise.resolve(buildInvitationMap(mInitialDeepLink, mInitialInvitationId));
      } else {
        promise.resolve(null);
      }
    } else {
      if (getCurrentActivity() != null) {
        FirebaseDynamicLinks.getInstance().getDynamicLink(getCurrentActivity().getIntent())
            .addOnSuccessListener(new OnSuccessListener<PendingDynamicLinkData>() {
              @Override
              public void onSuccess(PendingDynamicLinkData pendingDynamicLinkData) {
                if (pendingDynamicLinkData != null) {
                  FirebaseAppInvite invite = FirebaseAppInvite.getInvitation(pendingDynamicLinkData);
                  if (invite == null) {
                    promise.resolve(null);
                    return;
                  }

                  mInitialDeepLink = pendingDynamicLinkData.getLink().toString();
                  mInitialInvitationId = invite.getInvitationId();
                  promise.resolve(buildInvitationMap(mInitialDeepLink, mInitialInvitationId));
                } else {
                  promise.resolve(null);
                }
                mInitialInvitationInitialized = true;
              }
            }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception e) {
                Log.e(TAG, "getInitialInvitation: failed to resolve invitation", e);
                promise.reject("invites/initial-invitation-error", e.getMessage(), e);
              }
            });
      } else {
        Log.d(TAG, "getInitialInvitation: activity is null");
        promise.resolve(null);
      }
    }
  }

  @ExpoMethod
  public void sendInvitation(Map<String, Object> invitationMap, Promise promise) {
    if (!invitationMap.containsKey("message")) {
      promise.reject("invites/invalid-invitation", "The supplied invitation is missing a 'message' field");
      return;
    }
    if (!invitationMap.containsKey("title")) {
      promise.reject("invites/invalid-invitation", "The supplied invitation is missing a 'title' field");
      return;
    }

    AppInviteInvitation.IntentBuilder ib = new AppInviteInvitation.IntentBuilder((String) invitationMap.get("title"));
    if (invitationMap.containsKey("androidMinimumVersionCode")) {
      Double androidMinimumVersionCode = (double) invitationMap.get("androidMinimumVersionCode");
      ib = ib.setAndroidMinimumVersionCode(androidMinimumVersionCode.intValue());
    }
    if (invitationMap.containsKey("callToActionText")) {
      ib = ib.setCallToActionText((CharSequence) invitationMap.get("callToActionText"));
    }
    if (invitationMap.containsKey("customImage")) {
      ib = ib.setCustomImage(Uri.parse((String) invitationMap.get("customImage")));
    }
    if (invitationMap.containsKey("deepLink")) {
      ib = ib.setDeepLink(Uri.parse((String) invitationMap.get("deepLink")));
    }
    if (invitationMap.containsKey("iosClientId")) {
      ib = ib.setOtherPlatformsTargetApplication(AppInviteInvitation.IntentBuilder.PlatformMode.PROJECT_PLATFORM_IOS,
          (String) invitationMap.get("iosClientId"));
    }
    ib = ib.setMessage((CharSequence) invitationMap.get("message"));

    // Android specific properties
    if (invitationMap.containsKey("android")) {
      Map<String, Object> androidMap = (Map<String, Object>) invitationMap.get("android");

      if (androidMap.containsKey("additionalReferralParameters")) {
        Map<String, String> arpMap = new HashMap<>();
        Map<String, String> arpReadableMap = (Map<String, String>) androidMap.get("additionalReferralParameters");
        Iterator<String> iterator = arpReadableMap.keySet().iterator();
        while (iterator.hasNext()) {
          String key = iterator.next();
          arpMap.put(key, arpReadableMap.get(key));
        }
        ib = ib.setAdditionalReferralParameters(arpMap);
      }
      if (androidMap.containsKey("emailHtmlContent")) {
        ib = ib.setEmailHtmlContent((String) androidMap.get("emailHtmlContent"));
      }
      if (androidMap.containsKey("emailSubject")) {
        ib = ib.setEmailSubject((String) androidMap.get("emailSubject"));
      }
      if (androidMap.containsKey("googleAnalyticsTrackingId")) {
        ib = ib.setGoogleAnalyticsTrackingId((String) androidMap.get("googleAnalyticsTrackingId"));
      }
    }

    Intent invitationIntent = ib.build();
    // Save the promise for later
    this.mPromise = promise;

    // Start the intent
    this.getCurrentActivity().startActivityForResult(invitationIntent, REQUEST_INVITE);
  }

  //////////////////////////////////////////////////////////////////////
  // Start ActivityEventListener methods
  //////////////////////////////////////////////////////////////////////
  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode == REQUEST_INVITE) {
      if (resultCode == Activity.RESULT_OK) {
        String[] ids = AppInviteInvitation.getInvitationIds(resultCode, data);
        mPromise.resolve(Arrays.asList(ids));
      } else if (resultCode == Activity.RESULT_CANCELED) {
        mPromise.reject("invites/invitation-cancelled", "Invitation cancelled");
      } else {
        mPromise.reject("invites/invitation-error", "Invitation failed to send");
      }
      // Clear the promise
      mPromise = null;
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    FirebaseDynamicLinks.getInstance().getDynamicLink(intent)
        .addOnSuccessListener(new OnSuccessListener<PendingDynamicLinkData>() {
          @Override
          public void onSuccess(PendingDynamicLinkData pendingDynamicLinkData) {
            if (pendingDynamicLinkData != null) {
              FirebaseAppInvite invite = FirebaseAppInvite.getInvitation(pendingDynamicLinkData);
              if (invite == null) {
                // this is a dynamic link, not an invitation
                return;
              }

              String deepLink = pendingDynamicLinkData.getLink().toString();
              String invitationId = invite.getInvitationId();
              Bundle invitationMap = buildInvitationMap(deepLink, invitationId);
              Utils.sendEvent(mModuleRegistry, "invites_invitation_received", invitationMap);
            }
          }
        });
  }
  //////////////////////////////////////////////////////////////////////
  // End ActivityEventListener methods
  //////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////
  // Start LifecycleEventListener methods
  //////////////////////////////////////////////////////////////////////
  @Override
  public void onHostResume() {
    // Not required for this module
  }

  @Override
  public void onHostPause() {
    // Not required for this module
  }

  @Override
  public void onHostDestroy() {
    mInitialDeepLink = null;
    mInitialInvitationId = null;
    mInitialInvitationInitialized = false;
  }
  //////////////////////////////////////////////////////////////////////
  // End LifecycleEventListener methods
  //////////////////////////////////////////////////////////////////////

  private Bundle buildInvitationMap(String deepLink, String invitationId) {
    Bundle invitationMap = new Bundle();
    invitationMap.putString("deepLink", deepLink);
    invitationMap.putString("invitationId", invitationId);

    return invitationMap;
  }
}
