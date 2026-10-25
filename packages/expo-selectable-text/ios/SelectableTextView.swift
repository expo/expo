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
    controller.prepareForTouch(at: point, with: event)
    return super.hitTest(point, with: event)
  }

  override func prepareForRecycle() {
    super.prepareForRecycle()
    controller.reset()
  }
}
