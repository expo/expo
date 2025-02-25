package expo.modules.kotlin.objects

open class LazyPropertyComponentBuilder(
  val name: String
) {
  var getter: (() -> Any?)? = null

  /**
   * Modifier that sets property getter that has no arguments (the caller is not used).
   */
  inline fun <reified R> get(crossinline body: () -> R) = apply {
    getter = { body() }
  }

  fun build(): LazyPropertyComponent {
    return LazyPropertyComponent(name, getter)
  }
}
