import ExpoModulesCore

public class SplitViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterSplitViewModule")

    View(SplitViewHeaderView.self) {
      Prop("title") { (view: SplitViewHeaderView, title: String?) in
        view.headerTitle = title
      }
      Prop("largeTitle") { (view: SplitViewHeaderView, largeTitle: Bool?) in
        view.largeTitle = largeTitle ?? false
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
      Events("onToolbarItemPress", "onSearchBarChangeText", "onSearchBarSearchButtonPress")
      OnViewDidUpdateProps { (view: SplitViewHeaderView) in
        view.apply()
      }
    }
  }
}

struct SplitViewToolbarItemRecord: Record {
  @Field var title: String = ""
  @Field var icon: String?
}

struct SplitViewSearchBarRecord: Record {
  @Field var placeholder: String?
}
