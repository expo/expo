// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import React

struct ErrorView: View {
  let error: EXDevLauncherAppError
  let onReload: () -> Void
  let onGoHome: () -> Void

#if os(tvOS)
  let systemGray6 = Color(.systemGray)
  let systemGray4 = Color(.systemGray)
  let systemBackground = Color(.white)
#else
  let systemGray6 = Color(.systemGray6)
  let systemGray4 = Color(.systemGray4)
  let systemBackground = Color(.systemBackground)
#endif

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
      .padding(.horizontal, 20)
      .padding(.top, 20)

      stackTrace

      actions
    }
    .background(systemBackground)
    .navigationBarHidden(true)
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
    .background(systemGray6)
    .cornerRadius(8)
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

      Button(action: onGoHome) {
        Text("Go to home")
          .font(.headline)
          .foregroundColor(.black)
          .frame(maxWidth: .infinity)
          .padding()
#if !os(tvOS)
          .background(Color(.systemGray5))
#endif
          .cornerRadius(8)
      }
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 20)
    .background(systemBackground)
  }
}
