import SwiftUI
import ExpoModulesCore
import ExpoUI

final class ButtonProps: ExpoUI.ButtonProps {
  @Field var source: String?
  @Field var target: String?
}

@available(iOS 17.0, *)
struct WidgetButtonView: ExpoSwiftUI.View {
  @ObservedObject var props: ButtonProps

  var body: some View {
    SwiftUI.Button(
      role: props.role?.toNativeRole(),
      intent: WidgetUserInteraction(
        source: props.source,
        target: props.target
      )
    ) {
      if let label = props.label {
        if let systemImage = props.systemImage {
          Label(title: { Text(label) }, icon: { Image(systemName: systemImage) })
        } else {
          Text(label)
        }
      } else {
        Children()
      }
    }
  }
}

@available(iOS 17.0, *)
struct LiveActivityButtonView: ExpoSwiftUI.View {
  @ObservedObject var props: ButtonProps

  var body: some View {
    SwiftUI.Button(
      role: props.role?.toNativeRole(),
      intent: LiveActivityUserInteraction(
        source: props.source,
        target: props.target
      )
    ) {
      if let label = props.label {
        if let systemImage = props.systemImage {
          Label(title: { Text(label) }, icon: { Image(systemName: systemImage) })
        } else {
          Text(label)
        }
      } else {
        Children()
      }
    }
  }
}
