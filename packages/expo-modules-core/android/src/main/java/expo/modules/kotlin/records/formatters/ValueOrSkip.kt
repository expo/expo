package expo.modules.kotlin.records.formatters

internal sealed interface ValueOrSkip<T> {
  data class Value<T>(val value: T) : ValueOrSkip<T>
  object Skip : ValueOrSkip<Nothing>
}
