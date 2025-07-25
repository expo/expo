import ExpoModulesCore

public class LinkPreviewNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterNativeLinkPreview")

    View(NativeLinkPreviewView.self) {
      Prop("nextScreenId") { (view: NativeLinkPreviewView, nextScreenId: String) in
        view.nextScreenId = nextScreenId
      }

      Prop("tabPath") { (view: NativeLinkPreviewView, tabPath: TabPathPayload) in
        view.tabPath = tabPath
      }

      Events(
        "onPreviewTapped",
        "onPreviewTappedAnimationCompleted",
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

struct TabPathPayload: Record {
  @Field var path: [TabStatePath]
}

struct TabStatePath: Record {
  @Field var oldTabKey: String
  @Field var newTabKey: String
}
