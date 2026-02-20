package expo.modules.kotlin.apifeatures

@RequiresOptIn(message = "This API is experimental. It may be changed in the future without notice.", level = RequiresOptIn.Level.WARNING)
@Retention(AnnotationRetention.BINARY)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Deprecated("The Either type is not longer experimental, so this annotation is no longer needed. This annotation will be removed in the future.")
annotation class EitherType
