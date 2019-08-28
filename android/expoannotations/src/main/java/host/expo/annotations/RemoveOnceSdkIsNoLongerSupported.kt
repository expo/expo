package host.expo.annotations

import kotlin.annotation.Retention

@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY_GETTER, AnnotationTarget.PROPERTY_SETTER, AnnotationTarget.FIELD, AnnotationTarget.CLASS, AnnotationTarget.FILE)
annotation class RemoveOnceSdkIsNoLongerSupported(val version: Int)
