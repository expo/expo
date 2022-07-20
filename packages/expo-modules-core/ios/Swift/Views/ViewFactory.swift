import UIKit

/**
 A definition of the view factory that creates views.
 */
internal struct ViewFactory: ViewManagerDefinitionComponent {
  let factory: () -> UIView
  let viewType: UIView.Type

  init<ViewType: UIView>(_ factory: @escaping () -> ViewType) {
    self.factory = factory
    self.viewType = ViewType.self
  }

  func create() -> UIView {
    return factory()
  }
}
