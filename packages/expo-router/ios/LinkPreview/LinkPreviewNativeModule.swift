import ExpoModulesCore

public class LinkPreviewNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterLinkPreviewNative")

    View(LinkPreviewNativeView.self) {
      Prop("nextScreenId") { (view: LinkPreviewNativeView, nextScreenId: String) in
        view.setNextScreenId(nextScreenId)
      }

      Events(
        "onPreviewTapped",
        "onWillPreviewOpen",
        "onDidPreviewOpen",
        "onPreviewWillClose",
        "onPreviewDidClose",
        "onActionSelected"
      )
    }

    View(LinkPreviewNativePreviewView.self) {
      Events("onSetSize")

      Prop("preferredContentSize") { (view: LinkPreviewNativePreviewView, size: [String: Int]) in
        let width = size["width", default: 0]
        let height = size["height", default: 0]

        guard width >= 0, height >= 0 else {
          print("Preferred content size cannot be negative (\(width), \(height))")
          return
        }

        view.preferredContentSize = CGSize(
          width: width,
          height: height
        )
      }
    }

    View(LinkPreviewNativeActionView.self) {
      Prop("id") { (view: LinkPreviewNativeActionView, id: String) in
        view.id = id
      }
      Prop("title") { (view: LinkPreviewNativeActionView, title: String) in
        view.title = title
      }
    }

    View(LinkPreviewNativeTriggerView.self) {}
  }
}
