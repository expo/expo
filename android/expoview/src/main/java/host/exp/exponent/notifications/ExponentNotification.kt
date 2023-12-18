// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.notifications

import expo.modules.jsonutils.getNullable
import host.exp.exponent.analytics.EXL.e
import host.exp.exponent.RNObject
import org.json.JSONException
import org.json.JSONObject

open class ExponentNotification(
  val experienceScopeKey: String,
  val body: String?,
  val notificationId: Int,
  val isMultiple: Boolean,
  val isRemote: Boolean
) {
  var actionType: String? = null
  var inputText: String? = null

  fun toJSONObject(origin: String?): JSONObject {
    return JSONObject().apply {
      try {
        put(NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY, experienceScopeKey)
        put(
          NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY,
          experienceScopeKey
        )
        if (origin != null) {
          put(NotificationConstants.NOTIFICATION_ORIGIN_KEY, origin)
        }
        put(NotificationConstants.NOTIFICATION_MESSAGE_KEY, body) // deprecated
        put(NotificationConstants.NOTIFICATION_DATA_KEY, body)
        put(NotificationConstants.NOTIFICATION_ID_KEY, notificationId)
        put(NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple)
        put(NotificationConstants.NOTIFICATION_REMOTE_KEY, isRemote)
      } catch (e: JSONException) {
        e(TAG, e.toString())
      }
    }
  }

  fun toWriteableMap(sdkVersion: String?, origin: String?): Any {
    return RNObject("com.facebook.react.bridge.Arguments").loadVersion(sdkVersion!!)
      .callStaticRecursive("createMap")!!.apply {
      if (origin != null) {
        call("putString", NotificationConstants.NOTIFICATION_ORIGIN_KEY, origin)
      }
      call("putString", NotificationConstants.NOTIFICATION_DATA_KEY, body)
      call("putInt", NotificationConstants.NOTIFICATION_ID_KEY, notificationId)
      call("putBoolean", NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY, isMultiple)
      call("putBoolean", NotificationConstants.NOTIFICATION_REMOTE_KEY, isRemote)
      call("putString", NotificationConstants.NOTIFICATION_ACTION_TYPE, actionType)
      call("putString", NotificationConstants.NOTIFICATION_INPUT_TEXT, inputText)
    }
      .get()!!
  }

  companion object {
    private val TAG = ExponentNotification::class.java.simpleName

    fun fromJSONObjectString(json: String?): ExponentNotification? {
      return if (json == null) {
        null
      } else {
        try {
          val jsonObject = JSONObject(json)
          val body = jsonObject.getNullable(NotificationConstants.NOTIFICATION_DATA_KEY)
            ?: jsonObject.getString(NotificationConstants.NOTIFICATION_MESSAGE_KEY)
          val experienceScopeKey = jsonObject.getNullable(NotificationConstants.NOTIFICATION_EXPERIENCE_SCOPE_KEY_KEY)
            ?: jsonObject.getString(NotificationConstants.NOTIFICATION_EXPERIENCE_ID_KEY)
          ExponentNotification(
            experienceScopeKey,
            body,
            jsonObject.getInt(NotificationConstants.NOTIFICATION_ID_KEY),
            jsonObject.getBoolean(NotificationConstants.NOTIFICATION_IS_MULTIPLE_KEY),
            jsonObject.getBoolean(NotificationConstants.NOTIFICATION_REMOTE_KEY)
          )
        } catch (e: JSONException) {
          e(TAG, e.toString())
          null
        }
      }
    }
  }
}
