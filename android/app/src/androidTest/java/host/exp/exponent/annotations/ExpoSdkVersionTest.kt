package host.exp.exponent.annotations

import java.lang.annotation.Retention
import java.lang.annotation.RetentionPolicy

@Target(
  AnnotationTarget.FUNCTION,
  AnnotationTarget.PROPERTY_GETTER,
  AnnotationTarget.PROPERTY_SETTER
)
@Retention(
  RetentionPolicy.RUNTIME
)
annotation class ExpoSdkVersionTest(val value: String)
