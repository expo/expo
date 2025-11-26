import ExpoModulesCore

public class RouterToolbarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterToolbarModule")

    View(RouterToolbarHostView.self) {
      Prop("disableForceFlatten") { (v: RouterToolbarHostView, d: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }
    }
    View(RouterToolbarItemView.self) {
      Prop("identifier") { (view: RouterToolbarItemView, identifier: String) in
        view.identifier = identifier
      }
      Prop("type") { (view: RouterToolbarItemView, type: ItemType) in
        view.type = type
      }
      Prop("title") { (view: RouterToolbarItemView, title: String?) in
        view.title = title
      }
      Prop("systemImageName") { (view: RouterToolbarItemView, systemImageName: String?) in
        view.systemImageName = systemImageName
      }
      Prop("tintColor") { (view: RouterToolbarItemView, tintColor: UIColor?) in
        view.customTintColor = tintColor
      }
      Prop("hidesSharedBackground") { (view: RouterToolbarItemView, hidesSharedBackground: Bool) in
        view.hidesSharedBackground = hidesSharedBackground
      }
      Prop("sharesBackground") { (view: RouterToolbarItemView, sharesBackground: Bool) in
        view.sharesBackground = sharesBackground
      }
      Prop("disableForceFlatten") { (v: RouterToolbarItemView, d: Bool) in
        // This prop is used in ExpoShadowNode in order to disable force flattening, when display: contents is used
      }
      Prop("barButtonItemStyle") { (view: RouterToolbarItemView, style: BarItemStyle?) in
        view.barButtonItemStyle = style?.toUIBarButtonItemStyle()
      }
      Prop("width") { (view: RouterToolbarItemView, width: Double?) in
        view.width = width
      }
      Prop("hidden") { (view: RouterToolbarItemView, hidden: Bool) in
        view.routerHidden = hidden
      }
      Prop("selected") { (view: RouterToolbarItemView, selected: Bool) in
        view.selected = selected
      }
      Prop("possibleTitles") { (view: RouterToolbarItemView, possibleTitles: [String]?) in
        if let possibleTitles = possibleTitles {
          view.possibleTitles = Set(possibleTitles)
        } else {
          view.possibleTitles = nil
        }
      }
      Prop("badgeConfiguration") {
        (view: RouterToolbarItemView, config: BadgeConfigurationRecord?) in
        view.badgeConfiguration = config?.toBadgeConfiguration()
      }

      Events("onSelected")
    }
  }
}

enum BarItemStyle: String, Enumerable {
  case plain
  case prominent

  func toUIBarButtonItemStyle() -> UIBarButtonItem.Style {
    switch self {
    case .plain:
      return .plain
    case .prominent:
      if #available(iOS 26.0, *) {
        return .prominent
      } else {
        return .done
      }
    }
  }
}

struct BadgeConfigurationRecord: Record {
  @Field var value: String?
  @Field var backgroundColor: UIColor?
  @Field var color: UIColor?
  @Field var fontFamily: String?
  @Field var fontSize: Double?
  @Field var fontWeight: String?

  func toBadgeConfiguration() -> BadgeConfiguration {
    return BadgeConfiguration(
      value: value,
      backgroundColor: backgroundColor,
      color: color,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight
    )
  }
}
