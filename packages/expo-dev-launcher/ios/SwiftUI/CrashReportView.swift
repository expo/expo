// Copyright 2015-present 650 Industries. All rights reserved.
// swiftlint:disable closure_body_length

import SwiftUI
import React

struct CrashReportView: View {
  @State private var showCopiedMessage = false

  let error: EXDevLauncherAppError
  let errorInstance: EXDevLauncherErrorInstance?
  let onDismiss: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      VStack(spacing: 16) {
        clipboardButton
        occuredSection
        reasonSection
        traceSection
      }
      .padding()

      Spacer()

      Button(action: onDismiss) {
        Text("Close")
          .font(.headline)
          .foregroundColor(.black)
          .frame(maxWidth: .infinity)
          .padding()
#if !os(tvOS)
          .background(Color(.systemGray5))
#endif
          .cornerRadius(8)
      }
      .padding()
    }
    #if !os(tvOS)
    .background(Color(.systemBackground))
    #endif
    .navigationBarHidden(true)
  }

  private func copyToClipboard() {
    let crashReport = generateJSONFromCrash()
#if !os(tvOS)
    UIPasteboard.general.string = crashReport

    showCopiedMessage = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
      showCopiedMessage = false
    }
#endif
  }

  private var clipboardButton: some View {
    Button(action: copyToClipboard) {
      Text(showCopiedMessage ? "Copied!" : "Tap to Copy Report")
        .font(.headline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding()
        .background(showCopiedMessage ? Color.green : Color.black)
        .cornerRadius(8)
    }
    .disabled(showCopiedMessage)
  }

  private var occuredSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        Text("Occurred:")
          .font(.headline)
          .fontWeight(.semibold)
        Spacer()
      }
      Text(formatTimestamp(getCrashDate()))
        .font(.body)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var reasonSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        Text("Reason:")
          .font(.headline)
          .fontWeight(.semibold)
        Spacer()
      }
      Text(error.message)
        .font(.system(.caption, design: .monospaced))
        .foregroundColor(.primary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var traceSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Stack trace:")
        .font(.headline)
        .fontWeight(.semibold)

      ScrollView([.horizontal, .vertical]) {
        VStack(alignment: .leading, spacing: 4) {
          if let errorInstance, !errorInstance.stack.isEmpty {
            Text(errorInstance.stack)
              .font(.system(.caption, design: .monospaced))
              .foregroundColor(.primary)
              .fixedSize(horizontal: true, vertical: false)
              #if !os(tvOS)
              .textSelection(.enabled)
              #endif
          } else if let stack = error.stack, !stack.isEmpty {
            ForEach(Array(stack.enumerated()), id: \.offset) { _, frame in
              StackFrameView(frame: frame)
                .padding(.vertical, 2)
            }
          } else {
            Text("No stack trace available")
              .font(.system(.caption, design: .monospaced))
              .foregroundColor(.secondary)
              .fixedSize(horizontal: true, vertical: false)
          }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .frame(maxHeight: 200)
      #if !os(tvOS)
      .background(Color(.secondarySystemGroupedBackground))
      #endif
      .cornerRadius(8)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func generateJSONFromCrash() -> String {
    let timestamp = Int64(getCrashDate().timeIntervalSince1970 * 1000)

    let stackTrace: String
    if let errorInstance, !errorInstance.stack.isEmpty {
      stackTrace = errorInstance.stack
    } else if let stack = error.stack, !stack.isEmpty {
      let stackString = stack.compactMap { frame -> String? in
        guard let methodName = frame.methodName else {
          return nil
        }
        let file = frame.file ?? "Unknown file"
        return "\tat \(methodName) (\(file):\(frame.lineNumber):\(frame.column))"
      }
      .joined(separator: "\n")
      stackTrace = "\(stackString)"
    } else {
      stackTrace = "No stack trace available"
    }

    let jsonDict: [String: Any] = [
      "timestamp": timestamp,
      "message": error.message,
      "stack": stackTrace
    ]

    do {
      let jsonData = try JSONSerialization.data(withJSONObject: jsonDict, options: .prettyPrinted)
      return String(data: jsonData, encoding: .utf8) ?? "{}"
    } catch {
      return "{\"error\": \"Failed to serialize crash report\"}"
    }
  }

  private func getCrashDate() -> Date {
    if let errorInstance {
      return Date(timeIntervalSince1970: TimeInterval(errorInstance.timestamp) / 1000.0)
    }
    return Date()
  }
}
// swiftlint:enable closure_body_length
