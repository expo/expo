import SwiftUI
import ExpoModulesCore
import ExpoUI

final class ToggleProps: ExpoUI.ToggleProps {
  @Field var source: String?
  @Field var target: String?
  @Field var entryIndex: Int?
  @Field var environmentString: String?
}

@available(iOS 17.0, *)
struct WidgetToggleView: ExpoSwiftUI.View {
  @ObservedObject var props: ToggleProps

  var body: some View {
    SwiftUI.Toggle(
      isOn: props.isOn ?? false,
      intent: WidgetUserInteraction(
        source: props.source,
        target: props.target,
        entryIndex: props.entryIndex,
        environmentString: props.environmentString
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
struct LiveActivityToggleView: ExpoSwiftUI.View {
  @ObservedObject var props: ToggleProps

  var body: some View {
    SwiftUI.Toggle(
      isOn: props.isOn ?? false,
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
