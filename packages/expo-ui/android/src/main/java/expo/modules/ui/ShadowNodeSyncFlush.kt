package expo.modules.ui

import android.view.View
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

// Workaround helper that triggers a synchronous event to flush a pending
// shadow-node state update in the current event beat. Mirrors iOS's
// `EventQueue::UpdateMode::unstable_Immediate`, which Android does not expose
// to Java/Kotlin as of now.
// TODO: Remove when a synchronous state update API is exposed on Android.
// https://github.com/facebook/react-native/pull/56311
internal fun View.flushPendingStateUpdates() {
  val reactContext = context as? ReactContext ?: return
  val surfaceId = UIManagerHelper.getSurfaceId(this)
  UIManagerHelper.getEventDispatcherForReactTag(reactContext, id)
    ?.dispatchEvent(SyncFlushEvent(surfaceId, id))
}

private class SyncFlushEvent(surfaceId: Int, viewTag: Int) : Event<SyncFlushEvent>(surfaceId, viewTag) {
  override fun getEventName(): String = "topExpoUISyncFlush"
  override fun getEventData(): WritableMap = Arguments.createMap()
  override fun canCoalesce(): Boolean = true
  override fun experimental_isSynchronous(): Boolean = true
}
