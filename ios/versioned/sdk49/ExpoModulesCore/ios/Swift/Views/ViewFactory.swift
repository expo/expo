import UIKit

/**
 A definition of the view factory that creates views.
 */
internal struct ViewFactory: ViewManagerDefinitionComponent {
  typealias FactoryClosureType = () -> UIView

  let factory: FactoryClosureType

  init(_ factory: @escaping FactoryClosureType) {
    self.factory = factory
  }

  func create() -> UIView {
    return factory()
  }
}
