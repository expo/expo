package expo.modules.kotlin.apifeatures

@RequiresOptIn(message = "This API is experimental. It may be changed in the future without notice.", level = RequiresOptIn.Level.WARNING)
@Retention(AnnotationRetention.BINARY)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
annotation class EitherType
