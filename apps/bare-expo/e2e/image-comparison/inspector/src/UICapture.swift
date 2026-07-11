import UIKit

/// Runs the body isolated to the main actor and blocks the calling thread until it returns.
/// The pipe server runs on a plain blocking thread, so it cannot `await` a main-actor hop;
/// a synchronous dispatch to the main queue is the bridge (the main queue is the main
/// actor's executor, so `assumeIsolated` is sound in both branches).
func runOnMainActor<T>(_ body: @MainActor () -> T) -> T {
  if Thread.isMainThread {
    return MainActor.assumeIsolated(body)
  }
  return DispatchQueue.main.sync {
    return MainActor.assumeIsolated(body)
  }
}

extension ScreenInspector {

  @MainActor
  func findElementByAccessibilityId(_ accessibilityId: String) -> UIView? {
    guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
      return nil
    }

    return findElementRecursively(in: window, accessibilityId: accessibilityId)
  }

  @MainActor
  func captureView(accessibilityId: String, outputPath: String) -> Data {
    guard let element = findElementByAccessibilityId(accessibilityId) else {
      return createErrorResponse("Element with accessibilityId '\(accessibilityId)' not found")
    }
    guard let window = element.window else {
      return createErrorResponse("Element with accessibilityId '\(accessibilityId)' is not attached to a window")
    }

    // Render the whole window cropped to the element's frame: an element-only render loses
    // whatever the screen composites behind or over it (transparent backgrounds turn blank).
    // The renderer defaults to the screen scale, so this matches a cropped screenshot.
    let frameInWindow = element.convert(element.bounds, to: window)
    guard !frameInWindow.isEmpty else {
      return createErrorResponse(
        "Element with accessibilityId '\(accessibilityId)' has a zero-sized frame; is it laid out and visible?")
    }
    let renderer = UIGraphicsImageRenderer(bounds: frameInWindow)
    var didDraw = false
    let image = renderer.image { _ in
      didDraw = window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
    }

    guard didDraw else {
      // Failing here beats returning the blank or stale image the renderer produced,
      // which would only surface much later as an opaque image-diff mismatch.
      return createErrorResponse("drawHierarchy failed for accessibilityId '\(accessibilityId)'")
    }

    guard let pngData = image.pngData() else {
      return createErrorResponse("Failed to encode the captured view as PNG")
    }

    do {
      try pngData.write(to: URL(fileURLWithPath: outputPath))
    } catch {
      return createErrorResponse("Failed to write the captured PNG to '\(outputPath)': \(error.localizedDescription)")
    }

    let response: [String: Any] = [
      "success": true,
      "path": outputPath,
      "width": Int(image.size.width * image.scale),
      "height": Int(image.size.height * image.scale),
      "error": "",
    ]

    do {
      return try JSONSerialization.data(withJSONObject: response, options: [])
    } catch {
      return createErrorResponse("Failed to serialize capture response: \(error.localizedDescription)")
    }
  }

  @MainActor
  private func findElementRecursively(in view: UIView, accessibilityId: String) -> UIView? {
    // Check current view
    if view.accessibilityIdentifier == accessibilityId {
      return view
    }

    // Search subviews
    for subview in view.subviews {
      if let found = findElementRecursively(in: subview, accessibilityId: accessibilityId) {
        return found
      }
    }

    return nil
  }
}
