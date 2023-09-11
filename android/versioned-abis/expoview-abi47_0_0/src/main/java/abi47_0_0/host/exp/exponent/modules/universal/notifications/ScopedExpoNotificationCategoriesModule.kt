package abi47_0_0.host.exp.exponent.modules.universal.notifications

import android.content.Context
import android.os.Bundle
import android.os.ResultReceiver
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule
import expo.modules.notifications.notifications.model.NotificationCategory
import abi47_0_0.expo.modules.notifications.service.NotificationsService
import host.exp.exponent.kernel.ExperienceKey
import abi47_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils
import java.util.*

class ScopedExpoNotificationCategoriesModule(
  context: Context,
  private val experienceKey: ExperienceKey
) : ExpoNotificationCategoriesModule(context) {
  override fun getNotificationCategoriesAsync(promise: Promise) {
    NotificationsService.getCategories(
      context,
      object : ResultReceiver(null) {
        override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
          val categories = resultData?.getParcelableArrayList<NotificationCategory>(NotificationsService.NOTIFICATION_CATEGORIES_KEY)
          if (resultCode == NotificationsService.SUCCESS_CODE && categories != null) {
            promise.resolve(serializeScopedCategories(categories))
          } else {
            promise.reject(
              "ERR_CATEGORIES_FETCH_FAILED",
              "A list of notification categories could not be fetched."
            )
          }
        }
      }
    )
  }

  override fun setNotificationCategoryAsync(
    identifier: String,
    actionArguments: List<HashMap<String, Any>>,
    categoryOptions: HashMap<String, Any>?,
    promise: Promise
  ) {
    val scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, identifier)
    super.setNotificationCategoryAsync(
      scopedCategoryIdentifier,
      actionArguments,
      categoryOptions,
      promise
    )
  }

  override fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    val scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, identifier)
    super.deleteNotificationCategoryAsync(scopedCategoryIdentifier, promise)
  }

  private fun serializeScopedCategories(categories: Collection<NotificationCategory>): ArrayList<Bundle?> {
    val serializedCategories = arrayListOf<Bundle?>()
    for (category in categories) {
      if (ScopedNotificationsIdUtils.checkIfCategoryBelongsToExperience(experienceKey, category)) {
        serializedCategories.add(mSerializer.toBundle(category))
      }
    }
    return serializedCategories
  }
}
