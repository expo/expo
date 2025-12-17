package expo.modules.kotlin.views

/*
 * A marker interface identifying views reusing a single class (like ComposeFunctionHolder)
 * that should be identified by name for things like event validation.
 */
interface ViewFunctionHolder {
  val name: String
}
