// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SwiftUI
import UIKit

enum PerfMonitorConstants {
  static let maxWidth: CGFloat = 360
  static let screenWidthRatio: CGFloat = 0.95
}

@objc enum PerfMonitorTrack: Int {
  case ui = 0
  case js = 1

  var displayName: String {
    switch self {
    case .ui:
      return "UI"
    case .js:
      return "JS"
    }
  }
}

struct PerfMonitorSnapshot: Equatable {
  var uiTrack: PerfMonitorTrackSnapshot
  var jsTrack: PerfMonitorTrackSnapshot
  var memoryMB: Double
  var heapMB: Double
  var layoutDurationMS: Double

  var formattedMemory: String { String(format: "%.2f", memoryMB) }
  var formattedHeap: String { String(format: "%.2f", heapMB) }
  var formattedLayoutDuration: String { String(format: "%.1f", layoutDurationMS) }
}

struct PerfMonitorTrackSnapshot: Equatable {
  let label: String
  var currentFPS: Int
  var history: [Double]
  var formattedFPS: String { "\(currentFPS) fps" }
}

@objcMembers
@MainActor
final class PerfMonitorViewModel: NSObject, ObservableObject {
  @Published private(set) var snapshot: PerfMonitorSnapshot
  private var onClose: (() -> Void)?

  override init() {
    snapshot = PerfMonitorSnapshot(
      uiTrack: PerfMonitorTrackSnapshot(
        label: PerfMonitorTrack.ui.displayName,
        currentFPS: 0,
        history: []
      ),
      jsTrack: PerfMonitorTrackSnapshot(
        label: PerfMonitorTrack.js.displayName,
        currentFPS: 0,
        history: []
      ),
      memoryMB: 0,
      heapMB: 0,
      layoutDurationMS: 0
    )
    super.init()
  }

  func updateStats(memoryMB: NSNumber, heapMB: NSNumber, layoutDurationMS: NSNumber) {
    snapshot.memoryMB = memoryMB.doubleValue
    snapshot.heapMB = heapMB.doubleValue
    snapshot.layoutDurationMS = layoutDurationMS.doubleValue
  }

  func updateTrack(_ track: PerfMonitorTrack, currentFPS: NSNumber, history: [NSNumber]) {
    let trackSnapshot = PerfMonitorTrackSnapshot(
      label: track.displayName,
      currentFPS: currentFPS.intValue,
      history: history.map(\.doubleValue)
    )

    switch track {
    case .ui:
      snapshot.uiTrack = trackSnapshot
    case .js:
      snapshot.jsTrack = trackSnapshot
    }
  }

  func setCloseHandler(_ handler: @escaping () -> Void) {
    onClose = handler
  }

  func closeMonitor() {
    onClose?()
  }

  func clearCloseHandler() {
    onClose = nil
  }
}

@objc(EXPerfMonitorPresenter)
@objcMembers
@MainActor
final class PerfMonitorPresenter: NSObject {
  private let viewModel: PerfMonitorViewModel
  private let hostingController: PerfMonitorHostingController

  override init() {
    viewModel = PerfMonitorViewModel()
    hostingController = PerfMonitorHostingController(viewModel: viewModel)
    super.init()
  }

  var view: UIView {
    hostingController.view
  }

  func setContentSizeHandler(_ handler: @escaping (NSValue) -> Void) {
    hostingController.contentSizeDidChange = handler
  }

  func clearContentSizeHandler() {
    hostingController.contentSizeDidChange = nil
    viewModel.clearCloseHandler()
  }

  func currentContentSizeValue() -> NSValue {
    let preferredSize = hostingController.preferredContentSize
    guard preferredSize == .zero else {
      return NSValue(cgSize: preferredSize)
    }

    let intrinsic = hostingController.view.intrinsicContentSize
    guard intrinsic == .zero else {
      return NSValue(cgSize: intrinsic)
    }

    let targetWidth = min(
      UIScreen.main.bounds.width * PerfMonitorConstants.screenWidthRatio,
      PerfMonitorConstants.maxWidth
    )
    return NSValue(cgSize: CGSize(width: targetWidth, height: 176))
  }

  func updateStats(memoryMB: NSNumber, heapMB: NSNumber, layoutDurationMS: NSNumber) {
    viewModel.updateStats(memoryMB: memoryMB, heapMB: heapMB, layoutDurationMS: layoutDurationMS)
  }

  func updateTrack(_ track: PerfMonitorTrack, currentFPS: NSNumber, history: [NSNumber]) {
    viewModel.updateTrack(track, currentFPS: currentFPS, history: history)
  }

  func setCloseHandler(_ handler: @escaping () -> Void) {
    viewModel.setCloseHandler(handler)
  }
}
