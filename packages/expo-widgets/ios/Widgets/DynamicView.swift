import SwiftUI
import ExpoModulesCore
import ExpoUI

// FIXME: Hack to satisfy ExpoSwiftUI.AnyChild with random UUID value
class NodeIdentityWrapper {
  let id: UUID
  init(id: UUID) { self.id = id }
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

  let uuid = NodeIdentityWrapper(id: UUID())
  public var id: ObjectIdentifier {
    ObjectIdentifier(uuid)
  }
  
  public init(source: String, kind: WidgetsKind, node: [String : Any]) {
    self.source = source
    self.kind = kind
    self.node = node
  }

  @ViewBuilder
  public var body: some View {
    switch node["type"] as? String {
    case "Text":
      if let rawProps = node["props"] as? [String: Any],
         let children = rawProps["children"] as? String {
        render(TextView.self, TextViewProps.self) { props in
          props.text = children
        }
      } else {
        EmptyView()
      }
    case "HStack":
      render(HStackView.self, HStackViewProps.self, updateProps: updateChildren)
    case "VStack":
      render(VStackView.self, VStackViewProps.self, updateProps: updateChildren)
    case "ZStack":
      render(ZStackView.self, ZStackViewProps.self, updateProps: updateChildren)
    case "Rectangle":
      render(RectangleView.self, RectangleViewProps.self)
    case "RoundedRectangle":
      render(RoundedRectangleView.self, RoundedRectangleViewProps.self)
    case "Capsule":
      render(CapsuleView.self, CapsuleViewProps.self)
    case "Circle":
      render(CircleView.self, CircleViewProps.self)
    case "Image":
      render(ImageView.self, ImageViewProps.self)
    case "Divider":
      render(DividerView.self, DividerProps.self)
    case "Ellipse":
      render(EllipseView.self, EllipseViewProps.self)
    case "Label":
      render(LabelView.self, LabelViewProps.self)
    case "Progress":
      render(ProgressView.self, ProgressViewProps.self)
    case "Spacer":
      render(SpacerView.self, SpacerViewProps.self)
    case "UnevenRoundedRectangle":
      render(UnevenRoundedRectangleView.self, UnevenRoundedRectangleViewProps.self)
    case "Gauge":
      render(GaugeView.self, GaugeProps.self)
    case "Button":
      if #available(iOS 17.0, *) {
        switch kind {
        case .widget:
          render(WidgetButtonView.self, ButtonProps.self) { buttonProps in
            buttonProps.source = source
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
      EmptyView()
    }
  }

  // MARK: - Render Method

  @ViewBuilder
  private func render<P, V>(_ viewType: V.Type, _ propsType: P.Type, updateProps: ((_ initialProps: P) throws -> Void)? = nil) -> some View
  where P: UIBaseViewProps, V: ExpoSwiftUI.View, V.Props == P {
    {
      do {
        if let rawProps = node["props"] as? [String: Any] {
          let props = try propsType.init(rawProps: rawProps, context: WidgetsContext.shared.context)
          try updateProps?(props)
          return AnyView(UIBaseView<P, V>(props: props))
        }
        return AnyView(EmptyView())
      } catch {
        return AnyView(EmptyView())
      }
    }()
  }
  
  // MARK: - Function that sets children as DynamicView
  
  private func updateChildren<P>(_ initialProps: P) throws -> Void
  where P: UIBaseViewProps {
    if let props = node["props"] as? [String: Any] {
      if let children = props["children"] as? [[String: Any]] {
        initialProps.children = children.map { WidgetsDynamicView(source: source, kind: kind, node: $0) }
      } else if let child = props["children"] as? [String: Any] {
        initialProps.children = [WidgetsDynamicView(source: source, kind: kind, node: child)]
      }
    }
  }
}

