package expo.modules.notifications.permissions

import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class AndroidNotificationPermissionDetails(
  @Field
  val importance: Int,
  @Field
  val interruptionFilter: Int
) : Record

@OptimizedRecord
class NotificationPermissionResponse(
  @Field
  val status: String,
  @Field
  val expires: String = PermissionsResponse.PERMISSION_EXPIRES_NEVER,
  @Field
  val canAskAgain: Boolean,
  @Field
  val granted: Boolean,
  @Field
  val android: AndroidNotificationPermissionDetails
) : Record
