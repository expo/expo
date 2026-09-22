import SwiftUI
import ExpoModulesCore

public struct WidgetsDynamicView: View {
  private let child: any ExpoSwiftUI.AnyChild

  public init(name: String, kind: WidgetsKind, node: [String: Any]) {
    self.init(name: name, kind: kind, node: node, entryIndex: nil, environmentString: nil)
  }

  public init(name: String, kind: WidgetsKind, node: [String: Any], entryIndex: Int?, environmentString: String?) {
    child = WidgetsViewRenderer(
      name: name,
      kind: kind,
      node: node,
      entryIndex: entryIndex,
      environmentString: environmentString
    ).render()
  }

  public var body: some View {
    // Roots are not inside Children()'s ForEach, so consume their identity here as well.
    let view: any View = child.childView
    AnyView(view).id(child.childIdentity)
  }
}
