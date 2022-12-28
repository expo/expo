import AuthenticationServices
import ExpoModulesCore

public final class AppleAuthenticationButton: ExpoView {
  let onButtonPress = EventDispatcher()

  var type: ASAuthorizationAppleIDButton.ButtonType = .default
  var style: ASAuthorizationAppleIDButton.Style = .white
  var childView: ASAuthorizationAppleIDButton?

  var needsUpdate = true

  var cornerRadius: Double = 0.0 {
    didSet {
      childView?.cornerRadius = cornerRadius
    }
  }

  func updateChildIfNeeded() {
    guard needsUpdate else {
      return
    }
    unmountChild()
    mountNewChild()
    needsUpdate = false
  }

  private func mountNewChild() {
    let newChildView = ASAuthorizationAppleIDButton(authorizationButtonType: type, authorizationButtonStyle: style)

    newChildView.cornerRadius = cornerRadius
    newChildView.translatesAutoresizingMaskIntoConstraints = false
    newChildView.addTarget(self, action: #selector(onTouchUp), for: .touchUpInside)

    addSubview(newChildView)
    childView = newChildView

    NSLayoutConstraint.activate([
      newChildView.topAnchor.constraint(equalTo: self.topAnchor),
      newChildView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
      newChildView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
      newChildView.trailingAnchor.constraint(equalTo: self.trailingAnchor)
    ])
  }

  private func unmountChild() {
    childView?.removeTarget(self, action: #selector(onTouchUp), for: .touchUpInside)
    childView?.removeFromSuperview()
    childView = nil
  }

  @objc
  private func onTouchUp() {
    onButtonPress()
  }
}
