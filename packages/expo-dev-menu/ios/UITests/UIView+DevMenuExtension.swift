import UIKit

extension UIView {
  func isVisable() -> Bool {
    return isHidden == false && window != nil && bounds.isEmpty == false && bounds.width > 0 && bounds.height > 0
  }
}
