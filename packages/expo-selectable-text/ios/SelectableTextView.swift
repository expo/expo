import ExpoModulesCore

final class SelectableTextView: ExpoView {
  let onMenuAction = EventDispatcher()
  lazy var controller: ExpoSelectableTextController = {
    let controller = ExpoSelectableTextController(hostView: self)
    controller.onMenuAction = { [weak self] id, selectedText, start, end in
      self?.onMenuAction([
        "id": id,
        "selectedText": selectedText,
        "start": start,
        "end": end
      ])
    }
    return controller
  }()

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    // Only touches inside this view can start a selection, not pointer hover, other hit tests,
    // or the hit tests UIKit sends to siblings while it looks for the touched view.
    if event?.type == .touches && self.point(inside: point, with: event) {
      controller.prepareForTouch(at: point, with: event)
    }
    return super.hitTest(point, with: event)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      controller.reset()
    }
  }
}
