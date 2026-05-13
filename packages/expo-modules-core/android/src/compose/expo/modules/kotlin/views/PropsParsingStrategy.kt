package expo.modules.kotlin.views

import android.util.Log
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.descriptors.TypeDescriptor
import expo.modules.kotlin.types.descriptors.toRawTypeDescriptor
import expo.modules.kotlin.types.descriptors.toTypeDescriptor
import io.github.lukmccall.pika.PIntrospectionData
import io.github.lukmccall.pika.PTypeDescriptor
import io.github.lukmccall.pika.introspectionOf
import io.github.lukmccall.pika.isIntrospectable
import kotlin.reflect.KClass
import kotlin.reflect.full.memberProperties

@PublishedApi
internal inline fun <reified Props : ComposeProps> toPropsParsingStrategy(): PropsParsingStrategy<Props> {
  return if (isIntrospectable<Props>()) {
    PropsParsingStrategy.Introspection(introspectionOf<Props>())
  } else {
    Log.w("ExpoModulesCore", "Props class ${Props::class.java} is not introspectable. Falling back to reflection-based props parsing, which may have performance implications. To fix this, annotate the props class with @OptimizedComposeProps.")
    PropsParsingStrategy.Reflection(Props::class)
  }
}

/**
 * Defines a strategy for parsing data class to props. We have two implementations:
 * 1. Introspection - uses Pika to introspect the properties of the props class
 * 2. Reflection - uses Kotlin reflection to get the properties of the props class
 */
sealed interface PropsParsingStrategy<Props : ComposeProps> {
  fun createNewInstance(): Props
  fun props(): Map<String, ComposeViewProp>

  // Used with props that are represented as MutableState<T> - in this case, we need to unwrap the type to get T
  fun unwrappedProps(): Map<String, ComposeViewProp>

  @JvmInline
  value class Introspection<Props : ComposeProps>(
    private val introspectableData: PIntrospectionData<Props>
  ) : PropsParsingStrategy<Props> {
    override fun createNewInstance(): Props {
      @Suppress("UNCHECKED_CAST")
      return introspectableData.jClass.getDeclaredConstructor().newInstance() as Props
    }

    override fun props(): Map<String, ComposeViewProp> {
      return introspectableData.properties.associate { prop ->
        val propType = TypeDescriptor(
          typeInfo = prop.type.toRawTypeDescriptor(),
          kTypeProvider = { error("KType is not available for introspected properties, should not be accessed") }
        )

        @Suppress("UNCHECKED_CAST")
        prop.name to ComposeViewProp(
          prop.name,
          AnyType(propType),
          prop::get as (Any) -> Any?
        )
      }
    }

    override fun unwrappedProps(): Map<String, ComposeViewProp> {
      return introspectableData.properties.associate { prop ->
        val mutableStateType = (prop.type as? PTypeDescriptor.Concrete.Parameterized)
        requireNotNull(mutableStateType) {
          "Wrapped props must be of type MutableState<T>. Property ${prop.name} is not a valid wrapped prop because its return type is not parameterized."
        }
        val propTypeDescriptor = requireNotNull(mutableStateType.parameters.firstOrNull()) { "Can't unwrap prop type" }

        val propType = TypeDescriptor(
          typeInfo = propTypeDescriptor.toRawTypeDescriptor(),
          kTypeProvider = { error("KType is not available for introspected properties, should not be accessed") }
        )

        @Suppress("UNCHECKED_CAST")
        prop.name to ComposeViewProp(
          prop.name,
          AnyType(propType),
          prop::get as (Any) -> Any?
        )
      }
    }
  }

  @JvmInline
  value class Reflection<Props : ComposeProps>(
    private val propsClass: KClass<*>
  ) : PropsParsingStrategy<Props> {
    override fun createNewInstance(): Props {
      @Suppress("UNCHECKED_CAST")
      return propsClass.java.getDeclaredConstructor().newInstance() as Props
    }

    override fun props(): Map<String, ComposeViewProp> {
      return propsClass.memberProperties.associate { prop ->
        val kType = prop.returnType
        prop.name to ComposeViewProp(
          prop.name,
          AnyType(kType.toTypeDescriptor()),
          propertyGetter = { self -> prop.getter.call(self) }
        )
      }
    }

    override fun unwrappedProps(): Map<String, ComposeViewProp> {
      return propsClass.memberProperties.associate { prop ->
        val kType = prop.returnType.arguments.first().type
        requireNotNull(kType) {
          "Wrapped props must be of type MutableState<T>. Property ${prop.name} is not a valid wrapped prop because its return type is not parameterized."
        }
        prop.name to ComposeViewProp(
          prop.name,
          AnyType(kType.toTypeDescriptor()),
          propertyGetter = { self -> prop.getter.call(self) }
        )
      }
    }
  }
}
