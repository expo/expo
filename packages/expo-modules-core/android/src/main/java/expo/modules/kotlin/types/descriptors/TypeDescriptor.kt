package expo.modules.kotlin.types.descriptors

import io.github.lukmccall.pika.PIntrospectionData
import kotlin.reflect.KClass
import kotlin.reflect.KType

sealed interface RawTypeDescriptor {
  val jClass: Class<*>
  val isNullable: Boolean
  val introspection: PIntrospectionData<*>?

  data class Simple(
    override val jClass: Class<*>,
    override val isNullable: Boolean,
    override val introspection: PIntrospectionData<*>?
  ) : RawTypeDescriptor

  data class Parameterized(
    override val jClass: Class<*>,
    override val isNullable: Boolean,
    override val introspection: PIntrospectionData<*>?,
    val params: List<RawTypeDescriptor>
  ) : RawTypeDescriptor

  object Star : RawTypeDescriptor {
    override val jClass: Class<*> = Any::class.java
    override val isNullable: Boolean = true
    override val introspection: PIntrospectionData<*>? = null
  }
}

class TypeDescriptor(
  val typeInfo: RawTypeDescriptor,
  private val kTypeProvider: () -> KType
) {
  private var _kType: KType? = null
  val kType: KType
    get() {
      if (_kType == null) {
        _kType = kTypeProvider()
      }
      return _kType!!
    }

  inline val isNullable: Boolean
    get() = typeInfo.isNullable

  inline val jClass: Class<*>
    get() = typeInfo.jClass

  inline val isStar
    get() = typeInfo == RawTypeDescriptor.Star

  inline val params: List<TypeDescriptor>
    get() = when (typeInfo) {
      is RawTypeDescriptor.Simple -> emptyList()
      is RawTypeDescriptor.Parameterized -> typeInfo.params.mapIndexed { index, descriptor ->
        TypeDescriptor(
          typeInfo = descriptor,
          kTypeProvider = { kType.arguments[index].type ?: error("Type argument is missing") }
        )
      }

      RawTypeDescriptor.Star -> emptyList()
    }

  override fun toString(): String {
    val paramsString = if (params.isNotEmpty()) {
      params.joinToString(", ", "<", ">") { it.toString() }
    } else {
      ""
    }
    return "$jClass$paramsString${if (isNullable) "?" else ""}"
  }
}

// TODO(@lukmccall): Remove if possible
fun KType.toTypeDescriptor(): TypeDescriptor {
  val classifier = this.classifier as? KClass<*> ?: error("Unsupported type: $this")
  val isNullable = this.isMarkedNullable
  val params = this.arguments.map { arg ->
    if (arg.variance == null) {
      TypeDescriptor(
        RawTypeDescriptor.Star
      ) { error("Star projection doesn't have type") }
    } else {
      val argType = arg.type ?: error("Type argument is missing for $this")
      argType.toTypeDescriptor()
    }
  }

  val rawTypeDescriptor = if (params.isEmpty()) {
    RawTypeDescriptor.Simple(
      classifier.java,
      isNullable,
      null
    )
  } else {
    RawTypeDescriptor.Parameterized(
      classifier.java,
      isNullable,
      null,
      params.map { it.typeInfo }
    )
  }

  return TypeDescriptor(
    typeInfo = rawTypeDescriptor,
    kTypeProvider = { this }
  )
}
