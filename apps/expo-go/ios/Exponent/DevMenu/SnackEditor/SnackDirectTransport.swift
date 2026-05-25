// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Expo Module that provides direct in-process communication between the snack runtime (JS)
/// and Expo Go (Swift) for embedded snacks (lessons, playground, demo project).
///
/// This replaces the Snackpub WebSocket roundtrip with immediate native module events,
/// eliminating network latency and the "Connecting..." stuck state for embedded sessions.
public class SnackDirectTransport: Module {
  /// Singleton for access from SnackEditingSession (file edit broadcasts)
  private static var _shared: SnackDirectTransport?
  static var shared: SnackDirectTransport? { _shared }

  /// Set by SnackEditingSession when an embedded session is created/cleared.
  /// Written on main thread before React Native starts, read on JS thread after.
  /// The createNewApp() call establishes a happens-before barrier.
  static var isEmbeddedSessionAvailable: Bool = false

  public func definition() -> ModuleDefinition {
    Name("SnackDirectTransport")

    Events("onMessage")

    OnCreate {
      SnackDirectTransport._shared = self
    }

    OnDestroy {
      if SnackDirectTransport._shared === self {
        SnackDirectTransport._shared = nil
      }
    }

    Constants {
      return ["isAvailable": SnackDirectTransport.isEmbeddedSessionAvailable]
    }

    // Called by the snack runtime JS to subscribe to the channel.
    // For embedded sessions, immediately delivers the CODE message via onMessage event.
    AsyncFunction("subscribe") { (channel: String) in
      await MainActor.run {
        guard SnackEditingSession.shared.isEmbeddedSession else { return }

        if let codeMessage = SnackEditingSession.shared.buildCodeMessage() {
          self.sendEvent("onMessage", ["message": codeMessage])
        }
      }
    }

    // Called by the snack runtime JS to publish messages.
    // For embedded snacks, most messages (RESEND_CODE, CONSOLE, etc.) are no-ops —
    // console logs go through LogBox, and CODE was already delivered via subscribe.
    Function("publish") { (_: [String: Any]) in
      // No-op for embedded sessions
    }

    // Called by the snack runtime JS when unsubscribing from the channel.
    Function("unsubscribe") {
      // No cleanup needed for embedded transport
    }
  }

  // MARK: - Internal API

  /// Sends a CODE update to the snack runtime via the onMessage event.
  /// Called by SnackEditingSession when files are edited via the dev menu.
  func sendCodeUpdate(_ codeMessage: [String: Any]) {
    sendEvent("onMessage", ["message": codeMessage])
  }
}
