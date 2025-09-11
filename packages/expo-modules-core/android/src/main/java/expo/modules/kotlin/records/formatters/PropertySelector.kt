package expo.modules.kotlin.records.formatters

import expo.modules.kotlin.records.Record
import kotlin.reflect.KProperty1

class PropertySelector<RecordType : Record, PropertyType>(
  internal val selector: (property: KProperty1<in RecordType, *>) -> Boolean
) {
  internal var action: ActionChain<in RecordType, in PropertyType, *>? = null
  internal var lastAction: ActionChain<in RecordType, *, *>? = null

  open inner class ActionBuilder<InputType> {
    private fun <T, R> nextAction(
      nextBuilder: ActionBuilder<T>,
      nextAction: ActionChain<RecordType, InputType, R>
    ): PropertySelector<RecordType, PropertyType>.ActionBuilder<T> {
      if (action == null) {
        @Suppress("UNCHECKED_CAST")
        action = nextAction as ActionChain<in RecordType, in PropertyType, *>?
      } else {
        @Suppress("UNCHECKED_CAST")
        lastAction?.nextAction = nextAction as ActionChain<in Record, in Any?, *>?
      }

      lastAction = nextAction
      return nextBuilder
    }

    private fun <ResultType> nextAction(
      block: (RecordType, InputType) -> ResultType
    ): PropertySelector<RecordType, PropertyType>.ActionBuilder<ResultType> = nextAction(
      nextBuilder = ActionBuilder(),
      nextAction = ActionChain(action = block)
    )

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

      val action = ActionChain(block)
      val nextBuilder = ActionBuilder<InputType>()
      return nextAction(nextBuilder, action)
    }

    fun <ResultType> map(mapper: (InputType) -> ResultType) =
      nextAction { _, value -> mapper(value) }

    fun <ResultType> map(mapper: (RecordType, InputType) -> ResultType) =
      nextAction { record, value -> mapper(record, value) }

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
