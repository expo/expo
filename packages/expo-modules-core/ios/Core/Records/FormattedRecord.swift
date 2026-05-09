/**
 Class that binds a formatter with a record.
 It can be converted to JS, but it can't be converted from a JS value.
 */
public struct FormattedRecord<RecordType: Record>: Convertible, RecordJavaScriptValueConvertible {
  internal final class FormattedRecordCannotBeUsedAsParameterException: Exception, @unchecked Sendable {
    override var reason: String {
      "FormattedRecord cannot be used as a parameter"
    }
  }

  internal let record: RecordType
  internal let formatter: Formatter<RecordType>

  func toDictionary(appContext: AppContext? = nil) -> Record.Dict {
    return fieldDescriptorsOf(record).reduce(into: Record.Dict()) { result, descriptor in
      if let action = formatter.selectors.first(where: { $0.name == descriptor.key })?.action {
        let formattedValue = action(record, descriptor.field.get())
        if !(formattedValue is Skip) {
          result[descriptor.key] = Conversions.convertFunctionResult(formattedValue, appContext: appContext)
        }
      } else {
        result[descriptor.key] = Conversions.convertFunctionResult(descriptor.field.get(), appContext: appContext)
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

  @JavaScriptActor
  func toJSValue(appContext: AppContext) throws -> JavaScriptValue {
    let object = try appContext.runtime.createObject()

    for descriptor in fieldDescriptorsOf(record) {
      let value = if let action = formatter.selectors.first(where: { $0.name == descriptor.key })?.action {
        action(record, descriptor.field.get())
      } else {
        descriptor.field.get()
      }

      if value is Skip {
        continue
      }
      let jsValue = try recordFieldValueToJSValue(value, appContext: appContext)
      object.setProperty(descriptor.key, value: jsValue)
    }
    return object.asValue()
  }
}
