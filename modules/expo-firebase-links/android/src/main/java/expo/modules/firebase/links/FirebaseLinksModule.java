package expo.modules.firebase.links;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.ReactContext;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.appinvite.FirebaseAppInvite;
import com.google.firebase.dynamiclinks.DynamicLink;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import com.google.firebase.dynamiclinks.PendingDynamicLinkData;
import com.google.firebase.dynamiclinks.ShortDynamicLink;

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

public class FirebaseLinksModule extends ExportedModule
    implements ModuleRegistryConsumer, ActivityEventListener, LifecycleEventListener {

  private static final String TAG = FirebaseLinksModule.class.getCanonicalName();
  private String mInitialLink = null;
  private boolean mInitialLinkInitialized = false;
  private ModuleRegistry mModuleRegistry;

  public FirebaseLinksModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoFirebaseLinks";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null) {
      if (getApplicationContext() instanceof ReactContext) {
        ((ReactContext) getApplicationContext()).removeActivityEventListener(this);
      }

      if (mModuleRegistry.getModule(UIManager.class) != null) {
        mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
      }
    }

    mModuleRegistry = moduleRegistry;

    if (mModuleRegistry != null) {
      // TODO:Bacon: Remove React
      if (getApplicationContext() instanceof ReactContext) {
        ((ReactContext) getApplicationContext()).addActivityEventListener(this);
      }

      // Register to new UIManager
      if (mModuleRegistry.getModule(UIManager.class) != null) {
        mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
      }
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
  public void createDynamicLink(final Map<String, Object> linkData, final Promise promise) {
    try {
      DynamicLink.Builder builder = getDynamicLinkBuilder(linkData);
      String link = builder.buildDynamicLink().getUri().toString();
      Log.d(TAG, "created dynamic link: " + link);
      promise.resolve(link);
    } catch (Exception ex) {
      Log.e(TAG, "create dynamic link failure " + ex.getMessage());
      promise.reject("links/failure", ex.getMessage(), ex);
    }
  }

  @ExpoMethod
  public void createShortDynamicLink(final Map<String, Object> linkData, final String type, final Promise promise) {
    try {
      DynamicLink.Builder builder = getDynamicLinkBuilder(linkData);
      Task<ShortDynamicLink> shortLinkTask;
      if ("SHORT".equals(type)) {
        shortLinkTask = builder.buildShortDynamicLink(ShortDynamicLink.Suffix.SHORT);
      } else if ("UNGUESSABLE".equals(type)) {
        shortLinkTask = builder.buildShortDynamicLink(ShortDynamicLink.Suffix.UNGUESSABLE);
      } else {
        shortLinkTask = builder.buildShortDynamicLink();
      }

      shortLinkTask.addOnCompleteListener(new OnCompleteListener<ShortDynamicLink>() {
        @Override
        public void onComplete(@NonNull Task<ShortDynamicLink> task) {
          if (task.isSuccessful()) {
            String shortLink = task.getResult().getShortLink().toString();
            Log.d(TAG, "created short dynamic link: " + shortLink);
            promise.resolve(shortLink);
          } else {
            Log.e(TAG, "create short dynamic link failure " + task.getException().getMessage());
            promise.reject("links/failure", task.getException().getMessage(), task.getException());
          }
        }
      });
    } catch (Exception ex) {
      Log.e(TAG, "create short dynamic link failure " + ex.getMessage());
      promise.reject("links/failure", ex.getMessage(), ex);
    }
  }

  @ExpoMethod
  public void getInitialLink(final Promise promise) {
    if (mInitialLinkInitialized) {
      promise.resolve(mInitialLink);
    } else {
      if (getCurrentActivity() != null) {
        FirebaseDynamicLinks.getInstance().getDynamicLink(getCurrentActivity().getIntent())
            .addOnSuccessListener(new OnSuccessListener<PendingDynamicLinkData>() {
              @Override
              public void onSuccess(PendingDynamicLinkData pendingDynamicLinkData) {
                if (pendingDynamicLinkData != null && !isInvitation(pendingDynamicLinkData)) {

                  mInitialLink = pendingDynamicLinkData.getLink().toString();
                }
                Log.d(TAG, "getInitialLink: link is: " + mInitialLink);
                mInitialLinkInitialized = true;
                promise.resolve(mInitialLink);
              }
            }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception e) {
                Log.e(TAG, "getInitialLink: failed to resolve link", e);
                promise.reject("link/initial-link-error", e.getMessage(), e);
              }
            });
      } else {
        Log.d(TAG, "getInitialLink: activity is null");
        promise.resolve(null);
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  // Start ActivityEventListener methods
  //////////////////////////////////////////////////////////////////////
  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    // Not required for this module
  }

  @Override
  public void onNewIntent(Intent intent) {
    FirebaseDynamicLinks.getInstance().getDynamicLink(intent)
        .addOnSuccessListener(new OnSuccessListener<PendingDynamicLinkData>() {
          @Override
          public void onSuccess(PendingDynamicLinkData pendingDynamicLinkData) {
            if (pendingDynamicLinkData != null && !isInvitation(pendingDynamicLinkData)) {
              String link = pendingDynamicLinkData.getLink().toString();
              Bundle linkPayload = new Bundle();
              linkPayload.putString("link", link);
              Utils.sendEvent(mModuleRegistry, "links_link_received", linkPayload);
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
    mInitialLink = null;
    mInitialLinkInitialized = false;
  }
  //////////////////////////////////////////////////////////////////////
  // End LifecycleEventListener methods
  //////////////////////////////////////////////////////////////////////

  // Looks at the internals of the link data to detect whether it's an invitation
  // or not
  private boolean isInvitation(PendingDynamicLinkData pendingDynamicLinkData) {
    FirebaseAppInvite invite = FirebaseAppInvite.getInvitation(pendingDynamicLinkData);
    if (invite != null && invite.getInvitationId() != null && !invite.getInvitationId().isEmpty()) {
      return true;
    }
    return false;
  }

  private DynamicLink.Builder getDynamicLinkBuilder(final Map<String, Object> linkData) {
    DynamicLink.Builder builder = FirebaseDynamicLinks.getInstance().createDynamicLink();
    try {
      builder.setLink(Uri.parse((String) linkData.get("link")));
      builder.setDynamicLinkDomain((String) linkData.get("dynamicLinkDomain"));
      setAnalyticsParameters((Map<String, Object>) linkData.get("analytics"), builder);
      setAndroidParameters((Map<String, Object>) linkData.get("android"), builder);
      setIosParameters((Map<String, Object>) linkData.get("ios"), builder);
      setITunesParameters((Map<String, Object>) linkData.get("itunes"), builder);
      setNavigationParameters((Map<String, Object>) linkData.get("navigation"), builder);
      setSocialParameters((Map<String, Object>) linkData.get("social"), builder);
    } catch (Exception e) {
      Log.e(TAG, "error while building parameters " + e.getMessage());
      throw e;
    }
    return builder;
  }

  private void setAnalyticsParameters(final Map<String, Object> analyticsData, final DynamicLink.Builder builder) {
    DynamicLink.GoogleAnalyticsParameters.Builder analyticsParameters = new DynamicLink.GoogleAnalyticsParameters.Builder();

    if (analyticsData.containsKey("campaign")) {
      analyticsParameters.setCampaign((String) analyticsData.get("campaign"));
    }
    if (analyticsData.containsKey("content")) {
      analyticsParameters.setContent((String) analyticsData.get("content"));
    }
    if (analyticsData.containsKey("medium")) {
      analyticsParameters.setMedium((String) analyticsData.get("medium"));
    }
    if (analyticsData.containsKey("source")) {
      analyticsParameters.setSource((String) analyticsData.get("source"));
    }
    if (analyticsData.containsKey("term")) {
      analyticsParameters.setTerm((String) analyticsData.get("term"));
    }
    builder.setGoogleAnalyticsParameters(analyticsParameters.build());
  }

  private void setAndroidParameters(final Map<String, Object> androidData, final DynamicLink.Builder builder) {
    if (androidData.containsKey("packageName")) {
      DynamicLink.AndroidParameters.Builder androidParameters = new DynamicLink.AndroidParameters.Builder(
          (String) androidData.get("packageName"));

      if (androidData.containsKey("fallbackUrl")) {
        androidParameters.setFallbackUrl(Uri.parse((String) androidData.get("fallbackUrl")));
      }
      if (androidData.containsKey("minimumVersion")) {
        androidParameters.setMinimumVersion(Integer.parseInt((String) androidData.get("minimumVersion")));
      }
      builder.setAndroidParameters(androidParameters.build());
    }
  }

  private void setIosParameters(final Map<String, Object> iosData, final DynamicLink.Builder builder) {
    if (iosData.containsKey("bundleId")) {
      DynamicLink.IosParameters.Builder iosParameters = new DynamicLink.IosParameters.Builder(
          (String) iosData.get("bundleId"));

      if (iosData.containsKey("appStoreId")) {
        iosParameters.setAppStoreId((String) iosData.get("appStoreId"));
      }
      if (iosData.containsKey("customScheme")) {
        iosParameters.setCustomScheme((String) iosData.get("customScheme"));
      }
      if (iosData.containsKey("fallbackUrl")) {
        iosParameters.setFallbackUrl(Uri.parse((String) iosData.get("fallbackUrl")));
      }
      if (iosData.containsKey("iPadBundleId")) {
        iosParameters.setIpadBundleId((String) iosData.get("iPadBundleId"));
      }
      if (iosData.containsKey("iPadFallbackUrl")) {
        iosParameters.setIpadFallbackUrl(Uri.parse((String) iosData.get("iPadFallbackUrl")));
      }
      if (iosData.containsKey("minimumVersion")) {
        iosParameters.setMinimumVersion((String) iosData.get("minimumVersion"));
      }
      builder.setIosParameters(iosParameters.build());
    }
  }

  private void setITunesParameters(final Map<String, Object> itunesData, final DynamicLink.Builder builder) {
    DynamicLink.ItunesConnectAnalyticsParameters.Builder itunesParameters = new DynamicLink.ItunesConnectAnalyticsParameters.Builder();

    if (itunesData.containsKey("affiliateToken")) {
      itunesParameters.setAffiliateToken((String) itunesData.get("affiliateToken"));
    }
    if (itunesData.containsKey("campaignToken")) {
      itunesParameters.setCampaignToken((String) itunesData.get("campaignToken"));
    }
    if (itunesData.containsKey("providerToken")) {
      itunesParameters.setProviderToken((String) itunesData.get("providerToken"));
    }
    builder.setItunesConnectAnalyticsParameters(itunesParameters.build());
  }

  private void setNavigationParameters(final Map<String, Object> navigationData, final DynamicLink.Builder builder) {
    DynamicLink.NavigationInfoParameters.Builder navigationParameters = new DynamicLink.NavigationInfoParameters.Builder();

    if (navigationData.containsKey("forcedRedirectEnabled")) {
      navigationParameters.setForcedRedirectEnabled((Boolean) navigationData.get("forcedRedirectEnabled"));
    }
    builder.setNavigationInfoParameters(navigationParameters.build());
  }

  private void setSocialParameters(final Map<String, Object> socialData, final DynamicLink.Builder builder) {
    DynamicLink.SocialMetaTagParameters.Builder socialParameters = new DynamicLink.SocialMetaTagParameters.Builder();

    if (socialData.containsKey("descriptionText")) {
      socialParameters.setDescription((String) socialData.get("descriptionText"));
    }
    if (socialData.containsKey("imageUrl")) {
      socialParameters.setImageUrl(Uri.parse((String) socialData.get("imageUrl")));
    }
    if (socialData.containsKey("title")) {
      socialParameters.setTitle((String) socialData.get("title"));
    }
    builder.setSocialMetaTagParameters(socialParameters.build());
  }
}
