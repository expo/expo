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
      OnViewDidUpdateProps { (view: SplitViewHeaderView) in
        view.apply()
      }
    }
  }
}
