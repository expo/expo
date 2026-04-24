package expo.modules.kotlin.types

internal fun Class<*>.toBoxedIfPrimitive(): Class<*> = when (this) {
  Int::class.java -> Integer::class.java
  Long::class.java -> java.lang.Long::class.java
  Double::class.java -> java.lang.Double::class.java
  Float::class.java -> java.lang.Float::class.java
  Boolean::class.java -> java.lang.Boolean::class.java
  Byte::class.java -> java.lang.Byte::class.java
  Short::class.java -> java.lang.Short::class.java
  Char::class.java -> Character::class.java
  else -> this
}
