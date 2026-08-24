import SwiftUI
import ExpoModulesCore
import ExpoUI

// SwiftUI can only animate a change when the view keeps the same identity across
// renders, and `Children()` keys its ForEach on `AnyChild.id`. Handing out a fresh
// identity object per render made every widget/Live Activity update a wholesale
// remove-and-insert, which disabled system update animations, `contentTransition`,
// and `.animation` alike. Instead, keep one identity object per logical node,
// addressed by its position (or JSX `key`) in the tree.
final class NodeIdentityWrapper {
  private static var cache: [String: NodeIdentityWrapper] = [:]
  private static let lock = NSLock()

  let key: String

  private init(key: String) {
    self.key = key
  }

  static func identity(for key: String) -> NodeIdentityWrapper {
    lock.lock()
    defer { lock.unlock() }
    if let existing = cache[key] {
      return existing
    }
    let created = NodeIdentityWrapper(key: key)
    cache[key] = created
    return created
  }
}
extension ObjectIdentifier: @retroactive Encodable {
  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(String(describing: self))
  }
}

public struct WidgetsDynamicView: View, ExpoSwiftUI.AnyChild {
  let node: [String: Any]
  let name: String
  let kind: WidgetsKind
  let entryIndex: Int?
  let environmentString: String?
  // Path of this node within its layout tree, e.g. "ZStackView/2:moon/0:ImageView".
  let path: String

  private let identity: NodeIdentityWrapper
  public var id: ObjectIdentifier {
    ObjectIdentifier(identity)
  }

  public init(name: String, kind: WidgetsKind, node: [String: Any]) {
    self.init(name: name, kind: kind, node: node, entryIndex: nil, environmentString: nil)
  }

  public init(name: String, kind: WidgetsKind, node: [String: Any], entryIndex: Int?, environmentString: String?) {
    self.init(name: name, kind: kind, node: node, entryIndex: entryIndex, environmentString: environmentString, path: node["type"] as? String ?? "root")
  }

  init(name: String, kind: WidgetsKind, node: [String: Any], entryIndex: Int?, environmentString: String?, path: String) {
    self.name = name
    self.kind = kind
    self.node = node
    self.entryIndex = entryIndex
    self.environmentString = environmentString
    self.path = path
    self.identity = NodeIdentityWrapper.identity(for: "\(name)|\(kind)|\(entryIndex.map(String.init) ?? "-")|\(path)")
  }

  // Children are addressed by their JSX `key` when present, otherwise by index,
  // plus their type so a different component at the same slot gets a new identity.
  // Keyed and unkeyed slots are prefixed (`k`/`i`) so a numeric JSX key (e.g.
  // `key={0}`) can't collide with an unkeyed sibling's index, and keys are escaped
  // so they can't forge the path separators or the `|` in the identity cache key.
  private func childPath(for child: [String: Any], at index: Int) -> String {
    let slot = (child["key"] as? String).map { "k\(escapeSlot($0))" } ?? "i\(index)"
    let type = child["type"] as? String ?? "?"
    return "\(path)/\(slot):\(type)"
  }

