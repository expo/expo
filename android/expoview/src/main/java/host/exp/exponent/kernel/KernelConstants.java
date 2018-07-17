// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.experience.DetachActivity;

public class KernelConstants {
  public static final String TAG = KernelConstants.class.getSimpleName();

  public static final String MANIFEST_KEY = "manifest";
  public static final String BUNDLE_URL_KEY = "bundleUrl";
  public static final String MANIFEST_URL_KEY = "experienceUrl";
  public static final String NOTIFICATION_MANIFEST_URL_KEY = "notificationExperienceUrl";
  public static final String SHORTCUT_MANIFEST_URL_KEY = "shortcutExperienceUrl";
  public static final String HOME_MANIFEST_URL = "";
  public static final String LINKING_URI_KEY = "linkingUri";
  public static final String INTENT_URI_KEY = "intentUri";
  public static final String IS_OPTIMISTIC_KEY = "isOptimistic";
  public static final String LOAD_FROM_CACHE_KEY = "loadFromCache";
  public static final String OPTION_LOAD_NUX_KEY = "loadNux";
  public static final String BUNDLE_TAG = "BUNDLE";
  public static final String HOME_MODULE_NAME = "main";
  public static final String BUNDLE_FILE_PREFIX = "cached-bundle-";
  public static final String KERNEL_BUNDLE_ID = "kernel";
  public static final String OPEN_OPTIMISTIC_EXPERIENCE_ACTIVITY_KEY = "openOptimisticExperienceActivity";
  public static final String OPEN_EXPERIENCE_ACTIVITY_KEY = "openExperienceActivity";
  public static final String LOAD_BUNDLE_FOR_EXPERIENCE_ACTIVITY_KEY = "loadBundleForExperienceActivity";
  public static final String EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY = "experienceIdSetForActivity";
  public static final long DELAY_TO_PRELOAD_KERNEL_JS = 5000;
  public static final int HTTP_NOT_MODIFIED = 304;
  public static final int OVERLAY_PERMISSION_REQUEST_CODE = 123;
  public static final String DEFAULT_APPLICATION_KEY = "main";

  public static final String NOTIFICATION_KEY = "notification";
  public static final String NOTIFICATION_ID_KEY = "notification_id";
  public static final String NOTIFICATION_OBJECT_KEY = "notification_object";
  public static final String DEV_FLAG = "dev_flag";

  public static Class MAIN_ACTIVITY_CLASS = DetachActivity.class;
  static {
    try {
      MAIN_ACTIVITY_CLASS = Class.forName("host.exp.exponent.MainActivity");
    } catch (Exception e) {
      EXL.e(TAG, "Could not find MainActivity, falling back to DetachActivity: " + e.getMessage());
    }
  }

  public static class ExperienceOptions {
    public final String manifestUri;
    public final String uri;
    public final String notification; // deprecated
    public final ExponentNotification notificationObject;

    public ExperienceOptions(String manifestUri, String uri, String notification) {
      this.manifestUri = manifestUri;
      this.uri = uri;
      this.notification = notification;
      this.notificationObject = null;
    }

    public ExperienceOptions(String manifestUri, String uri, String notification, ExponentNotification notificationObject) {
      this.manifestUri = manifestUri;
      this.uri = uri;
      this.notification = notification;
      this.notificationObject = notificationObject;
    }
  }

  public static class ExperienceEvent {
    public final String eventName;
    public final String eventPayload;

    public ExperienceEvent(String eventName, String eventPayload) {
      this.eventName = eventName;
      this.eventPayload = eventPayload;
    }
  }

  public static class AddedExperienceEventEvent {
    public final String manifestUrl;

    public AddedExperienceEventEvent(String manifestUrl) {
      this.manifestUrl = manifestUrl;
    }
  }
}
