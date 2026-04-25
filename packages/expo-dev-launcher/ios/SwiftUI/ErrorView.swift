// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import React

struct ErrorView: View {
  let error: EXDevLauncherAppError
  let onReload: () -> Void
  let onGoHome: () -> Void
  @State private var copied = false

  var body: some View {
    VStack(spacing: 0) {
      VStack(alignment: .leading, spacing: 12) {
        Text("There was a problem loading the project.")
          .font(.title2)
          .fontWeight(.bold)
          .multilineTextAlignment(.leading)

        Text("This development build encountered the following error:")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.leading)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.horizontal, 20)
      .padding(.top, 20)

      stackTrace

      actions
    }
    .background(Color.expoSystemBackground)
    #if !os(macOS)
    .navigationBarHidden(true)
    #endif
  }

  private var stackTrace: some View {
    ScrollView([.horizontal, .vertical]) {
      VStack(alignment: .leading, spacing: 4) {
        if let stack = error.stack, !stack.isEmpty {
          ForEach(Array(stack.enumerated()), id: \.offset) { _, frame in
            StackFrameView(frame: frame)
              .padding(.vertical, 2)
          }
        } else {
          Text(error.message)
            .font(.system(.caption, design: .monospaced))
            .foregroundColor(.primary)
        }
      }
      .padding()
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .background(Color.expoSystemGray6)
    .cornerRadius(8)
  }

  private var errorText: String {
    var text = error.message
    if let stack = error.stack, !stack.isEmpty {
      for frame in stack {
        let method = frame.methodName ?? "Unknown method"
        text += "\n\(method)"
        if let file = frame.file {
          text += "\n  at \(file):\(frame.lineNumber):\(frame.column)"
        }
      }
    }
    return text
  }

  private var actions: some View {
    VStack(spacing: 6) {
      Button(action: onReload) {
        Text("Reload")
          .font(.headline)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.black)
          .cornerRadius(8)
      }

      HStack(spacing: 6) {
        Button(action: onGoHome) {
          Text("Go home")
            .font(.headline)
            .foregroundColor(.primary)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.expoSystemGray5)
            .cornerRadius(8)
        }

        #if !os(tvOS)
        Button(action: {
          #if !os(macOS)
          UIPasteboard.general.string = errorText
          #else
          NSPasteboard.general.clearContents()
          NSPasteboard.general.setString(errorText, forType: .string)
          #endif
          copied = true
          DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            copied = false
          }
        }) {
          Text(copied ? "Copied!" : "Copy")
            .font(.headline)
            .foregroundColor(.primary)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.expoSystemGray5)
            .cornerRadius(8)
        }
        #endif
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 20)
    .background(Color.expoSystemBackground)
  }
}
