/**
 Class that binds a formatter with a record.
 It can be converted to JS, but it can't be converted from a JS value.
 */
public struct FormattedRecord<RecordType: Record>: Convertible {
  internal final class FormattedRecordCannotBeUsedAsParameterException: Exception, @unchecked Sendable {
    override var reason: String {
      "FormattedRecord cannot be used as a parameter"
    }
  }

  internal let record: RecordType
  internal let formatter: Formatter<RecordType>

  func toDictionary(appContext: AppContext? = nil) -> Record.Dict {
    return fieldsOf(record).reduce(into: Record.Dict()) { result, field in
      if let key = field.key {
        if let action = formatter.selectors.first(where: { $0.name == key })?.action {
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

  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    if let value = result as? FormattedRecord {
      return value.toDictionary(appContext: appContext)
    }
    return result
  }

  public static func convert(from value: Any?, appContext: AppContext) throws -> FormattedRecord<RecordType> {
    throw FormattedRecordCannotBeUsedAsParameterException()
  }
}
