import ExpoModulesCore
import SwiftUI
import ExpoUI

public final class RedBoxViewProps: UIBaseViewProps {
  @Field var message: String
  @Field var source: String?
  @Field var stack: String?
  var kind: WidgetsKind = .widget
}

public struct RedBoxView: ExpoSwiftUI.View {
  @ObservedObject public var props: RedBoxViewProps

  public init(props: RedBoxViewProps) {
    self.props = props
  }

  public var body: some View {
    FullSizeZStack(kind: props.kind) {
      Color.red
      VStack(alignment: .leading, spacing: 2) {
        HStack(spacing: 6) {
          Image(systemName: "exclamationmark.triangle.fill")
          Text("Error").font(.headline)
          Spacer()
          if #available(iOS 17.0, *) {
            Button(intent: WidgetReload(source: props.source)) {
              Image(systemName: "arrow.clockwise")
            }
              .buttonStyle(.plain)
              .padding(4)
          }
        }
        .foregroundStyle(.white)

        Text(props.message)
          .font(.system(size: 14).bold().monospaced())
          .foregroundStyle(.white.opacity(0.9))
          .modifier(RedBoxBody())

        if let stack = props.stack, !stack.isEmpty {
          Text(stack)
            .font(.system(size: 11).monospaced())
            .foregroundStyle(.white.opacity(0.75))
            .modifier(RedBoxBody())
        }
      }
      .padding(12)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }
}

private struct RedBoxBody: ViewModifier {
  @ViewBuilder
  func body(content: Content) -> some View {
    let base = content.lineLimit(nil).fixedSize(horizontal: false, vertical: true)
    if #available(iOS 26.0, *) {
      base.lineHeight(.tight)
    } else {
      base
    }
  }
}

public struct FullSizeZStack<Content: View>: View {
  let kind: WidgetsKind
  let content: Content

  init(kind: WidgetsKind = .widget, @ViewBuilder _ content: () -> Content) {
    self.kind = kind
    self.content = content()
  }

  public var body: some View {
    if #available(iOS 17.0, *), kind == .widget {
      ZStack { content }.containerRelativeFrame([.horizontal, .vertical])
    } else {
      ZStack { content }.frame(maxWidth: .infinity)
    }
  }
}
