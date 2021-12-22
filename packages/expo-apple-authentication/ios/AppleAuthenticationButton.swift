// Copyright 2018-present 650 Industries. All rights reserved.

import AuthenticationServices

@available(iOS 13.0, *)
internal class AppleAuthenticationButton : ASAuthorizationAppleIDButton {
  private var onButtonPress: () -> Void
  
  override init(authorizationButtonType type: ASAuthorizationAppleIDButton.ButtonType, authorizationButtonStyle style: ASAuthorizationAppleIDButton.Style) {
    self.addTarget(self,
                   action: #selector(onDidPress),
                   for: .touchUpInside)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  @objc
  func onDidPress() {
    self.onButtonPress()
  }
  
  func supportedEvents() -> [String] {
    return ["onButtonPress"]
  }
}
