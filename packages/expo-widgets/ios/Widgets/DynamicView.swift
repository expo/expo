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
  let name: String
  let kind: WidgetsKind
  let entryIndex: Int?
  let environmentString: String?

  let uuid = NodeIdentityWrapper(id: UUID())
  public var id: ObjectIdentifier {
    ObjectIdentifier(uuid)
  }

  public init(name: String, kind: WidgetsKind, node: [String: Any]) {
    self.name = name
    self.kind = kind
    self.node = node
    self.entryIndex = nil
    self.environmentString = nil
  }

  public init(name: String, kind: WidgetsKind, node: [String: Any], entryIndex: Int?, environmentString: String?) {
    self.name = name
    self.kind = kind
    self.node = node
    self.entryIndex = entryIndex
    self.environmentString = environmentString
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
        let validChildren = children.compactMap { $0 as? [String: Any] }
        initialProps.children = validChildren.map { WidgetsDynamicView(name: name, kind: kind, node: $0, entryIndex: entryIndex, environmentString: environmentString) }
      } else if let child = props["children"] as? [String: Any] {
        initialProps.children = [WidgetsDynamicView(name: name, kind: kind, node: child, entryIndex: entryIndex, environmentString: environmentString)]
      }
    }
  }
}
