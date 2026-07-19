package expo.modules.kotlin.objects

open class ConstantComponentBuilder(
  val name: String
) {
  var getter: (() -> Any?)? = null

  /**
   * Modifier that sets constant getter that has no arguments (the caller is not used).
   */
  inline fun <reified R> get(crossinline body: () -> R) = apply {
    getter = { body() }
  }

  fun build(): ConstantComponent {
    return ConstantComponent(name, requireNotNull(getter) { "The constant '$name' doesn't have getter." })
  }
}
