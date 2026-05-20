/**
 A marker object that allows us to skip calculating a property.
 */
enum Skip {
  case instance
}

public class PropertySelector<RecordType: Record> {
  public class ActionBuilder<InputType> {
    public typealias NextBuilder<T> = PropertySelector.ActionBuilder<T>

    private let propertySelector: PropertySelector<RecordType>

    internal init(selector: PropertySelector<RecordType>) {
      propertySelector = selector
    }

    @discardableResult
    public func map<ResultType>(
      _ mapper: @escaping (RecordType, InputType) -> ResultType
    ) -> NextBuilder<ResultType> {
      return chainAction { record, value in mapper(record, value as! InputType ) }
    }

    @discardableResult
    public func map<ResultType>(
      _ mapper: @escaping ( InputType) -> ResultType
    ) -> NextBuilder<ResultType> {
      return chainAction { _, value in mapper(value as! InputType ) }
    }

    @discardableResult
    public func skip() -> NextBuilder<InputType> {
      return chainSkipAction(shouldSkip: { _, _ in true })
    }

    @discardableResult
    public func skip(
      _ valueSelector: @escaping (RecordType, InputType) -> Bool
    ) -> NextBuilder<InputType> {
      return chainSkipAction(shouldSkip: valueSelector)
    }

    @discardableResult
    public func skip(
      _ valueSelector: @escaping (InputType) -> Bool
    ) -> NextBuilder<InputType> {
      return chainSkipAction { _, value in valueSelector(value) }
    }

    private func chainAction<NextInputType>(
      nextAction: @escaping (RecordType, Any?) -> Any?
    ) -> NextBuilder<NextInputType> {
      let previousAction = propertySelector.action
      propertySelector.action = { record, value in
        let previousValue = previousAction(record, value)
        if previousValue is Skip {
          return Skip.instance
        }

        return nextAction(record, previousValue)
      }

      return PropertySelector.ActionBuilder(selector: propertySelector)
    }

    private func chainSkipAction(
      shouldSkip: @escaping (RecordType, InputType) -> Bool
    ) -> NextBuilder<InputType> {
      return chainAction { record, value in
        let typedValue = value as! InputType
        if shouldSkip(record, typedValue) {
          return Skip.instance
        }

        return typedValue
      }
    }
  }

  internal let name: String
  internal var action: (RecordType, Any?) -> Any?

  internal init(name: String) {
    self.name = name
    self.action = { _, value in value }
  }
}

public class Formatter<RecordType: Record> {
  internal var selectors: [PropertySelector<RecordType>] = []

  public func property<PropertyType>(
    _ name: String,
    keyPath: KeyPath<RecordType, PropertyType>
  ) -> PropertySelector<RecordType>.ActionBuilder<PropertyType> {
    let selector = PropertySelector<RecordType>(name: name)
    selectors.append(selector)
    return PropertySelector.ActionBuilder(selector: selector)
  }
}

extension Record {
  public func format(_ body: (Formatter<Self>) -> Void) -> FormattedRecord<Self> {
    let formatter = Formatter<Self>()
    body(formatter)
    return FormattedRecord(record: self, formatter: formatter)
  }

  public func format(formatter: Formatter<Self>) -> FormattedRecord<Self> {
    return FormattedRecord(record: self, formatter: formatter)
  }
}
