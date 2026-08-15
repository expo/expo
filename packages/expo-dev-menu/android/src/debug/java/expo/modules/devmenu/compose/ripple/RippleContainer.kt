/*
 * Copyright 2021 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package expo.modules.devmenu.compose.ripple

import android.content.Context
import android.view.ViewGroup
import androidx.compose.ui.R

internal interface RippleHostKey {
  /**
   * Called when the [RippleHostView] associated with this RippleHostKey is reset and no longer
   * associated to this key. Implementers should remove any references to the [RippleHostView].
   */
  fun onResetRippleHostView()
}

/**
 * A root-level container [ViewGroup] that manages creating and assigning [RippleHostView]s used
 * throughout a Compose hierarchy. Each root Compose View that has components that use ripples
 * inside will have a [RippleContainer] as a direct child.
 */
internal class RippleContainer(context: Context) : ViewGroup(context) {
  /**
   * Maximum number of [RippleHostView]s that will be allocated and added, limiting the total
   * number of Views attached to the root Compose View.
   */
  private val MaxRippleHosts = 5

  /** [RippleHostView]s that will be assigned to [RippleHostKey]s when necessary. */
  private val rippleHosts = mutableListOf<RippleHostView>()

  /**
   * [RippleHostView]s that are not currently assigned to any [RippleHostKey], so they can be
   * reused without needing to allocate new instances.
   */
  private val unusedRippleHosts = mutableListOf<RippleHostView>()

  private val rippleHostMap = RippleHostMap()

  /** Index of the next host that will be assigned to a ripple */
  private var nextHostIndex = 0

  init {
    clipChildren = false

    // Start by initially assigning one RippleHostView - we will allocate more when needed.
    // We start by only assigning one to avoid creating a lot of unused Views for cases where
    // there are multiple Compose roots inside a hierarchy, such as when putting Compose
    // roots inside a RecyclerView.
    val initialHostView = RippleHostView(context).also { addView(it) }
    rippleHosts.add(initialHostView)
    unusedRippleHosts.add(initialHostView)
    // Since we now have an unused ripple host, the next index should be 1 - the unused host
    // will be used first.
    nextHostIndex = 1

    // Hide this view and its children in tools:
    setTag(R.id.hide_in_inspector_tag, true)
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    // RippleHostViews don't partake in layout
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // RippleHostViews don't partake in measurement
    setMeasuredDimension(0, 0)
  }

  @Suppress("MissingSuperCall")
  override fun requestLayout() {
    // RippleHostViews don't partake in layout, and shouldn't invalidate layout
  }

  /**
   * @return a [RippleHostView] for [this] [RippleHostKey]. This result will be cached if
   *   possible, to allow re-using the same [RippleHostView].
   */
  fun RippleHostKey.getRippleHostView(): RippleHostView {
    val existingRippleHostView = rippleHostMap[this]
    if (existingRippleHostView != null) {
      return existingRippleHostView
    }

    // If we have an unused RippleHostView, use that before creating a new one
    var rippleHostView = unusedRippleHosts.removeFirstOrNull()

    if (rippleHostView == null) {
      // If the next host is larger than the current index, we haven't reached maximum
      // capacity yet and so we need to allocate a new RippleHostView
      rippleHostView =
        if (nextHostIndex > rippleHosts.lastIndex) {
          RippleHostView(context).also {
            // Add this host to the view hierarchy
            addView(it)
            // And add it to the list of hosts
            rippleHosts += it
          }
        } else {
          // Otherwise we are looping through the current hosts and re-using an existing,
          // un-disposed host
          val host = rippleHosts[nextHostIndex]

          // Since this host was re-used, and not in the unused host list, it may still be
          // linked to an instance
          val existingInstance = rippleHostMap[host]

          // TODO: possible future optimization
          //  Consider checking to see if the existing ripple is still drawing, and if so,
          //  create a new RippleHostView one instead of reassigning
          if (existingInstance != null) {
            existingInstance.onResetRippleHostView()
            rippleHostMap.remove(existingInstance)
            host.disposeRipple()
          }
          host
        }

      // Update the index for the next host - loop around if we reach the maximum capacity
      if (nextHostIndex < MaxRippleHosts - 1) {
        nextHostIndex++
      } else {
        nextHostIndex = 0
      }
    }

    rippleHostMap[this] = rippleHostView

    return rippleHostView
  }

  /**
   * Unassigns the current [RippleHostView] from [this] [RippleHostKey] and resets its state, so
   * it can be used by another [RippleHostKey].
   */
  fun RippleHostKey.disposeRippleIfNeeded() {
    onResetRippleHostView()
    val rippleHost = rippleHostMap[this]

    if (rippleHost != null) {
      rippleHost.disposeRipple()
      rippleHostMap.remove(this)
      // This ripple host has been disposed, so it is safe to be re-used
      unusedRippleHosts.add(rippleHost)
    }
  }
}

/** Simple bidirectional map for [RippleHostKey] : [RippleHostView]. */
private class RippleHostMap {
  private val indicationToHostMap = mutableMapOf<RippleHostKey, RippleHostView>()
  private val hostToIndicationMap = mutableMapOf<RippleHostView, RippleHostKey>()

  operator fun set(indicationInstance: RippleHostKey, rippleHostView: RippleHostView) {
    indicationToHostMap[indicationInstance] = rippleHostView
    hostToIndicationMap[rippleHostView] = indicationInstance
  }

  operator fun get(indicationInstance: RippleHostKey): RippleHostView? {
    return indicationToHostMap[indicationInstance]
  }

  operator fun get(rippleHostView: RippleHostView): RippleHostKey? {
    return hostToIndicationMap[rippleHostView]
  }

  fun remove(indicationInstance: RippleHostKey) {
    indicationToHostMap[indicationInstance]?.let { hostToIndicationMap.remove(it) }
    indicationToHostMap.remove(indicationInstance)
  }
}
