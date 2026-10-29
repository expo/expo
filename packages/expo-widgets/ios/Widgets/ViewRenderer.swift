import SwiftUI
import ExpoModulesCore
import ExpoUI

@MainActor
struct WidgetsViewRenderer {
  let name: String
  let kind: WidgetsKind
  let node: [String: Any]
  let entryIndex: Int?
  let environmentString: String?

  func render() -> any ExpoSwiftUI.AnyChild {
    switch node["type"] as? String {
    case "TextView":
      // TextView applies common modifiers internally so concatenated text keeps
      // its SwiftUI.Text representation. Avoid applying those modifiers again.
      return render(TextView.self, TextViewProps.self, updateProps: updateChildren)
    case "SlotView":
      return render(SlotView.self, SlotViewProps.self, updateProps: updateChildren)
    case "HStackView":
      return renderWithModifiers(HStackView.self, HStackViewProps.self, updateProps: updateChildren)
    case "VStackView":
      return renderWithModifiers(VStackView.self, VStackViewProps.self, updateProps: updateChildren)
    case "ZStackView":
      return renderWithModifiers(ZStackView.self, ZStackViewProps.self, updateProps: updateChildren)
    case "OverlayView":
      return renderWithModifiers(OverlayView.self, OverlayViewProps.self, updateProps: updateChildren)
    case "BackgroundView":
      return renderWithModifiers(BackgroundView.self, BackgroundViewProps.self, updateProps: updateChildren)
    case "MaskView":
      return renderWithModifiers(MaskView.self, MaskViewProps.self, updateProps: updateChildren)
    case "RectangleView":
      return renderWithModifiers(RectangleView.self, RectangleViewProps.self)
    case "RoundedRectangleView":
      return renderWithModifiers(RoundedRectangleView.self, RoundedRectangleViewProps.self)
    case "CapsuleView":
      return renderWithModifiers(CapsuleView.self, CapsuleViewProps.self)
    case "CircleView":
      return renderWithModifiers(CircleView.self, CircleViewProps.self)
    case "ImageView":
      return renderWithModifiers(ImageView.self, ImageViewProps.self)
    case "AccessoryWidgetBackgroundView":
      return renderWithModifiers(AccessoryWidgetBackgroundView.self, AccessoryWidgetBackgroundProps.self)
    case "DividerView":
      return renderWithModifiers(DividerView.self, DividerProps.self)
    case "EllipseView":
      return renderWithModifiers(EllipseView.self, EllipseViewProps.self)
    case "LabelView":
      return renderWithModifiers(LabelView.self, LabelViewProps.self)
    case "ProgressView":
      return renderWithModifiers(ProgressView.self, ProgressViewProps.self)
    case "SpacerView":
      return renderWithModifiers(SpacerView.self, SpacerViewProps.self)
    case "UnevenRoundedRectangleView":
      return renderWithModifiers(UnevenRoundedRectangleView.self, UnevenRoundedRectangleViewProps.self)
    case "GaugeView":
      return renderWithModifiers(GaugeView.self, GaugeProps.self)
    case "ChartView":
      return renderWithModifiers(ChartView.self, ChartProps.self)
    case "Button":
      if #available(iOS 17.0, *) {
        switch kind {
        case .widget:
          return renderWithModifiers(WidgetButtonView.self, ButtonProps.self) { buttonProps in
            try updateChildren(buttonProps)
            buttonProps.source = name
            buttonProps.entryIndex = entryIndex
            buttonProps.environmentString = environmentString
          }
        case .liveActivity:
          return renderWithModifiers(LiveActivityButtonView.self, ButtonProps.self) { buttonProps in
            try updateChildren(buttonProps)
            buttonProps.source = name
          }
        }
      } else {
        return renderWithModifiers(ExpoUI.Button.self, ExpoUI.ButtonProps.self, updateProps: updateChildren)
      }
    case "react.fragment":
      return renderWithModifiers(FragmentView.self, FragmentProps.self, updateProps: updateChildren)
    case "LinkView":
      return renderWithModifiers(LinkView.self, LinkViewProps.self, updateProps: updateChildren)
#if DEBUG
    case "RedBoxView":
      return renderWithModifiers(RedBoxView.self, RedBoxViewProps.self) { redBoxProps in
        redBoxProps.source = name
        redBoxProps.kind = kind
      }
    default:
      return makeChild(
        ZStack {
          Color.red.opacity(0.5)
          Text("Unable to get the view for: \(node["type"] as? String ?? "undefined")")
        }
      )
#else
    default:
      return makeChild(EmptyView())
#endif
    }
  }

  // MARK: - Render Method

  private func renderWithModifiers<P, V>(
    _ viewType: V.Type,
    _ propsType: P.Type,
    updateProps: ((_ initialProps: P) throws -> Void)? = nil
  ) -> any ExpoSwiftUI.AnyChild
  where P: UIBaseViewProps, V: ExpoSwiftUI.View, V.Props == P {
    render(UIBaseView<P, V>.self, propsType, updateProps: updateProps)
  }

  private func render<P, V>(
    _ viewType: V.Type,
    _ propsType: P.Type,
    updateProps: ((_ initialProps: P) throws -> Void)? = nil
  ) -> any ExpoSwiftUI.AnyChild
  where P: ExpoSwiftUI.ViewProps, V: ExpoSwiftUI.View, V.Props == P {
    do {
      guard let rawProps = node["props"] as? [String: Any] else {
        return makeChild(EmptyView())
      }
      let props = try propsType.init(rawProps: rawProps, context: WidgetsContext.shared.context)
      try updateProps?(props)
      return makeChild(V(props: props))
    } catch {
      return makeChild(EmptyView())
    }
  }

  // MARK: - Child Views

  private func updateChildren<P>(_ initialProps: P) throws
  where P: ExpoSwiftUI.ViewProps {
    if let props = node["props"] as? [String: Any] {
      if let children = props["children"] as? [Any] {
        let validChildren = flattenChildNodes(children)
        initialProps.children = validChildren.map {
          WidgetsViewRenderer(name: name, kind: kind, node: $0, entryIndex: entryIndex, environmentString: environmentString).render()
        }
      } else if let child = props["children"] as? [String: Any] {
        initialProps.children = [
          WidgetsViewRenderer(name: name, kind: kind, node: child, entryIndex: entryIndex, environmentString: environmentString).render()
        ]
      }
    }
  }

  private func makeChild<Content: View>(_ view: Content) -> any ExpoSwiftUI.AnyChild {
    // Preserve the native view type for ExpoUI's slot and text inspection.
    WidgetsChildView(childView: view, stringIdentity: node["__expoWidgetIdentity"] as? String)
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
