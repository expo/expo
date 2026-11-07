import ExpoModulesCore

public class SplitViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterSplitViewModule")

    View(SplitViewHeaderView.self) {
      Prop("title") { (view: SplitViewHeaderView, title: String?) in
        view.headerTitle = title
      }
      Prop("subtitle") { (view: SplitViewHeaderView, subtitle: String?) in
        view.headerSubtitle = subtitle
      }
      Prop("largeTitle") { (view: SplitViewHeaderView, largeTitle: Bool?) in
        view.largeTitle = largeTitle ?? false
      }
      Prop("titleColor") { (view: SplitViewHeaderView, color: UIColor?) in
        view.titleColor = color
      }
      Prop("largeTitleColor") { (view: SplitViewHeaderView, color: UIColor?) in
        view.largeTitleColor = color
      }
      Prop("leftToolbarItems") { (view: SplitViewHeaderView, items: [SplitViewToolbarItemRecord]?) in
        view.leftToolbarItems = items ?? []
      }
      Prop("rightToolbarItems") { (view: SplitViewHeaderView, items: [SplitViewToolbarItemRecord]?) in
        view.rightToolbarItems = items ?? []
      }
      Prop("searchBar") { (view: SplitViewHeaderView, searchBar: SplitViewSearchBarRecord?) in
        view.searchBar = searchBar
      }
      Prop("backButtonDisplayMode") { (view: SplitViewHeaderView, mode: SplitViewBackButtonDisplayMode?) in
        view.backButtonDisplayMode = mode?.backButtonDisplayMode ?? .default
      }
      Prop("backTitle") { (view: SplitViewHeaderView, backTitle: String?) in
        view.backTitle = backTitle
      }
      Prop("backVisible") { (view: SplitViewHeaderView, backVisible: Bool?) in
        view.backVisible = backVisible ?? true
      }
      Prop("hidden") { (view: SplitViewHeaderView, hidden: Bool?) in
        view.navigationBarHidden = hidden ?? false
      }
      Events("onToolbarItemPress", "onSearchBarChangeText", "onSearchBarSearchButtonPress")
      OnViewDidUpdateProps { (view: SplitViewHeaderView) in view.apply() }
    }
  }
}

struct SplitViewToolbarItemRecord: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var icon: String?
  @Field var xcassetName: String?
  @Field var imageRenderingMode: ImageRenderingMode?
  @Field var tintColor: UIColor?
  @Field var badgeConfiguration: BadgeConfigurationRecord?
  @Field var barButtonItemStyle: BarItemStyle?
  @Field var sharesBackground: Bool = true
  @Field var hidesSharedBackground: Bool = false
  @Field var accessibilityLabel: String?
  @Field var accessibilityHint: String?
  @Field var menu: SplitViewMenuRecord?
  @Field var disabled: Bool = false
  @Field var selected: Bool = false
}

struct SplitViewMenuRecord: Record {
  @Field var title: String?
  @Field var items: [SplitViewMenuActionRecord] = []
}

struct SplitViewMenuActionRecord: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var icon: String?
  @Field var destructive: Bool = false
  @Field var disabled: Bool = false
  @Field var isOn: Bool = false
}

struct SplitViewSearchBarRecord: Record {
  @Field var placeholder: String?
}

enum SplitViewBackButtonDisplayMode: String, Enumerable {
  case `default`
  case generic
  case minimal

  var backButtonDisplayMode: UINavigationItem.BackButtonDisplayMode {
    switch self {
    case .default:
      return .default
    case .generic:
      return .generic
    case .minimal:
      return .minimal
    }
  }
}
