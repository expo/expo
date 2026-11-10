package expo.modules.selectabletext

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class SelectableTextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSelectableText")

    View(SelectableTextView::class) {
      Events("onMenuAction")

      Prop("menu") { view: SelectableTextView, items: List<SelectionMenuItem>? ->
        view.menuItems = items ?: emptyList()
      }
    }
  }
}

class SelectionMenuItem : Record {
  @Field
  val id: String = ""

  @Field
  val title: String = ""
}
