// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

import host.exp.exponent.LauncherActivity
import host.exp.exponent.notifications.ExponentNotification

object KernelConstants {
  val TAG = KernelConstants::class.java.simpleName

  const val MANIFEST_URL_KEY = "experienceUrl"
  const val NOTIFICATION_MANIFEST_URL_KEY = "notificationExperienceUrl"
  const val NOTIFICATION_ACTION_TYPE_KEY = "actionType"

  // TODO: Remove once we decide to stop supporting shortcuts to experiences.
  const val SHORTCUT_MANIFEST_URL_KEY = "shortcutExperienceUrl"
  const val HOME_MANIFEST_URL = ""
  const val LINKING_URI_KEY = "linkingUri"
  const val INTENT_URI_KEY = "intentUri"
  const val IS_HEADLESS_KEY = "isHeadless"
  const val IS_OPTIMISTIC_KEY = "isOptimistic"
  const val LOAD_FROM_CACHE_KEY = "loadFromCache"
  const val BUNDLE_TAG = "BUNDLE"
  const val HOME_MODULE_NAME = "main"
  const val BUNDLE_FILE_PREFIX = "cached-bundle-"
  const val KERNEL_BUNDLE_ID = "kernel"
  const val OPEN_OPTIMISTIC_EXPERIENCE_ACTIVITY_KEY = "openOptimisticExperienceActivity"
  const val OPEN_EXPERIENCE_ACTIVITY_KEY = "openExperienceActivity"
  const val LOAD_BUNDLE_FOR_EXPERIENCE_ACTIVITY_KEY = "loadBundleForExperienceActivity"
  const val EXPERIENCE_ID_SET_FOR_ACTIVITY_KEY = "experienceIdSetForActivity"
  const val HTTP_NOT_MODIFIED = 304
  const val OVERLAY_PERMISSION_REQUEST_CODE = 123
  const val DEFAULT_APPLICATION_KEY = "main"
  const val NOTIFICATION_KEY = "notification"
  const val NOTIFICATION_ID_KEY = "notification_id"
  const val NOTIFICATION_OBJECT_KEY = "notification_object"

  var MAIN_ACTIVITY_CLASS: Class<*> = LauncherActivity::class.java

  class ExperienceOptions {
    val manifestUri: String
    val uri: String?

    @Deprecated("deprecated")
    val notification: String?
    val notificationObject: ExponentNotification?

    constructor(manifestUri: String, uri: String?, notification: String?) {
      this.manifestUri = manifestUri
      this.uri = uri
      this.notification = notification
      this.notificationObject = null
    }

    constructor(
      manifestUri: String,
      uri: String?,
      notification: String?,
      notificationObject: ExponentNotification?
    ) {
      this.manifestUri = manifestUri
      this.uri = uri
      this.notification = notification
      this.notificationObject = notificationObject
    }
  }

  data class ExperienceEvent(val eventName: String, val eventPayload: String)
  data class AddedExperienceEventEvent(val manifestUrl: String)
}
