package expo.modules.kotlin.views

import expo.modules.kotlin.viewevent.CoalescingKey

/**
 * A typed event dispatcher that lives on [ComposeProps] data classes.
 * Auto-discovered by the framework at view registration time.
 *
 * Usage in a Props class:
 * ```
 * data class ButtonProps(
 *   val enabled: Boolean = true,
 *   val onButtonPressed: ComposeEventDispatcher<ButtonPressedEvent> = ComposeEventDispatcher()
 * ) : ComposeProps
 * ```
 *
 * Then in the Content composable:
 * ```
 * Button(onClick = { props.onButtonPressed(ButtonPressedEvent()) })
 * ```
 *
 * For high-frequency events, provide a [coalescingKey] so the bridge can merge
 * rapid-fire events and only deliver the latest:
 * ```
 * val onValueChange: ComposeEventDispatcher<SliderEvent> = ComposeEventDispatcher(
 *   coalescingKey = { (it.value.hashCode() % Short.MAX_VALUE).toShort() }
 * )
 * ```
 */
class ComposeEventDispatcher<T>(
  val coalescingKey: CoalescingKey<T>? = null
) {
  internal var callback: ((T) -> Unit)? = null

  operator fun invoke(arg: T) {
    callback?.invoke(arg)
  }
}
