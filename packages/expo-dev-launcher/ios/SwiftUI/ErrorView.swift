// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import React

struct ErrorView: View {
  let error: EXDevLauncherAppError
  let onReload: () -> Void
  let onGoHome: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(alignment: .leading, spacing: 18) {
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

          information
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
      }
      actions
    }
    .background(Color(.systemBackground))
    .navigationBarHidden(true)
  }

  private var information: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Error information")
        .font(.headline)
        .fontWeight(.bold)

      Text(error.message)
        .font(.system(.body, design: .monospaced))
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemGray6))
        .cornerRadius(8)

      if let stack = error.stack, !stack.isEmpty {
        VStack(alignment: .leading, spacing: 8) {
          Text("Stack Trace")
            .font(.subheadline)
            .fontWeight(.semibold)

          LazyVStack(alignment: .leading, spacing: 4) {
            ForEach(Array(stack.enumerated()), id: \.offset) { _, frame in
              StackTrace(frame: frame)
                .padding(.vertical, 2)
            }
          }
          .padding()
          .background(Color(.systemGray6))
          .cornerRadius(8)
        }
      }
    }
  }

  private var actions: some View {
    VStack(spacing: 6) {
      Button(action: onReload) {
        Text("Reload")
          .font(.headline)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color(red: 0.108, green: 0.124, blue: 0.139))
          .cornerRadius(8)
      }

      Button(action: onGoHome) {
        Text("Go to home")
          .font(.headline)
          .foregroundColor(Color(red: 0.108, green: 0.124, blue: 0.139))
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color(red: 0.941, green: 0.945, blue: 0.949))
          .cornerRadius(8)
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 20)
    .background(Color(.systemBackground))
  }
}

struct StackTrace: View {
  let frame: RCTJSStackFrame

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(frame.methodName ?? "Unknown method")
        .font(.system(.body, design: .monospaced))
        .foregroundColor(.primary)

      if let file = frame.file {
        Text(file)
          .font(.system(.caption, design: .monospaced))
          .foregroundColor(.secondary)
      }
    }
  }
}
