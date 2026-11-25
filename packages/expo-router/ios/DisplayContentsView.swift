import ExpoModulesCore

// A native view that React Native lays out with `display: contents`. Fabric gives it an empty box,
// and UIKit hides the subviews of a zero-size view from accessibility. So the view takes the box
// of its subviews instead, and the subviews stay where Fabric put them.
class DisplayContentsView: RouterViewWithLogger {
  private var fabricOrigin: CGPoint = .zero
  private var observations: [ObjectIdentifier: [NSKeyValueObservation]] = [:]

  override var center: CGPoint {
    get { super.center }
    set {
      fabricOrigin = newValue
      fitSubviews()
    }
  }

  override var bounds: CGRect {
    get { super.bounds }
    set { fitSubviews() }
  }

  override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    observations[ObjectIdentifier(subview)] = [
      subview.observe(\.center) { [weak self] _, _ in MainActor.assumeIsolated { self?.fitSubviews() } },
      subview.observe(\.bounds) { [weak self] _, _ in MainActor.assumeIsolated { self?.fitSubviews() } },
    ]
    fitSubviews()
  }

  override func willRemoveSubview(_ subview: UIView) {
    super.willRemoveSubview(subview)
    observations[ObjectIdentifier(subview)] = nil
    fitSubviews(excluding: subview)
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let hit = super.hitTest(point, with: event)
    return hit === self ? nil : hit
  }

  private func fitSubviews(excluding removed: UIView? = nil) {
    // `center` and `bounds` give the layout box. `frame` also includes the transform.
    let content = subviews.filter { $0 !== removed }.reduce(CGRect.null) { box, subview in
      let size = subview.bounds.size
      return box.union(
        CGRect(
          x: subview.center.x - size.width / 2,
          y: subview.center.y - size.height / 2,
          width: size.width,
          height: size.height
        ))
    }
    let newBounds = content.isNull ? .zero : content
    let newCenter = CGPoint(x: fabricOrigin.x + newBounds.midX, y: fabricOrigin.y + newBounds.midY)
    if super.bounds != newBounds {
      super.bounds = newBounds
    }
    if super.center != newCenter {
      super.center = newCenter
    }
  }
}
