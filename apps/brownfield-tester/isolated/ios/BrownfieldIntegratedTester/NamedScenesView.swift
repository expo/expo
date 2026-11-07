import SwiftUI
import expoappbrownfield

struct NamedScenesView: View {
  @State private var value = 0
  @State private var showSecondCounter = true

  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        Stepper("Native value: \(value)", value: $value)
          .accessibilityIdentifier("sceneNativeValue")
        Toggle("Show second counter", isOn: $showSecondCounter)
          .accessibilityIdentifier("showSecondCounter")
        ExpoScene(name: "Counter", props: ["label": "First", "value": value])
          .frame(height: 180)
        if showSecondCounter {
          ExpoScene(name: "Counter", props: ["label": "Second", "value": value])
            .frame(height: 180)
        }
        ExpoScene(name: "Summary", props: ["value": value])
          .frame(height: 140)
      }
      .padding()
    }
    .navigationTitle("Expo scenes")
  }
}
