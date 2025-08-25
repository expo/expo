package expo.modules.kotlin.records.formatters

import expo.modules.kotlin.records.Record

class ActionChain<RecordType : Record, InputType, ResultType>(
  internal var action: (RecordType, InputType) -> ResultType,
  internal var nextAction: ActionChain<in RecordType, in ResultType, *>? = null
) {
  internal fun apply(record: RecordType, value: InputType): Any? {
    val nextValue = action(record, value)
    val nextAction = nextAction ?: return nextValue

    @Suppress("UNCHECKED_CAST")
    return when (nextValue) {
      is ValueOrSkip.Value<*> -> nextAction.apply(record, nextValue.value as ResultType)
      ValueOrSkip.Skip -> ValueOrSkip.Skip
      else -> nextAction.apply(record, nextValue)
    }
  }

  @JvmName("applyRecord")
  internal fun apply(record: Record, value: Any?): Any? {
    @Suppress("UNCHECKED_CAST")
    return apply(record as RecordType, value as InputType)
  }
}
