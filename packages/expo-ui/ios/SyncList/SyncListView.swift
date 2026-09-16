// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Hosts `ExpoUISyncListView`, which is written in Objective-C++ because it creates a React root per
 row and borrows the JavaScript runtime to render one, neither of which Swift can reach.
 */
public final class SyncListView: ExpoView {
  private let list = ExpoUISyncListView()
  private var fpsView: SyncListFPSView?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    // The presenter owns the runtime scheduler and the mounting manager that a row's surface needs.
    list.surfacePresenter = appContext?.reactSurfacePresenter
    addSubview(list)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    list.frame = bounds
    fpsView?.frame = CGRect(x: max(8, bounds.width - 178), y: 8, width: 170, height: 44)
  }

  public func setShowsFPS(_ showsFPS: Bool) {
    guard showsFPS != (fpsView != nil) else {
      return
    }
    if showsFPS {
      let overlay = SyncListFPSView()
      fpsView = overlay
      addSubview(overlay)
      setNeedsLayout()
    } else {
      fpsView?.removeFromSuperview()
      fpsView = nil
    }
  }

  public func setListId(_ listId: String) {
    list.listId = listId
  }

  public func setItemCount(_ itemCount: Int) {
    list.itemCount = itemCount
  }

  public func setRenderVersion(_ version: Int) {
    list.renderVersion = version
  }

  public func setEstimatedItemSize(_ estimatedItemSize: Double) {
    list.estimatedItemSize = estimatedItemSize
  }
}

// Kept native so measuring the UI thread does not schedule JS work or rerender the list.
private final class SyncListFPSView: UILabel {
  private var displayLink: CADisplayLink?
  private var sampleStart: CFTimeInterval = 0
  private var previousTimestamp: CFTimeInterval = 0
  private var frameCount = 0
  private var longestFrame: CFTimeInterval = 0

  init() {
    super.init(frame: .zero)
    backgroundColor = UIColor.black.withAlphaComponent(0.8)
    textColor = .white
    font = .monospacedDigitSystemFont(ofSize: 12, weight: .semibold)
    textAlignment = .center
    numberOfLines = 2
    layer.cornerRadius = 8
    clipsToBounds = true
    isUserInteractionEnabled = false
    text = "UI FPS · measuring…"
    NotificationCenter.default.addObserver(self, selector: #selector(resetSample), name: UIApplication.didBecomeActiveNotification, object: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  deinit {
    displayLink?.invalidate()
    NotificationCenter.default.removeObserver(self)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    displayLink?.invalidate()
    displayLink = nil
    resetSample()
    guard let window else {
      return
    }
    // CADisplayLink retains its target. The proxy prevents it from retaining this view.
    let target = SyncListFPSTarget()
    target.view = self
    let link = CADisplayLink(target: target, selector: #selector(SyncListFPSTarget.tick(_:)))
    let maximum = Float(window.screen.maximumFramesPerSecond)
    link.preferredFrameRateRange = CAFrameRateRange(minimum: 30, maximum: maximum, preferred: maximum)
    link.add(to: .main, forMode: .common)
    displayLink = link
  }

  @objc private func resetSample() {
    sampleStart = 0
    previousTimestamp = 0
    frameCount = 0
    longestFrame = 0
  }

  fileprivate func tick(_ link: CADisplayLink) {
    guard previousTimestamp != 0 else {
      previousTimestamp = link.timestamp
      sampleStart = link.timestamp
      return
    }
    longestFrame = max(longestFrame, link.timestamp - previousTimestamp)
    previousTimestamp = link.timestamp
    frameCount += 1
    let elapsed = link.timestamp - sampleStart
    guard elapsed >= 1 else {
      return
    }
    text = String(format: "UI %.0f FPS\nMax gap %.1f ms", Double(frameCount) / elapsed, longestFrame * 1000)
    sampleStart = link.timestamp
    frameCount = 0
    longestFrame = 0
  }
}

private final class SyncListFPSTarget: NSObject {
  weak var view: SyncListFPSView?

  @objc func tick(_ link: CADisplayLink) {
    view?.tick(link)
  }
}
