import ExpoModulesCore

public class LinkPreviewNativeModule: Module {
  static let moduleName: String = "ExpoRouterNativeLinkPreview"
  lazy var zoomSourceRepository = LinkZoomTransitionsSourceRepository(logger: appContext?.jsLogger)
  lazy var zoomAlignmentViewRepository = LinkZoomTransitionsAlignmentViewRepository()

  public func definition() -> ModuleDefinition {
    Name(LinkPreviewNativeModule.moduleName)

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
          view.logger?.warn("[expo-router] Preferred content size cannot be negative (\(width), \(height))")
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
      Prop("label") { (view: LinkPreviewNativeActionView, label: String?) in
        view.label = label
      }
      Prop("identifier") { (view: LinkPreviewNativeActionView, identifier: String) in
        view.identifier = identifier
      }
      Prop("icon") { (view: LinkPreviewNativeActionView, icon: String?) in
        view.icon = icon
      }
      Prop("xcassetName") { (view: LinkPreviewNativeActionView, xcassetName: String?) in
        view.xcassetName = xcassetName
      }
      Prop("image") { (view: LinkPreviewNativeActionView, image: SharedRef<UIImage>?) in
        view.customImage = image
      }
      Prop("imageRenderingMode") { (view: LinkPreviewNativeActionView, mode: ImageRenderingMode?) in
        view.imageRenderingMode = mode
      }
      Prop("disabled") { (view: LinkPreviewNativeActionView, disabled: Bool?) in
        view.disabled = disabled ?? false
      }
      Prop("destructive") { (view: LinkPreviewNativeActionView, destructive: Bool?) in
        view.destructive = destructive
      }
      Prop("discoverabilityLabel") { (view: LinkPreviewNativeActionView, label: String?) in
        view.discoverabilityLabel = label
      }
      Prop("subtitle") { (view: LinkPreviewNativeActionView, subtitle: String?) in
        view.subtitle = subtitle
      }
      Prop("accessibilityLabel") { (view: LinkPreviewNativeActionView, label: String?) in
        view.accessibilityLabelForMenu = label
      }
      Prop("accessibilityHint") { (view: LinkPreviewNativeActionView, hint: String?) in
        view.accessibilityHintForMenu = hint
      }
      Prop("singleSelection") { (view: LinkPreviewNativeActionView, singleSelection: Bool?) in
        view.singleSelection = singleSelection ?? false
      }
      Prop("displayAsPalette") { (view: LinkPreviewNativeActionView, displayAsPalette: Bool?) in
        view.displayAsPalette = displayAsPalette ?? false
      }
      Prop("isOn") { (view: LinkPreviewNativeActionView, isOn: Bool?) in
        view.isOn = isOn
      }
      Prop("keepPresented") { (view: LinkPreviewNativeActionView, keepPresented: Bool?) in
        view.keepPresented = keepPresented
      }
      Prop("displayInline") { (view: LinkPreviewNativeActionView, displayInline: Bool?) in
        view.displayInline = displayInline ?? false
      }
      Prop("hidden") { (view: LinkPreviewNativeActionView, hidden: Bool?) in
        view.routerHidden = hidden ?? false
      }
      Prop("sharesBackground") { (view: LinkPreviewNativeActionView, sharesBackground: Bool?) in
        view.sharesBackground = sharesBackground
      }
      Prop("hidesSharedBackground") { (view: LinkPreviewNativeActionView, hidesSharedBackground: Bool?) in
        view.hidesSharedBackground = hidesSharedBackground
      }
      Prop("tintColor") { (view: LinkPreviewNativeActionView, tintColor: UIColor?) in
        view.customTintColor = tintColor
      }
      Prop("barButtonItemStyle") { (view: LinkPreviewNativeActionView, style: BarItemStyle?) in
        view.barButtonItemStyle = style?.toUIBarButtonItemStyle()
      }
      Prop("preferredElementSize") { (view: LinkPreviewNativeActionView, preferredElementSize: MenuElementSize?) in
        view.preferredElementSize = preferredElementSize
      }
      Events("onSelected")
    }

    View(LinkZoomTransitionSource.self) {
      Prop("disableForceFlatten") { (_: LinkZoomTransitionSource, _: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }
      Prop("identifier") { (view: LinkZoomTransitionSource, identifier: String) in
        view.identifier = identifier
      }
      Prop("alignment") { (view: LinkZoomTransitionSource, alignment: LinkSourceAlignmentRect?) in
        if let alignment = alignment {
          view.alignment = CGRect(
            x: alignment.x,
            y: alignment.y,
            width: alignment.width,
            height: alignment.height
          )
        } else {
          view.alignment = nil
        }
      }
      Prop("animateAspectRatioChange") { (view: LinkZoomTransitionSource, value: Bool?) in
        view.animateAspectRatioChange = value ?? false
      }
    }

    View(LinkZoomTransitionEnabler.self) {
      Prop("zoomTransitionSourceIdentifier") {
        (view: LinkZoomTransitionEnabler, identifier: String) in
        view.zoomTransitionSourceIdentifier = identifier
      }
      Prop("disableForceFlatten") { (_: LinkZoomTransitionEnabler, _: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }

      Prop("dismissalBoundsRect") { (view: LinkZoomTransitionEnabler, rect: DismissalBoundsRect?) in
        view.dismissalBoundsRect = rect
      }
    }

    View(LinkZoomTransitionAlignmentRectDetector.self) {
      Prop("identifier") {
        (view: LinkZoomTransitionAlignmentRectDetector, identifier: String) in
        view.identifier = identifier
      }
      Prop("disableForceFlatten") { (_: LinkZoomTransitionAlignmentRectDetector, _: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }
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

struct LinkSourceAlignmentRect: Record {
  @Field var x: Double
  @Field var y: Double
  @Field var width: Double
  @Field var height: Double
}

enum MenuElementSize: String, Enumerable {
  case small
  case medium
  case large
  case auto

  @available(iOS 16.0, *)
  func toUIMenuElementSize() -> UIMenu.ElementSize {
    switch self {
    case .small:
      return .small
    case .medium:
      return .medium
    case .large:
      return .large
    case .auto:
      if #available(iOS 17.0, *) {
        return .automatic
      } else {
        return .medium
      }
    }
  }
}

struct DismissalBoundsRect: Record {
  @Field var minX: Double?
  @Field var maxX: Double?
  @Field var minY: Double?
  @Field var maxY: Double?
}
