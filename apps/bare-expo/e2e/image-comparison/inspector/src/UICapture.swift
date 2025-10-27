import UIKit

extension ScreenInspector {

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
}
