import UIKit

extension ScreenshotServer {

    func findElementByAccessibilityId(_ accessibilityId: String) -> UIView? {
        guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
            return nil
        }

        return findElementRecursively(in: window, accessibilityId: accessibilityId)
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

    func captureElementScreenshot(element: UIView) -> UIImage? {
        // Try to capture full scrollable content first
        if let scrollableScreenshot = captureFullScrollableContent(element: element) {
            return scrollableScreenshot
        }

        // Fallback to regular element screenshot
        return captureElementBounds(element: element)
    }

    func captureElementBounds(element: UIView) -> UIImage? {
        // Ensure we're on the main thread for UI operations
        guard Thread.isMainThread else {
            var result: UIImage?
            DispatchQueue.main.sync {
                result = captureElementBounds(element: element)
            }
            return result
        }

        let bounds = element.bounds
        guard bounds.width > 0 && bounds.height > 0 else {
            print("Element has zero size bounds")
            return nil
        }

        // Create graphics context
        UIGraphicsBeginImageContextWithOptions(bounds.size, false, UIScreen.main.scale)
        defer { UIGraphicsEndImageContext() }

        guard let context = UIGraphicsGetCurrentContext() else {
            print("Failed to create graphics context")
            return nil
        }

        // Render the view hierarchy
        element.layer.render(in: context)

        // Get the image
        let screenshot = UIGraphicsGetImageFromCurrentImageContext()
        return screenshot
    }

    // Capture full scrollable content of an element
    private func captureFullScrollableContent(element: UIView) -> UIImage? {
        guard Thread.isMainThread else {
            var result: UIImage?
            DispatchQueue.main.sync {
                result = captureFullScrollableContent(element: element)
            }
            return result
        }

        // Check if element is a scroll view or contains one
        let scrollView = findScrollView(in: element)

        if let scrollView = scrollView {
            return captureScrollViewFullContent(scrollView: scrollView)
        } else {
            // If not scrollable, check content size vs bounds
            let contentSize = getContentSize(of: element)
            let bounds = element.bounds

            if contentSize.height > bounds.height || contentSize.width > bounds.width {
                // Element has content larger than visible bounds
                return captureFullContentSize(element: element, contentSize: contentSize)
            }
        }

        return nil // No scrollable content detected
    }

    private func findScrollView(in view: UIView) -> UIScrollView? {
        if let scrollView = view as? UIScrollView {
            return scrollView
        }

        for subview in view.subviews {
            if let scrollView = findScrollView(in: subview) {
                return scrollView
            }
        }

        return nil
    }

    private func getContentSize(of view: UIView) -> CGSize {
        if let scrollView = view as? UIScrollView {
            return scrollView.contentSize
        }

        // For other views, calculate based on subviews
        var maxX: CGFloat = view.bounds.width
        var maxY: CGFloat = view.bounds.height

        for subview in view.subviews {
            let frame = subview.frame
            maxX = max(maxX, frame.maxX)
            maxY = max(maxY, frame.maxY)
        }

        return CGSize(width: maxX, height: maxY)
    }

    private func captureScrollViewFullContent(scrollView: UIScrollView) -> UIImage? {
        let originalOffset = scrollView.contentOffset
        let originalFrame = scrollView.frame
        let contentSize = scrollView.contentSize

        guard contentSize.width > 0 && contentSize.height > 0 else {
            return nil
        }

        // Create graphics context for full content
        UIGraphicsBeginImageContextWithOptions(contentSize, false, UIScreen.main.scale)
        defer {
            UIGraphicsEndImageContext()
            // Restore original state
            scrollView.frame = originalFrame
            scrollView.setContentOffset(originalOffset, animated: false)
        }

        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }

        // Temporarily resize the scroll view to match its content size
        // This makes the entire content visible without scrolling
        scrollView.frame = CGRect(origin: originalFrame.origin, size: contentSize)

        // Reset scroll position to show all content from the top-left
        scrollView.setContentOffset(.zero, animated: false)

        // Force layout to update with new frame
        scrollView.layoutIfNeeded()

        // Small delay to ensure content is fully laid out
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.05))

        // Now render the entire content
        scrollView.layer.render(in: context)

        return UIGraphicsGetImageFromCurrentImageContext()
    }

    private func captureFullContentSize(element: UIView, contentSize: CGSize) -> UIImage? {
        // Create graphics context for full content size
        UIGraphicsBeginImageContextWithOptions(contentSize, false, UIScreen.main.scale)
        defer { UIGraphicsEndImageContext() }

        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }

        // Save the current transform
        let originalTransform = element.transform

        // Render the view with full content
        element.layer.render(in: context)

        // Restore original transform
        element.transform = originalTransform

        return UIGraphicsGetImageFromCurrentImageContext()
    }

    // Alternative method using drawHierarchy for better results with some views
    func captureElementScreenshotWithDrawHierarchy(element: UIView) -> UIImage? {
        guard Thread.isMainThread else {
            var result: UIImage?
            DispatchQueue.main.sync {
                result = captureElementScreenshotWithDrawHierarchy(element: element)
            }
            return result
        }

        let bounds = element.bounds
        guard bounds.width > 0 && bounds.height > 0 else {
            return nil
        }

        UIGraphicsBeginImageContextWithOptions(bounds.size, false, UIScreen.main.scale)
        defer { UIGraphicsEndImageContext() }

        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }

        // Use drawHierarchy which can capture more complex views
        let success = element.drawHierarchy(in: bounds, afterScreenUpdates: false)

        if !success {
            print("drawHierarchy returned false, falling back to layer.render")
            element.layer.render(in: context)
        }

        return UIGraphicsGetImageFromCurrentImageContext()
    }

    // Method to capture full screen and crop to element bounds
    func captureElementScreenshotFromFullScreen(element: UIView) -> UIImage? {
        guard Thread.isMainThread else {
            var result: UIImage?
            DispatchQueue.main.sync {
                result = captureElementScreenshotFromFullScreen(element: element)
            }
            return result
        }

        guard let window = element.window ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
            return nil
        }

        // Get element's frame in window coordinates
        let elementFrameInWindow = element.convert(element.bounds, to: window)

        // Capture full window
        UIGraphicsBeginImageContextWithOptions(window.bounds.size, false, UIScreen.main.scale)
        defer { UIGraphicsEndImageContext() }

        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }

        window.layer.render(in: context)

        guard let fullScreenshot = UIGraphicsGetImageFromCurrentImageContext() else {
            return nil
        }

        // Crop to element bounds
        let scale = UIScreen.main.scale
        let cropRect = CGRect(
            x: elementFrameInWindow.origin.x * scale,
            y: elementFrameInWindow.origin.y * scale,
            width: elementFrameInWindow.size.width * scale,
            height: elementFrameInWindow.size.height * scale
        )

        guard let cgImage = fullScreenshot.cgImage?.cropping(to: cropRect) else {
            return nil
        }

        return UIImage(cgImage: cgImage, scale: scale, orientation: fullScreenshot.imageOrientation)
    }
}