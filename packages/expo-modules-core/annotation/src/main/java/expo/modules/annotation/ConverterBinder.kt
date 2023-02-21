package expo.modules.annotation

import kotlin.reflect.KClass

@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
annotation class ConverterBinder(val clazz: KClass<*> = Nothing::class)
