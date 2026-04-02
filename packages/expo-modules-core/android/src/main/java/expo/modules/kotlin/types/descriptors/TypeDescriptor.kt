package expo.modules.kotlin.types.descriptors

import kotlin.reflect.KClass
import kotlin.reflect.KType

sealed interface RawTypeDescriptor {
  val kClass: KClass<*>
  val isNullable: Boolean

  data class Simple(
    override val kClass: KClass<*>,
    override val isNullable: Boolean
  ) : RawTypeDescriptor

  data class Parameterized(
    override val kClass: KClass<*>,
    override val isNullable: Boolean,
    val params: List<RawTypeDescriptor>
  ) : RawTypeDescriptor
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

  inline val kClass: KClass<*>
    get() = typeInfo.kClass

  inline val params: List<TypeDescriptor>
    get() = when (typeInfo) {
      is RawTypeDescriptor.Simple -> emptyList()
      is RawTypeDescriptor.Parameterized -> typeInfo.params.mapIndexed { index, descriptor ->
        TypeDescriptor(
          typeInfo = descriptor,
          kTypeProvider = { kType.arguments[index].type ?: error("Type argument is missing") }
        )
      }
    }

  override fun toString(): String {
    val paramsString = if (params.isNotEmpty()) {
      params.joinToString(", ", "<", ">") { it.toString() }
    } else {
      ""
    }
    return "$kClass$paramsString${if (isNullable) "?" else ""}"
  }
}

// TODO(@lukmccall): Remove if possible
fun KType.toTypeDescriptor(): TypeDescriptor {
  val classifier = this.classifier as? KClass<*> ?: error("Unsupported type: $this")
  val isNullable = this.isMarkedNullable
  val params = this.arguments.map { arg ->
    val argType = arg.type ?: error("Type argument is missing for $this")
    argType.toTypeDescriptor()
  }

  val rawTypeDescriptor = if (params.isEmpty()) {
    RawTypeDescriptor.Simple(classifier, isNullable)
  } else {
    RawTypeDescriptor.Parameterized(classifier, isNullable, params.map { it.typeInfo })
  }

  return TypeDescriptor(
    typeInfo = rawTypeDescriptor,
    kTypeProvider = { this }
  )
}
