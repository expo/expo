package expo.modules.widgets.notifications

import android.annotation.SuppressLint
import android.content.Context
import androidx.core.app.NotificationManagerCompat
import io.github.jakex7.peek.notification.PeekNotificationViews
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.job
import kotlinx.coroutines.joinAll
import kotlin.coroutines.coroutineContext

internal class CustomNotifications(
  private val render: suspend (Context, CustomNotificationState) -> PeekNotificationViews = CustomNotificationRenderer::render
) {
  private val pending = mutableMapOf<Pair<String, String>, MutableSet<Job>>()

  suspend fun post(context: Context, state: CustomNotificationState) {
    inOrder(state.name, state.id) {
      publish(context, state)
    }
  }

  suspend fun update(
    context: Context,
    name: String,
    id: String,
    transform: (CustomNotificationState) -> CustomNotificationState?
  ): Boolean = inOrder(name, id) {
    val active = CustomNotificationState.find(context, name, id) ?: return@inOrder false
    val updated = transform(active) ?: return@inOrder false
    publish(context, updated, requireActive = true)
  }

  fun cancel(context: Context, name: String, id: String) {
    synchronized(pending) {
      pending.remove(name to id)?.forEach { it.cancel(NotificationCancellation()) }
      NotificationManagerCompat.from(context).cancel(CustomNotificationState.tag(name, id), 0)
    }
  }

  fun cancelAll(context: Context, name: String) {
    synchronized(pending) {
      val ids = CustomNotificationState.all(context).filter { it.name == name }.map { it.id } +
        pending.keys.filter { it.first == name }.map { it.second }
      ids.toSet().forEach { cancel(context, name, it) }
    }
  }

  @SuppressLint("MissingPermission")
  private suspend fun publish(
    context: Context,
    state: CustomNotificationState,
    requireActive: Boolean = false
  ): Boolean {
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) {
      throw NotificationsDisabledException()
    }
    val views = render(context, state)
    val notification = CustomNotificationBuilder.build(context, state, views)
    return synchronized(pending) {
      // Cancellation and posting must not interleave after the render finishes.
      coroutineContext.ensureActive()
      if (requireActive && CustomNotificationState.find(context, state.name, state.id) == null) {
        false
      } else {
        manager.notify(state.tag, 0, notification)
        true
      }
    }
  }

  private suspend fun <T> inOrder(name: String, id: String, block: suspend () -> T): T = try {
    coroutineScope {
      val key = name to id
      val job = coroutineContext.job
      val previous = synchronized(pending) {
        val jobs = pending.getOrPut(key) { mutableSetOf() }
        jobs.toList().also { jobs.add(job) }
      }
      try {
        // Wait for all earlier jobs: cancelling a queued job must not let later work skip ahead.
        previous.joinAll()
        ensureActive()
        block()
      } finally {
        synchronized(pending) {
          pending[key]?.let { jobs ->
            jobs.remove(job)
            if (jobs.isEmpty()) pending.remove(key)
          }
        }
      }
    }
  } catch (_: NotificationCancellation) {
    throw CustomNotificationCancelledException()
  }

  private class NotificationCancellation : CancellationException()

  companion object {
    val shared = CustomNotifications()
  }
}
