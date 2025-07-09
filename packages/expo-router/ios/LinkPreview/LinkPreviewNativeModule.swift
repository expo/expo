import ExpoModulesCore

public class LinkPreviewNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterNativeLinkPreview")

    View(NativeLinkPreviewView.self) {
      Prop("nextScreenId") { (view: NativeLinkPreviewView, nextScreenId: String) in
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

    View(NativeLinkPreviewContentView.self) {
      Prop("preferredContentSize") { (view: NativeLinkPreviewContentView, size: [String: Float]) in
        let width = size["width", default: 0]
        let height = size["height", default: 0]

        guard width >= 0, height >= 0 else {
          print("Preferred content size cannot be negative (\(width), \(height))")
          return
        }

        view.preferredContentSize = CGSize(
          width: CGFloat(width),
          height: CGFloat(height)
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
      Prop("icon") { (view: LinkPreviewNativeActionView, icon: String) in
        view.icon = icon
      }
    }

    View(NativeLinkPreviewTrigger.self) {}
  }
}
