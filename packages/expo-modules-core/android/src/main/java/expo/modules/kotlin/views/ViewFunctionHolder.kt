package expo.modules.kotlin.views

/*
 * A marker interface for views that reuse a single class (like ComposeFunctionHolder) and so
 * can't be resolved by class. They're identified by [name] and carry their
 * own [callbacksDefinition], which event invocation reads directly instead of looking it up in the
 * registry. See https://github.com/expo/expo/issues/46623.
 */
interface ViewFunctionHolder {
  val name: String
  val callbacksDefinition: CallbacksDefinition?
}
