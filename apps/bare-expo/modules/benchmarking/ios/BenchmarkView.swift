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
///
/// Receives its props decoded from their JavaScript values on the JavaScript thread. The
/// `LegacyBenchmarkView` subclass shares everything here but takes the dictionary path instead, so
/// a run on each is a like-for-like comparison of the two routes.
class BenchmarkView: ExpoView {
  override class var receivesDecodedProps: Bool {
    return true
  }

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
  // Time the two main-thread apply entry points by bracketing `super`. `updateProps(_:)` is the
  // dictionary path, `applyDecodedProps(_:)` the decoded one; a given update runs exactly one of
  // them. The dictionary path also re-materializes `propsMap` into an `NSDictionary` inside
  // `finalizeUpdates:` before calling `updateProps(_:)`, and that part is outside this window, so
  // the legacy apply figure understates the legacy path's real main-thread cost.

  override func updateProps(_ props: [String: Any]) {
    // Counts props *presented* to the legacy path, not props applied: the legacy `propsMap` is
    // sticky (it carries the full prop set every update), so even a single-prop change presents
    // all props here. The gap between this and the changed-prop count (one per pass in single
    // mode) is exactly the work the legacy path can't skip, which the decoded path avoids by
    // reading only the changed props from the rawProps diff.
    ViewPropsBenchmark.legacyPresentedPropCount += props.count
    let start = CACurrentMediaTime()
    super.updateProps(props)
    ViewPropsBenchmark.applySeconds += CACurrentMediaTime() - start
    ViewPropsBenchmark.applyPassCount += 1
  }

  override func applyDecodedProps(_ decodedProps: Any) {
    let start = CACurrentMediaTime()
    super.applyDecodedProps(decodedProps)
    ViewPropsBenchmark.applySeconds += CACurrentMediaTime() - start
    ViewPropsBenchmark.applyPassCount += 1
  }
}

/// Props lowered to a dictionary and decoded on the main thread, the path every existing
/// `ExpoView` uses.
final class LegacyBenchmarkView: BenchmarkView {
  override class var receivesDecodedProps: Bool {
    return false
  }
}
