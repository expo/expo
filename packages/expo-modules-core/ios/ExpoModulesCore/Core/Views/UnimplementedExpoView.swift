// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Stub for views that are not implemented in certain conditions,
 e.g. whether the New Architecture is enabled.
 */
public class UnimplementedExpoView: ExpoView {
  private let label: UILabel

  public required init(appContext: AppContext? = nil) {
    label = UILabel()
    label.backgroundColor = .red.withAlphaComponent(0.4)
    label.textColor = .white
    label.textAlignment = .center
    label.text = "View is not implemented"
    label.numberOfLines = 0
    label.allowsDefaultTighteningForTruncation = true
    label.adjustsFontSizeToFitWidth = true

    super.init(appContext: appContext)

    addSubview(label)
  }

  public convenience init(appContext: AppContext, text: String) {
    self.init(appContext: appContext)
    label.text = text
  }

  public override var bounds: CGRect {
    didSet {
      label.frame = bounds
    }
  }
}
