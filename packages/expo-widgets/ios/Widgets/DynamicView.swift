import SwiftUI
import ExpoModulesCore
import ExpoUI

// TODO(@jakex7): Hack to satisfy ExpoSwiftUI.AnyChild with random UUID value
class NodeIdentityWrapper {
  let id: UUID
  init(id: UUID) {
    self.id = id
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
  let source: String
  let kind: WidgetsKind
  let entryIndex: Int?

  let uuid = NodeIdentityWrapper(id: UUID())
  public var id: ObjectIdentifier {
    ObjectIdentifier(uuid)
  }

  public init(source: String, kind: WidgetsKind, node: [String: Any]) {
    self.source = source
    self.kind = kind
    self.node = node
    self.entryIndex = nil
  }

  public init(source: String, kind: WidgetsKind, node: [String: Any], entryIndex: Int?) {
    self.source = source
    self.kind = kind
    self.node = node
    self.entryIndex = entryIndex
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
    case "Button":
      if #available(iOS 17.0, *) {
        switch kind {
        case .widget:
          render(WidgetButtonView.self, ButtonProps.self) { buttonProps in
            buttonProps.source = source
            buttonProps.entryIndex = entryIndex
          }
        case .liveActivity:
          render(LiveActivityButtonView.self, ButtonProps.self) { buttonProps in
            buttonProps.source = source
          }
        }
      } else {
        render(ExpoUI.Button.self, ExpoUI.ButtonProps.self, updateProps: updateChildren)
      }

    default:
      ZStack {
        Color.red.opacity(0.5)
        Text("Unable to get the view for: \(node["type"] as? String ?? "undefined")")
      }
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
      if let children = props["children"] as? [[String: Any]] {
        initialProps.children = children.map { WidgetsDynamicView(source: source, kind: kind, node: $0, entryIndex: entryIndex) }
      } else if let child = props["children"] as? [String: Any] {
        initialProps.children = [WidgetsDynamicView(source: source, kind: kind, node: child, entryIndex: entryIndex)]
      }
    }
  }
}
