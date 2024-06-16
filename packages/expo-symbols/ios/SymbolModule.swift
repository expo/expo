import ExpoModulesCore

public class SymbolModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SymbolModule")

    View(SymbolView.self) {
      Prop("name") { (view, name: String) in
        view.name = name
      }

      Prop("type") { (view, type: SymbolType?) in
        view.symbolType = type ?? .monochrome
      }

      Prop("scale") { (view, scale: SymbolScale?) in
        view.scale = scale?.imageSymbolScale() ?? .unspecified
      }

      Prop("tintColor") { (view, color: UIColor?) in
        view.tint = color
      }

      Prop("animated") { (view, animated: Bool?) in
        view.animated = animated ?? false
      }

      Prop("weight") { (view, weight: SymbolWeight?) in
        view.weight = weight?.imageSymbolWeight() ?? .regular
      }

      Prop("colors") { (view, color: [UIColor]?) in
        view.palette = color ?? []
      }

      Prop("resizeMode") { (view, resizeMode: SymbolContentMode?) in
        view.imageContentMode = resizeMode?.toContentMode() ?? .scaleAspectFit
      }

      Prop("animationSpec") { (view, spec: AnimationSpec?) in
        view.animationSpec = spec
      }

      OnViewDidUpdateProps { view in
        view.reloadSymbol()
      }
    }
  }
}
