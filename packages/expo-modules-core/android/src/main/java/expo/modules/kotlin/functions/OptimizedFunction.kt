package expo.modules.kotlin.functions

/**
 * Marks a function for optimized code generation using KSP.
 *
 * Functions annotated with @OptimizedFunction use JNI reflection with a shared C++ dispatcher,
 * bypassing the runtime boxing/unboxing overhead of the standard DSL approach.
 *
 * This is particularly beneficial for functions with primitive parameter types (Double, Int, Boolean)
 * that are called frequently (e.g., in animations, game loops, or data processing).
 *
 * Usage (iOS-style API):
 * ```kotlin
 * class MyModule : Module() {
 *   override fun definition() = ModuleDefinition {
 *     Name("MyModule")
 *
 *     // Just call the function - generated extension handles registration!
 *     addNumbers()
 *   }
 *
 *   @OptimizedFunction("addNumbers")
 *   fun addNumbers(a: Double, b: Double): Double {
 *     return a + b
 *   }
 * }
 * ```
 *
 * @property name The function name exposed to JavaScript (REQUIRED)
 * @property async Whether this is an async function (default: false, not yet supported)
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.BINARY)
annotation class OptimizedFunction(
    val name: String,
    val async: Boolean = false
)
