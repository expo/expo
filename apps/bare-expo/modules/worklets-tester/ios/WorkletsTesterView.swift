import ExpoModulesCore

class WorkletsTesterView: ExpoView {
  var onPressSync: WorkletCallback?

  private lazy var button: UIButton = {
    let button = UIButton(type: .system)
    button.setTitle("Call Worklet", for: .normal)
    button.addTarget(self, action: #selector(buttonPressed), for: .touchUpInside)
    return button
  }()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addSubview(button)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    button.frame = bounds
  }

  @objc private func buttonPressed() {
    try? onPressSync?.call(arguments: ["hello from native"])
  }
}
