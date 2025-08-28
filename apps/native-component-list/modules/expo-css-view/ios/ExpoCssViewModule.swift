import ExpoModulesCore

public class ExpoCssViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCssView")

    View(ExpoCssView.self) {
      Prop("filter") { (view, filter: [[String: Any]]?) in
        view.setFilter(filter)
      }
      
      Prop("backdropFilter") { (view, backdropFilter: [[String: Any]]?) in
        view.setBackdropFilter(backdropFilter)
      }
    }
  }
}
