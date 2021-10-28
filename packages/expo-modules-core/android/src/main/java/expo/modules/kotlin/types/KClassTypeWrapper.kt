package expo.modules.kotlin.types

import kotlin.reflect.KClass
import kotlin.reflect.KType

class KClassTypeWrapper(val type: KType) : KType by type {
  override val classifier: KClass<*> = requireNotNull(type.classifier as? KClass<*>) { "Type classifier should be castable to KClass type." }
}
