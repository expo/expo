import ExpoModulesCore

public final class SelectableTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSelectableText")

    View(SelectableTextView.self) {
      Events("onMenuAction")

      Prop("menu") { (view: SelectableTextView, items: [SelectionMenuItem]?) in
        view.controller.menuItems = (items ?? []).map { ["id": $0.id, "title": $0.title] }
      }
    }
  }
}

struct SelectionMenuItem: Record {
  @Field var id: String = ""
  @Field var title: String = ""
}
