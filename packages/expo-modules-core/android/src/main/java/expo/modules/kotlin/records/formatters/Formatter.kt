@file:OptIn(ExperimentalTypeInference::class)

package expo.modules.kotlin.records.formatters

import kotlin.experimental.ExperimentalTypeInference
import kotlin.reflect.KProperty1
import expo.modules.kotlin.records.Record

class Formatter<RecordType : Record>(
  internal val selectors: List<PropertySelector<RecordType, *>>
) {
  class Builder<RecordType : Record> {
    internal var selectors = mutableListOf<PropertySelector<RecordType, *>>()

    fun <PropertyType> property(
      propertyRef: KProperty1<RecordType, PropertyType>
    ): PropertySelector<RecordType, PropertyType>.ActionBuilder<PropertyType> {
      val selector = PropertySelector<RecordType, PropertyType> { property -> property == propertyRef }
      selectors.add(selector)
      return selector.ActionBuilder()
    }

    fun <PropertyType : Record> property(
      propertyRef: KProperty1<RecordType, PropertyType>
    ): PropertySelector<RecordType, PropertyType>.ActionBuilderForRecord<PropertyType> {
      val selector = PropertySelector<RecordType, PropertyType> { property ->
        property.name == propertyRef.name && property.returnType == propertyRef.returnType
      }

      selectors.add(selector)

      return selector.ActionBuilderForRecord()
    }

    internal fun build() = Formatter(selectors)
  }

  operator fun invoke(record: RecordType) = FormattedRecord(record, formatter = this)
  fun format(record: RecordType) = FormattedRecord(record, formatter = this)

  internal fun getAction(property: KProperty1<Record, *>) =
    selectors.find { it.selector(property) }?.action
}

fun <RecordType : Record> formatter(
  @BuilderInference body: Formatter.Builder<RecordType>.() -> Unit
): Formatter<RecordType> {
  return Formatter.Builder<RecordType>().apply(body).build()
}
