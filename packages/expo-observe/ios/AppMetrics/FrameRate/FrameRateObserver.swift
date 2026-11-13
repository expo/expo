import QuartzCore

internal protocol FrameRateObserverDelegate: AnyObject {
  @MainActor
  func onDisplayLinkUpdate(_ frame: Frame)
}

final class FrameRateObserver: Sendable {
  nonisolated(unsafe) private weak var delegate: FrameRateObserverDelegate?
  nonisolated(unsafe) private weak var displayLink: CADisplayLink?

  init(delegate: FrameRateObserverDelegate) {
    let displayLink = CADisplayLink(target: self, selector: #selector(update))
    displayLink.add(to: .main, forMode: .common)
    self.displayLink = displayLink
    self.delegate = delegate
  }

  deinit {
    displayLink?.invalidate()
    displayLink = nil
  }

  @MainActor
  @objc
  private func update(_ displayLink: CADisplayLink) {
    guard let delegate else {
      return
    }
    let frame = Frame(
      timestamp: displayLink.timestamp,
      targetTimestamp: displayLink.targetTimestamp,
      duration: displayLink.duration
    )
    delegate.onDisplayLinkUpdate(frame)
  }
}
