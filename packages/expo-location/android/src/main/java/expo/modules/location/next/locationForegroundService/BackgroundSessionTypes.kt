package expo.modules.location.next.locationForegroundService

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.CompletableDeferred

enum class BackgroundSessionState : Enumerable {
  NOT_RUNNING,
  PENDING,
  PROMOTED
}

sealed interface ServicePromotionResult {
  data object Promoted : ServicePromotionResult
  data class Failed(val cause: Throwable) : ServicePromotionResult
}

sealed interface SessionState {
  data object Idle : SessionState
  data class Starting(val promotion: CompletableDeferred<ServicePromotionResult>) : SessionState
  data object Promoted : SessionState
  data object Stopping : SessionState
}

@OptimizedRecord
class BackgroundSessionStatus(
  @Field val state: BackgroundSessionState,
  @Field val stopOnTaskRemoved: Boolean,
  @Field val unthrottled: Boolean
) : Record
