package expo.modules.kotlin

import kotlin.reflect.KClass
import kotlin.reflect.KFunction
import kotlin.reflect.full.primaryConstructor

val <T : Any> KClass<T>.fastPrimaryConstructor: KFunction<T>?
  // If class only has one constructor, use it as a primary constructor.
  // Otherwise, try to find the primary constructor using kotlin reflection.
  get() = constructors.singleOrNull() ?: primaryConstructor

fun KClass<*>.fastIsSupperClassOf(jClass: Class<*>) =
  this.javaObjectType.isAssignableFrom(jClass) || this.java.isAssignableFrom(jClass)