  private func escapeSlot(_ key: String) -> String {
    key
      .replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "/", with: "\\/")
      .replacingOccurrences(of: ":", with: "\\:")
      .replacingOccurrences(of: "|", with: "\\|")
  }

  @ViewBuilder
  public var body: some View {
    switch node["type"] as? String {
    case "TextView":
      render(TextView.self, TextViewProps.self, updateProps: updateChildren)
    case "HStackView":
      render(HStackView.self, HStackViewProps.self, updateProps: updateChildren)
    case "VStackView":
      render(VStackView.self, VStackViewProps.self, updateProps: updateChildren)
    case "ZStackView":
      render(ZStackView.self, ZStackViewProps.self, updateProps: updateChildren)
    case "RectangleView":
      render(RectangleView.self, RectangleViewProps.self)
    case "RoundedRectangleView":
      render(RoundedRectangleView.self, RoundedRectangleViewProps.self)
    case "CapsuleView":
      render(CapsuleView.self, CapsuleViewProps.self)
    case "CircleView":
      render(CircleView.self, CircleViewProps.self)
    case "ImageView":
      render(ImageView.self, ImageViewProps.self)
    case "AccessoryWidgetBackgroundView":
      render(AccessoryWidgetBackgroundView.self, AccessoryWidgetBackgroundProps.self)
    case "DividerView":
      render(DividerView.self, DividerProps.self)
    case "EllipseView":
      render(EllipseView.self, EllipseViewProps.self)
    case "LabelView":
      render(LabelView.self, LabelViewProps.self)
    case "ProgressView":
      render(ProgressView.self, ProgressViewProps.self)
    case "SpacerView":
      render(SpacerView.self, SpacerViewProps.self)
    case "UnevenRoundedRectangleView":
      render(UnevenRoundedRectangleView.self, UnevenRoundedRectangleViewProps.self)
    case "GaugeView":
      render(GaugeView.self, GaugeProps.self)
    case "ChartView":
      render(ChartView.self, ChartProps.self)
    case "Button":
      if #available(iOS 17.0, *) {
        switch kind {
        case .widget:
          render(WidgetButtonView.self, ButtonProps.self) { buttonProps in
            try updateChildren(buttonProps)
            buttonProps.source = name
            buttonProps.entryIndex = entryIndex
            buttonProps.environmentString = environmentString
          }
        case .liveActivity:
          render(LiveActivityButtonView.self, ButtonProps.self) { buttonProps in
            try updateChildren(buttonProps)
            buttonProps.source = name
          }
        }
      } else {
        render(ExpoUI.Button.self, ExpoUI.ButtonProps.self, updateProps: updateChildren)
      }
    case "react.fragment":
      render(FragmentView.self, FragmentProps.self, updateProps: updateChildren)
    case "LinkView":
      render(LinkView.self, LinkViewProps.self, updateProps: updateChildren)
#if DEBUG
    case "RedBoxView":
      render(RedBoxView.self, RedBoxViewProps.self) { redBoxProps in
        redBoxProps.source = name
        redBoxProps.kind = kind
      }
    default:
      ZStack {
        Color.red.opacity(0.5)
        Text("Unable to get the view for: \(node["type"] as? String ?? "undefined")")
      }
#else
    default:
      EmptyView()
#endif
    }
  }

  // MARK: - Render Method

  @ViewBuilder
  private func render<P, V>(_ viewType: V.Type, _ propsType: P.Type, updateProps: ((_ initialProps: P) throws -> Void)? = nil) -> some View
  where P: UIBaseViewProps, V: ExpoSwiftUI.View, V.Props == P {
    // immediately invoked closure {}() here because we can't use 'do-catch' inside @ViewBuilder
    {
      do {
        if let rawProps = node["props"] as? [String: Any] {
          let props = try propsType.init(rawProps: rawProps, context: WidgetsContext.shared.context)
          try updateProps?(props)
          // TODO(@jakex7): Prevent unwanted transition when view is updated with new props - we want to have the same view instance recreated with new props instead of creating a new view instance and transitioning to it
          return AnyView(UIBaseView<P, V>(props: props).transition(.identity))
        }
        return AnyView(EmptyView())
      } catch {
        return AnyView(EmptyView())
      }
    }()
  }

  // MARK: - Function that sets children as DynamicView

  private func updateChildren<P>(_ initialProps: P) throws
  where P: UIBaseViewProps {
    if let props = node["props"] as? [String: Any] {
      if let children = props["children"] as? [Any] {
        let validChildren = flattenChildNodes(children)
        initialProps.children = validChildren.enumerated().map { index, child in
          WidgetsDynamicView(name: name, kind: kind, node: child, entryIndex: entryIndex, environmentString: environmentString, path: childPath(for: child, at: index))
        }
      } else if let child = props["children"] as? [String: Any] {
        initialProps.children = [WidgetsDynamicView(name: name, kind: kind, node: child, entryIndex: entryIndex, environmentString: environmentString, path: childPath(for: child, at: 0))]
      }
    }
  }

  private func flattenChildNodes(_ children: [Any]) -> [[String: Any]] {
    return children.flatMap { child -> [[String: Any]] in
      if let node = child as? [String: Any] {
        return [node]
      }
      if let nested = child as? [Any] {
        return flattenChildNodes(nested)
      }
      return []
    }
  }
}
