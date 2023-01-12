import AuthenticationServices
import ExpoModulesCore

public final class AppleAuthenticationButton: ExpoView {
  let onButtonPress = EventDispatcher()

  var type: ButtonType = .signIn
  var style: ButtonStyle = .white
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
    let newChildView = ASAuthorizationAppleIDButton(
      authorizationButtonType: type.toAppleAuthButtonType(),
      authorizationButtonStyle: style.toAppleAuthButtonStyle()
    )

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
