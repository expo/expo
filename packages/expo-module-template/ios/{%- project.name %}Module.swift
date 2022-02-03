import ExpoModulesCore

public class <%- project.name %>Module: Module {
  public func definition() -> ModuleDefinition {
    name("<%- project.name %>")

    function("helloAsync") { (options: [String: String]) in
      print("Hello 👋")
    }

    viewManager {
      view {
        <%- project.name %>View()
      }

      prop("name") { (view: <%- project.name %>View, prop: String) in
        print(prop)
      }
    }
  }
}
