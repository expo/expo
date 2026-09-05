// Copyright 2025-present 650 Industries. All rights reserved.

import QuartzCore
internal import SDWebImage

/**
 * Runs one clock for every `ImageView` with `synchronizedAnimation` enabled and tells them which frame to show on each display refresh.
 * Frames of a driven image are decoded once and held while any view is registered for it.
 */
@MainActor
final class SharedAnimationDriver {
  static let shared = SharedAnimationDriver()

  // Images with more decoded frame bytes than this are left to SDWebImage's bounded frame buffer.
  static let maxBytesPerImage = 64 * 1024 * 1024 // 64mb

  // Upper bound for decoded frames held across all images.
  static let maxTotalBytes = 192 * 1024 * 1024 // 192mb

  private struct WeakView {
    weak var view: ImageView?
  }

  private final class Entry {
    let image: SDAnimatedImage
    let timeline: AnimationTimeline
    let byteSize: Int
    var views: [WeakView] = []
    var isReady = false
    var isPreloading = false

    init(image: SDAnimatedImage, timeline: AnimationTimeline, byteSize: Int) {
      self.image = image
      self.timeline = timeline
      self.byteSize = byteSize
    }
  }

  private var entries: [ObjectIdentifier: Entry] = [:]
  private var displayLink: CADisplayLink?
  private var clockStart: CFTimeInterval = 0

  private var heldBytes: Int {
    return entries.values.reduce(0) { $0 + $1.byteSize }
  }

  private init() {}

  // MARK: - Queries

  // Whether the image is small enough for its frames to be held.
  func canDrive(_ image: SDAnimatedImage) -> Bool {
    guard image.animatedImageFrameCount > 1 else {
      return false
    }
    return Self.byteSize(of: image) <= Self.maxBytesPerImage
  }

  // The frame schedule of the image, cached on `AnimatedImage` instances.
  func timeline(for image: SDAnimatedImage) -> AnimationTimeline? {
    if let entry = entries[ObjectIdentifier(image)] {
      return entry.timeline
    }
    guard let animatedImage = image as? AnimatedImage else {
      return AnimationTimeline(image: image)
    }
    if let timeline = animatedImage.sharedAnimationTimeline {
      return timeline
    }
    let timeline = AnimationTimeline(image: image)
    animatedImage.sharedAnimationTimeline = timeline
    return timeline
  }

  // Whether all frames of the image are decoded.
  func isReady(_ image: SDAnimatedImage) -> Bool {
    return entries[ObjectIdentifier(image)]?.isReady ?? false
  }

  // MARK: - Registration

  // Puts the view on the shared clock. Returns `false` when the driver cannot hold the image's frames.
  @discardableResult
  func register(_ view: ImageView, image: SDAnimatedImage) -> Bool {
    let key = ObjectIdentifier(image)
    // A view drives at most one image at a time.
    unregister(view)

    if let entry = entries[key] {
      entry.views.append(WeakView(view: view))
    } else {
      guard let timeline = timeline(for: image) else {
        return false
      }
      let byteSize = Self.byteSize(of: image)
      guard byteSize <= Self.maxBytesPerImage, heldBytes + byteSize <= Self.maxTotalBytes else {
        return false
      }
      let entry = Entry(image: image, timeline: timeline, byteSize: byteSize)
      entry.views.append(WeakView(view: view))
      entries[key] = entry
      preloadFrames(of: entry)
    }
    startDisplayLinkIfNeeded()
    return true
  }

  // Takes the view off the shared clock and releases frames nobody shows anymore.
  func unregister(_ view: ImageView) {
    for (key, entry) in entries {
      entry.views.removeAll { $0.view == nil || $0.view === view }
      if entry.views.isEmpty {
        release(key)
      }
    }
    stopDisplayLinkIfIdle()
  }

  // MARK: - Frames

  private func preloadFrames(of entry: Entry) {
    entry.isPreloading = true
    let image = entry.image

    DispatchQueue.global(qos: .userInitiated).async {
      image.preloadAllFrames()
      Task { @MainActor in
        SharedAnimationDriver.shared.finishPreloading(image)
      }
    }
  }

  private func finishPreloading(_ image: SDAnimatedImage) {
    guard let entry = entries[ObjectIdentifier(image)] else {
      // Every view left while the frames were decoding.
      image.unloadAllFrames()
      return
    }
    entry.isPreloading = false
    entry.isReady = image.isAllFramesLoaded
  }

  private func release(_ key: ObjectIdentifier) {
    guard let entry = entries.removeValue(forKey: key) else {
      return
    }
    // A running preload unloads the frames itself when it finishes.
    if !entry.isPreloading {
      entry.image.unloadAllFrames()
    }
  }

  private static func byteSize(of image: SDAnimatedImage) -> Int {
    let width = Int(image.size.width * image.scale)
    let height = Int(image.size.height * image.scale)
    return Int(image.animatedImageFrameCount) * width * height * 4
  }

  // MARK: - Clock

  private func startDisplayLinkIfNeeded() {
    guard displayLink == nil, !entries.isEmpty else {
      return
    }
    clockStart = CACurrentMediaTime()
    let displayLink = CADisplayLink(target: self, selector: #selector(handleDisplayLink(_:)))
    displayLink.add(to: .main, forMode: .common)
    self.displayLink = displayLink
  }

  private func stopDisplayLinkIfIdle() {
    guard entries.isEmpty else {
      return
    }
    displayLink?.invalidate()
    displayLink = nil
  }

  @objc
  private func handleDisplayLink(_ displayLink: CADisplayLink) {
    let elapsed = displayLink.targetTimestamp - clockStart

    for (key, entry) in entries {
      entry.views.removeAll { $0.view == nil }
      if entry.views.isEmpty {
        release(key)
        continue
      }
      guard entry.isReady else {
        continue
      }
      for holder in entry.views {
        holder.view?.renderSharedAnimationFrame(elapsed: elapsed)
      }
    }
    stopDisplayLinkIfIdle()
  }
}
