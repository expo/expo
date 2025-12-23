package expo.modules.kotlin.functions

/**
 * Marks a function for optimized code generation using KSP.
 *
 * Functions annotated with @OptimizedFunction will have specialized C++ JNI adapters generated
 * at compile time, bypassing the runtime boxing/unboxing overhead of the standard DSL approach.
 *
 * This is particularly beneficial for functions with primitive parameter types (Double, Int, Boolean)
 * that are called frequently (e.g., in animations, game loops, or data processing).
 *
 * Usage:
 * ```kotlin
 * class MyModule : Module() {
 *   override fun definition() = ModuleDefinition {
 *     Name("MyModule")
 *     Function("addNumbers", ::addNumbers)
 *   }
 *
 *   @OptimizedFunction
 *   fun addNumbers(a: Double, b: Double): Double {
 *     return a + b
 *   }
 * }
 * ```
 *
 * @property name Override the function name exposed to JavaScript (default: use Kotlin function name)
 * @property async Whether this is an async function (default: false, not yet supported in POC)
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.BINARY)
annotation class OptimizedFunction(
    val name: String = "",
    val async: Boolean = false
)
