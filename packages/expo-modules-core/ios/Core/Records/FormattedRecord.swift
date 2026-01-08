/**
 Class that binds a formatter with a record.
 It can be converted to JS, but it can't be converted from a JS value.
 */
struct FormattedRecord<RecordType: Record>: Convertible {
  internal final class FormattedRecordCannotBeUsedAsParameterException: Exception, @unchecked Sendable {
    override var reason: String {
      "FormattedRecord cann't be used as paremeter"
    }
  }

  internal let record: RecordType
  internal let formatter: Formatter<RecordType>

  func toDictionary(appContext: AppContext? = nil) -> Record.Dict {
    return fieldsOf(record).reduce(into: Record.Dict()) { result, field in
      if let key = field.key {
        let action = formatter.selectors.first { $0.name == key }?.action

        if let action = action {
          let formattedValue = action(record, field.get())
          if !(formattedValue is Skip) {
            result[key] = Conversions.convertFunctionResult(formattedValue, appContext: appContext)
          }
        } else {
          result[key] = Conversions.convertFunctionResult(field.get(), appContext: appContext)
        }
      }
    }
  }

  static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? FormattedRecord {
      return value.toDictionary(appContext: appContext)
    }
    return result
  }

  static func convert(from value: Any?, appContext: AppContext) throws -> FormattedRecord<RecordType> {
    throw FormattedRecordCannotBeUsedAsParameterException()
  }
}

func format<RecordType: Record>(
  record: RecordType,
  formatter: Formatter<RecordType>
) -> FormattedRecord<RecordType> {
  return FormattedRecord(record: record, formatter: formatter)
}
