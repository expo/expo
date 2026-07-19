package expo.modules.kotlin.records.formatters

import expo.modules.kotlin.records.Record
import kotlin.reflect.KProperty1

class PropertySelector<RecordType : Record, PropertyType>(
  internal val selector: (property: KProperty1<in RecordType, *>) -> Boolean
) {
  internal var action: ((RecordType, Any?) -> Any?)? = null

  open inner class ActionBuilder<InputType> {
    private fun <T, R> nextAction(
      nextBuilder: ActionBuilder<T> = ActionBuilder(),
      nextAction: (RecordType, InputType) -> Any?
    ): PropertySelector<RecordType, PropertyType>.ActionBuilder<T> {
      @Suppress("UNCHECKED_CAST")
      val nextAction = nextAction as (RecordType, Any?) -> Any?

      val currentAction = action
      action = (
        if (currentAction == null) {
          nextAction
        } else {
          { record, value ->
            val nextValue = currentAction(record, value)
            if (nextValue is ValueOrSkip<*>) {
              when (nextValue) {
                is ValueOrSkip.Value<*> -> nextAction(record, nextValue.value)
                ValueOrSkip.Skip -> ValueOrSkip.Skip
              }
            } else {
              nextAction(record, nextValue)
            }
          }
        }
        )

      return nextBuilder
    }

    private fun defaultSkipAction(
      shouldSkip: (RecordType, InputType) -> Boolean
    ): PropertySelector<RecordType, PropertyType>.ActionBuilder<InputType> {
      val block = { record: RecordType, value: InputType ->
        if (shouldSkip(record, value)) {
          ValueOrSkip.Skip
        } else {
          ValueOrSkip.Value(value)
        }
      }

      val nextBuilder = ActionBuilder<InputType>()
      return nextAction<InputType, InputType>(nextBuilder, block)
    }

    fun <ResultType> map(mapper: (InputType) -> ResultType) =
      nextAction<InputType, ResultType> { _, value -> mapper(value) }

    fun <ResultType> map(mapper: (RecordType, InputType) -> ResultType) =
      nextAction<InputType, ResultType> { record, value -> mapper(record, value) }

    fun skip(valueSelector: (value: InputType) -> Boolean = { true }) =
      defaultSkipAction { _, value -> valueSelector(value) }

    fun skip(valueSelector: ValueSelector<InputType>) =
      defaultSkipAction { _, value -> valueSelector(value) }

    fun skip(valueSelector: (record: RecordType, value: InputType) -> Boolean) =
      defaultSkipAction { record, value -> valueSelector(record, value) }
  }

  inner class ActionBuilderForRecord<InputType : Record> : ActionBuilder<InputType>() {
    fun format(formatter: Formatter<InputType>) =
      map { record -> formatter.format(record) }

    fun format(builder: Formatter.Builder<InputType>.() -> Unit) =
      map { record -> formatter(builder).format(record) }
  }
}
