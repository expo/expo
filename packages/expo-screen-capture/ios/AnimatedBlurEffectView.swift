class AnimatedBlurEffectView: UIVisualEffectView {
  private let blurIntensity: CGFloat
  private let blurStyle: UIBlurEffect.Style
  private var animator = UIViewPropertyAnimator(duration: 1, curve: .linear)

  private lazy var blurEffect = UIBlurEffect(style: blurStyle)

  init(style: UIBlurEffect.Style = .light, intensity: CGFloat) {
    self.blurStyle = style
    self.blurIntensity = intensity
    super.init(effect: nil)
    self.backgroundColor = .clear
  }

  required init?(coder: NSCoder) {
    self.blurStyle = .light
    self.blurIntensity = 0.5
    super.init(coder: coder)
    self.backgroundColor = .clear
  }

  func setupBlur() {
    animator.stopAnimation(true)
    animator.addAnimations { [weak self] in
      guard let self else {
        return
      }
      self.effect = self.blurEffect
    }
    animator.fractionComplete = blurIntensity
  }
}
