// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import host.exp.exponent.gcm.ExponentPushNotification;

public class KernelConstants {
  public static final String MANIFEST_KEY = "manifest";
  public static final String BUNDLE_URL_KEY = "bundleUrl";
  public static final String MANIFEST_URL_KEY = "experienceUrl";
  public static final String HOME_MANIFEST_URL = "";
  public static final String LINKING_URI_KEY = "linkingUri";
  public static final String INTENT_URI_KEY = "intentUri";
  public static final String IS_OPTIMISTIC_KEY = "isOptimistic";
  public static final String OPTION_LOAD_NUX_KEY = "loadNux";
  public static final String BUNDLE_TAG = "BUNDLE";
  public static final String HOME_MODULE_NAME = "ExponentApp";
  public static final String BUNDLE_FILE_PREFIX = "cached-bundle-";
  public static final String KERNEL_BUNDLE_ID = "kernel";
  public static final String OPEN_EXPERIENCE_ACTIVITY_KEY = "openExperienceActivity";
  public static final long DELAY_TO_PRELOAD_KERNEL_JS = 5000;
  public static final int HTTP_NOT_MODIFIED = 304;
  public static final int OVERLAY_PERMISSION_REQUEST_CODE = 123;
  public static final String DEFAULT_APPLICATION_KEY = "main";

  public static final String NOTIFICATION_KEY = "notification";
  public static final String NOTIFICATION_ID_KEY = "notification_id";
  public static final String NOTIFICATION_OBJECT_KEY = "notification_object";
  public static final String DEV_FLAG = "dev_flag";

  public static String MAIN_ACTIVITY_NAME = "host.exp.exponentview.ExponentActivity";
  public static String SCHEDULED_NOTIFICATION_RECEIVER_NAME = "host.exp.exponentview.notifications.ScheduledNotificationReceiver";

  public static class ExperienceOptions {
    public final String manifestUri;
    public final String uri;
    public final String notification; // deprecated
    public final ExponentPushNotification notificationObject;

    public ExperienceOptions(String manifestUri, String uri, String notification) {
      this.manifestUri = manifestUri;
      this.uri = uri;
      this.notification = notification;
      this.notificationObject = null;
    }

    public ExperienceOptions(String manifestUri, String uri, String notification, ExponentPushNotification notificationObject) {
      this.manifestUri = manifestUri;
      this.uri = uri;
      this.notification = notification;
      this.notificationObject = notificationObject;
    }
  }
}
