import UIKit

@objc(EXSplashScreenHUDButton)
class SplashScreenHUDButton: UIButton {
  override func layoutSubviews() {
    let infoIcon = UIImageView()
    let symbolConfig = UIImage.SymbolConfiguration(font: .boldSystemFont(ofSize: 24))
    let infoImage = UIImage(systemName: "info.circle", withConfiguration: symbolConfig)
    infoIcon.image = infoImage
    infoIcon.frame = CGRect(x: 24, y: 0, width: 24, height: 24)
    addSubview(infoIcon)

    let title = "Stuck on splash screen?"
    setTitle(title, for: .normal)
    titleLabel?.font = .boldSystemFont(ofSize: 16)
    titleEdgeInsets = .init(top: 0, left: 24, bottom: 0, right: 0)
    super.layoutSubviews()
  }

  override var intrinsicContentSize: CGSize {
    CGSize(width: 300, height: 24)
  }
}
