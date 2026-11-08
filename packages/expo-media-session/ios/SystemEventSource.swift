import AVFoundation
import UIKit

final class SystemEventSource {
  private let center: NotificationCenter
  private var tokens: [NSObjectProtocol] = []

  // Notifications arrive on the posting thread; the coordinator hops onto its queue.
  init(
    coordinator: SessionCoordinator,
    center: NotificationCenter = .default,
    session: AVAudioSession = .sharedInstance()
  ) {
    self.center = center
    tokens = [
      center.addObserver(forName: AVAudioSession.interruptionNotification, object: session, queue: nil) {
        [weak coordinator] notification in
        guard let coordinator, let type = Self.interruptionType(notification) else {
          return
        }
        switch type {
        case .began:
          coordinator.interruptionBegan(reason: Self.interruptionReason(notification))
        case .ended:
          coordinator.interruptionEnded(shouldResume: Self.shouldResume(notification))
        @unknown default:
          break
        }
      },
      center.addObserver(forName: AVAudioSession.routeChangeNotification, object: session, queue: nil) {
        [weak coordinator] notification in
        coordinator?.routeChanged(Self.routeChangeReason(notification))
      },
      center.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: session, queue: nil) {
        [weak coordinator] _ in
        coordinator?.mediaServicesWereReset()
      },
      center.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: nil) {
        [weak coordinator] _ in
        coordinator?.willEnterForeground()
      },
    ]
  }

  deinit {
    for token in tokens {
      center.removeObserver(token)
    }
  }

  private static func interruptionType(_ notification: Notification) -> AVAudioSession.InterruptionType? {
    guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt else {
      return nil
    }
    return AVAudioSession.InterruptionType(rawValue: raw)
  }

  private static func interruptionReason(_ notification: Notification) -> InterruptionReason {
    let raw = notification.userInfo?[AVAudioSessionInterruptionReasonKey] as? UInt ?? 0
    if raw == AVAudioSession.InterruptionReason.builtInMicMuted.rawValue {
      return .builtInMicMuted
    }
    if #available(iOS 17.0, *), raw == AVAudioSession.InterruptionReason.routeDisconnected.rawValue {
      return .routeDisconnected
    }
    return .default
  }

  private static func shouldResume(_ notification: Notification) -> Bool {
    let raw = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
    return AVAudioSession.InterruptionOptions(rawValue: raw).contains(.shouldResume)
  }

  private static func routeChangeReason(_ notification: Notification) -> RouteChangeReason {
    guard let raw = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
      let reason = AVAudioSession.RouteChangeReason(rawValue: raw)
    else {
      return .other
    }
    switch reason {
    case .oldDeviceUnavailable:
      return .oldDeviceUnavailable
    case .newDeviceAvailable:
      return .newDeviceAvailable
    case .categoryChange:
      return .categoryChange
    default:
      return .other
    }
  }
}
