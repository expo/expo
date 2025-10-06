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

      Prop("disableForceFlatten") { (_: NativeLinkPreviewView, _: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }

      Events(
        "onPreviewTapped",
        "onPreviewTappedAnimationCompleted",
        "onWillPreviewOpen",
        "onDidPreviewOpen",
        "onPreviewWillClose",
        "onPreviewDidClose"
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
      Prop("title") { (view: LinkPreviewNativeActionView, title: String) in
        view.title = title
      }
      Prop("icon") { (view: LinkPreviewNativeActionView, icon: String?) in
        view.icon = icon
      }
      Prop("disabled") { (view: LinkPreviewNativeActionView, disabled: Bool?) in
        view.disabled = disabled
      }
      Prop("destructive") { (view: LinkPreviewNativeActionView, destructive: Bool?) in
        view.destructive = destructive
      }
      Prop("singleSelection") { (view: LinkPreviewNativeActionView, singleSelection: Bool) in
        view.singleSelection = singleSelection
      }
      Prop("displayAsPalette") { (view: LinkPreviewNativeActionView, displayAsPalette: Bool) in
        view.displayAsPalette = displayAsPalette
      }
      Prop("isOn") { (view: LinkPreviewNativeActionView, isOn: Bool?) in
        view.isOn = isOn
      }
      Prop("keepPresented") { (view: LinkPreviewNativeActionView, keepPresented: Bool?) in
        view.keepPresented = keepPresented
      }
      Prop("displayInline") { (view: LinkPreviewNativeActionView, displayInline: Bool) in
        view.displayInline = displayInline
      }

      Events("onSelected")
    }
  }
}

struct TabPathPayload: Record {
  @Field var path: [TabStatePath]
}

struct TabStatePath: Record {
  @Field var oldTabKey: String
  @Field var newTabKey: String
}
