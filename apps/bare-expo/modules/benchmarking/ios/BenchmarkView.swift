import ExpoModulesCore
import QuartzCore
import UIKit

/// A record-typed prop, exercising the `@Record` decode path.
@Record
struct BenchmarkStyle {
  var opacity: Double = 1
  var cornerRadius: Double = 0
  var label: String = ""
  var weight: Int = 0
}

/// A UIView with a wide, varied set of JS-thread-decodable props (primitives, strings, an array,
/// and a record) so a prop-update loop exercises the decoding path meaningfully. A few props are
/// rendered for live confirmation that decode → apply lands the right values: `color` → background,
/// `title`/`count` → an overlaid label. The setters are still cheap, but note the label text +
/// background updates add a little real apply work (per the benchmark, that's representative —
/// real views do work in their setters).
final class BenchmarkView: ExpoView {
  // The label (fully owned, fills bounds) doubles as the colored background. We can't use the
  // view's own `backgroundColor`: `RCTViewComponentView` (this view's Fabric base) overrides that
  // setter to only stash the color and apply it via a private backing layer during ITS prop-diff —
  // so a direct `backgroundColor =` never repaints. Setting it on the label sidesteps RN's layer
  // management.
  private let label = UILabel()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    label.textColor = .white
    label.font = .monospacedSystemFont(ofSize: 13, weight: .semibold)
    label.textAlignment = .center
    addSubview(label)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    label.frame = bounds
  }

  private func updateLabel() {
    label.text = "\(title)  ·  #\(count)"
  }

  var color: UIColor = .clear {
    didSet {
      label.backgroundColor = color
    }
  }
  var title: String = "" {
    didSet {
      updateLabel()
    }
  }
  var count: Int = 0 {
    didSet {
      updateLabel()
    }
  }
  var decoration = BenchmarkStyle()
  var values: [Double] = []

  // MARK: - Benchmark instrumentation
  //
  // Bracket the main-thread apply phase via core's lifecycle hooks instead of timing inside core.
  // `viewWillUpdateProps` runs at the start of `finalizeUpdates`, `viewDidUpdateProps` at the end.

  private var applyStart: CFTimeInterval = 0

  override func viewWillUpdateProps() {
    applyStart = CACurrentMediaTime()
  }

  override func viewDidUpdateProps() {
    ViewPropsBenchmark.applySeconds += CACurrentMediaTime() - applyStart
    ViewPropsBenchmark.applyPassCount += 1
  }

  override func updateProps(_ props: [String: Any]) {
    // Reached only on the legacy dictionary path (the JSI path applies via `applyDecodedProps`).
    // Counts props *presented* to the legacy path, not props applied: the legacy `propsMap` is
    // sticky (it carries the full prop set every update), so even a single-prop change presents
    // all props here. The gap between this and the changed-prop count (one per pass in single
    // mode) is exactly the work the legacy path can't skip, which the JSI path avoids by reading
    // only the changed props from the rawProps diff.
    ViewPropsBenchmark.legacyPresentedPropCount += props.count
    super.updateProps(props)
  }
}
