/**
 A marker object that allows us to skip calculating a property.
 */
enum Skip { case instance }

class PropertySelector<RecordType: Record> {
  class ActionBuilder<InputType> {
    typealias NextBuilder<T> = PropertySelector.ActionBuilder<T>

    private let propertySelector: PropertySelector<RecordType>

    init (selector: PropertySelector<RecordType>) {
      propertySelector = selector
    }

    @discardableResult func map<ResultType>(
      _ mapper: @escaping (RecordType, InputType) -> ResultType
    ) -> NextBuilder<ResultType> {
      return chainAction { record, value in mapper(record, value as! InputType ) }
    }

    @discardableResult func map<ResultType>(
      _ mapper: @escaping ( InputType) -> ResultType
    ) -> NextBuilder<ResultType> {
      return chainAction { _, value in mapper(value as! InputType ) }
    }

    @discardableResult func skip() -> NextBuilder<InputType> {
      return chainSkipAction(shouldSkip: { _, _ in true })
    }

    @discardableResult func skip(
      _ valueSelector: @escaping (RecordType, InputType) -> Bool
    ) -> NextBuilder<InputType> {
      return chainSkipAction(shouldSkip: valueSelector)
    }

    @discardableResult func skip(
      _ valueSelector: @escaping (InputType) -> Bool
    ) -> NextBuilder<InputType> {
      return chainSkipAction { _, value in valueSelector(value) }
    }

    private func chainAction<NextInputType>(
      nextAction: @escaping (RecordType, Any?) -> Any?
    ) -> NextBuilder<NextInputType> {
      let previouseAction = propertySelector.action
      propertySelector.action = { record, value in
        let previousValue = previouseAction(record, value)
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

  let name: String
  internal var action: (RecordType, Any?) -> Any?

  init (name: String) {
    self.name = name
    self.action = { _, value in value }
  }
}

class Formatter<RecordType: Record> {
  internal var selectors: [PropertySelector<RecordType>] = []

  func property<PropertyType>(
    _ name: String,
    keyPath: KeyPath<RecordType, PropertyType>
  ) -> PropertySelector<RecordType>.ActionBuilder<PropertyType> {
    let selector = PropertySelector<RecordType>(name: name)
    selectors.append(selector)
    return PropertySelector.ActionBuilder(selector: selector)
  }
}
