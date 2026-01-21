// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SharedObjectTesterView: ExpoSwiftUI.View {
  @ObservedObject var props: SharedObjectTesterProps

  var body: some View {
    VStack(spacing: 16) {
      if let sharedObject = props.sharedObject {
        Text(sharedObject.text)
          .foregroundColor(sharedObject.color)
          .font(.headline)

        Text("Counter: \(sharedObject.counter)")
          .font(.subheadline)

        HStack(spacing: 12) {
          SwiftUI.Button("Increment") {
            let newValue = sharedObject.incrementCounter()
            props.onValueChange(["counter": newValue])
          }
          .buttonStyle(.bordered)

          SwiftUI.Button("Reset") {
            sharedObject.resetCounter()
            props.onValueChange(["counter": 0])
          }
          .buttonStyle(.bordered)
        }
      } else {
        Text("No shared object provided")
          .foregroundColor(.secondary)
      }
    }
    .padding()
  }
}
