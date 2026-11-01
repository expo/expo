package expo.modules.selectabletext

import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.text.ReactTextViewManager

/**
 * React Native's `ReactTextViewManager` under its own name, the same pattern as React Native's
 * `SelectableTextViewManager`. `selectable` already gives `ReactTextView` range selection; this
 * class adds custom items to its selection menu.
 */
class ExpoSelectableTextViewManager : ReactTextViewManager() {
  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): ReactTextView {
    val view = super.createViewInstance(context)
    view.customSelectionActionModeCallback = SelectionMenuCallback(view)
    return view
  }

  override fun prepareToRecycleView(
    reactContext: ThemedReactContext,
    view: ReactTextView
  ): ReactTextView? {
    (view.customSelectionActionModeCallback as? SelectionMenuCallback)?.items = emptyList()
    return super.prepareToRecycleView(reactContext, view)
  }

  override fun receiveCommand(view: ReactTextView, commandId: String, args: ReadableArray?) {
    if (commandId != "setMenuItems") {
      super.receiveCommand(view, commandId, args)
      return
    }
    val items = args?.getArray(0) ?: return
    (view.customSelectionActionModeCallback as? SelectionMenuCallback)?.items =
      (0 until items.size()).mapNotNull { index ->
        val item = items.getMap(index) ?: return@mapNotNull null
        val id = item.getString("id") ?: return@mapNotNull null
        val title = item.getString("title") ?: return@mapNotNull null
        MenuItemConfig(id, title)
      }
  }

  companion object {
    const val NAME = "ExpoSelectableText"
  }
}

private data class MenuItemConfig(val id: String, val title: String)

/**
 * `TextView` fills the menu with its system items, then calls [onCreateActionMode].
 */
private class SelectionMenuCallback(private val view: ReactTextView) : ActionMode.Callback {
  var items: List<MenuItemConfig> = emptyList()
  private val addedItems = mutableMapOf<MenuItem, MenuItemConfig>()

  override fun onCreateActionMode(mode: ActionMode, menu: Menu): Boolean {
    addedItems.clear()
    items.forEachIndexed { index, item ->
      addedItems[menu.add(Menu.NONE, Menu.NONE, index, item.title)] = item
    }
    return true
  }

  override fun onPrepareActionMode(mode: ActionMode, menu: Menu): Boolean = false

  override fun onActionItemClicked(mode: ActionMode, menuItem: MenuItem): Boolean {
    val item = addedItems[menuItem] ?: return false
    val start = minOf(view.selectionStart, view.selectionEnd)
    val end = maxOf(view.selectionStart, view.selectionEnd)
    if (start >= 0 && end <= view.text.length) {
      val reactContext = view.context as ReactContext
      UIManagerHelper.getEventDispatcher(reactContext)
        ?.dispatchEvent(
          MenuActionEvent(
            UIManagerHelper.getSurfaceId(view),
            view.id,
            item.id,
            view.text.subSequence(start, end).toString(),
            start,
            end
          )
        )
    }
    // Finishing the action mode also collapses the selection.
    mode.finish()
    return true
  }

  override fun onDestroyActionMode(mode: ActionMode) {
    addedItems.clear()
  }
}

private class MenuActionEvent(
  surfaceId: Int,
  viewTag: Int,
  private val actionId: String,
  private val selectedText: String,
  private val start: Int,
  private val end: Int
) : Event<MenuActionEvent>(surfaceId, viewTag) {
  override fun getEventName(): String = "topMenuAction"

  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putString("id", actionId)
      putString("selectedText", selectedText)
      putInt("start", start)
      putInt("end", end)
    }
}
