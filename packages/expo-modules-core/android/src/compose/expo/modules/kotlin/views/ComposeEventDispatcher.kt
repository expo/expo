package expo.modules.kotlin.views

/**
 * A typed event dispatcher that lives on [ComposeProps] data classes.
 * Auto-discovered by the framework at view registration time,
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
 */
class ComposeEventDispatcher<T> {
  internal var callback: ((T) -> Unit)? = null

  operator fun invoke(arg: T) {
    callback?.invoke(arg)
  }
}
