// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SharedObjectTesterView: ExpoSwiftUI.View {
  @ObservedObject var props: SharedObjectTesterProps

  var body: some View {
    VStack(spacing: 16) {
      if let sharedObject = props.sharedObject {
        // Use a separate view that can properly observe the shared object
        SharedObjectContentView(sharedObject: sharedObject, onValueChange: props.onValueChange)
      } else {
        Text("No shared object provided")
          .foregroundColor(.secondary)
      }
    }
    .padding()
  }
}

/// Inner view that observes the SharedObject and reactively updates when its properties change
private struct SharedObjectContentView: View {
  @ObservedObject var sharedObject: DummySharedObject
  var onValueChange: EventDispatcher

  var body: some View {
    VStack(spacing: 16) {
      Text(sharedObject.text)
        .foregroundColor(sharedObject.color)
        .font(.headline)

      Text("Counter: \(sharedObject.counter)")
        .font(.subheadline)

      HStack(spacing: 12) {
        SwiftUI.Button("Increment") {
          sharedObject.incrementCounter()
          onValueChange(["counter": sharedObject.counter])
        }
        .buttonStyle(.bordered)

        SwiftUI.Button("Reset") {
          sharedObject.resetCounter()
          onValueChange(["counter": 0])
        }
        .buttonStyle(.bordered)
      }
    }
  }
}
