import ExpoModulesCore

public class SplitViewColumnOptionsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterSplitViewModule")

    View(SplitViewColumnOptionsView.self) {
      Prop("title") { (view: SplitViewColumnOptionsView, title: String?) in
        view.title = title
      }
      Prop("headerLargeTitle") { (view: SplitViewColumnOptionsView, value: Bool?) in
        view.headerLargeTitle = value
      }
      Prop("headerShown") { (view: SplitViewColumnOptionsView, value: Bool?) in
        view.headerShown = value
      }
      Prop("showSecondaryToggleButton") { (view: SplitViewColumnOptionsView, value: Bool?) in
        view.showSecondaryToggleButton = value ?? false
      }
      OnViewDidUpdateProps { (view: SplitViewColumnOptionsView) in
        view.applyOptions()
      }
    }
  }
}
