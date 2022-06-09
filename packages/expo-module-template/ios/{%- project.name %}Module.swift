import ExpoModulesCore

public class <%- project.name %>Module: Module {
  public func definition() -> ModuleDefinition {
    Name("<%- project.name %>")

    AsyncFunction("helloAsync") { (options: [String: String]) in
      print("Hello 👋")
    }

    ViewManager {
      View {
        <%- project.name %>View()
      }

      Prop("name") { (view: <%- project.name %>View, prop: String) in
        print(prop)
      }
    }
  }
}
