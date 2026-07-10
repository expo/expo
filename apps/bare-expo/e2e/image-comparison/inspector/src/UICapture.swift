import UIKit

extension ScreenInspector {

  func findElementByAccessibilityId(_ accessibilityId: String) -> UIView? {
    guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
      return nil
    }

    return findElementRecursively(in: window, accessibilityId: accessibilityId)
  }

  func captureView(accessibilityId: String, outputPath: String) -> Data {
    guard Thread.isMainThread else {
      var result: Data!
      DispatchQueue.main.sync {
        result = captureView(accessibilityId: accessibilityId, outputPath: outputPath)
      }
      return result
    }

    guard let element = findElementByAccessibilityId(accessibilityId) else {
      return createErrorResponse("Element with accessibilityId '\(accessibilityId)' not found")
    }
    guard let window = element.window else {
      return createErrorResponse("Element with accessibilityId '\(accessibilityId)' is not attached to a window")
    }

    // Render the whole window and let the renderer bounds crop to the element's frame:
    // rendering the element alone would lose whatever the screen composites behind or over
    // it (transparent backgrounds turn blank), while this matches what a full-screen
    // screenshot cropped to the view bounds shows. UIGraphicsImageRenderer defaults to the
    // screen scale, so the PNG comes out at the same pixel density as that crop too.
    let frameInWindow = element.convert(element.bounds, to: window)
    let renderer = UIGraphicsImageRenderer(bounds: frameInWindow)
    let image = renderer.image { _ in
      window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
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
