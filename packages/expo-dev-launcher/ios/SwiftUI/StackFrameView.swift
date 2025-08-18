// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import React

struct StackFrameView: View {
  let frame: RCTJSStackFrame

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(frame.methodName ?? "Unknown method")
        .font(.system(.caption, design: .monospaced))
        .fontWeight(.medium)
        .foregroundColor(.primary)

      if let file = frame.file {
        VStack(alignment: .leading, spacing: 2) {
          Text("at \(file)")
            .monospacedCaptionSecondary()

          Text("Line \(frame.lineNumber), Column \(frame.column)")
            .font(.system(.caption2, design: .monospaced))
            .foregroundColor(.secondary)
        }
      }
    }
    .padding(.vertical, 4)
  }
}
