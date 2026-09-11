import SwiftUI
import ExpoModulesCore

private final class FallbackIdentity {}

struct WidgetsChildView<Content: View>: ExpoSwiftUI.StringIdentityChild {
  let childView: Content
  let stringIdentity: String?
  private let fallbackIdentity: FallbackIdentity?

  init(childView: Content, stringIdentity: String?) {
    self.childView = childView
    self.stringIdentity = stringIdentity
    fallbackIdentity = stringIdentity == nil ? FallbackIdentity() : nil
  }

  var id: ObjectIdentifier {
    guard let fallbackIdentity else {
      preconditionFailure("Keyed widget children must use childIdentity")
    }
    return ObjectIdentifier(fallbackIdentity)
  }

  var uiView: UIView? {
    nil
  }

  var body: some View {
    childView
  }
}
