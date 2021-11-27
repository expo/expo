import ExpoModulesCore

public class ExpoModuleTemplateModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoModuleTemplate")
    
    function("someGreatMethodAsync") { (options: [String: String]) in
      print("Hello 👋")
    }
    
    viewManager {
      view {
        ExpoModuleTemplateView()
      }

      prop("someGreatProp") { (view: ExpoModuleTemplateView, prop: Int) in
        print("prop")
      }
    }
  }
}
