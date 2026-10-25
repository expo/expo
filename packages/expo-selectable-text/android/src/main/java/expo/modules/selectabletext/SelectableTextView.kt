package expo.modules.selectabletext

import android.annotation.SuppressLint
import android.content.Context
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import com.facebook.react.views.text.ReactTextView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * Adds custom selection menu items to the React Native `Text` views inside it. `ReactTextView` is
 * a `TextView`, so React Native's own `selectable` gives the range selection.
 */
@SuppressLint("ViewConstructor")
class SelectableTextView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onMenuAction by EventDispatcher()
  private val attachedTextViews = mutableMapOf<ReactTextView, AttachedTextView>()

  var menuItems: List<SelectionMenuItem> = emptyList()

  // React Native positions the children, including a `Text`'s inline views, which it mounts here.
  // `LinearLayout` would move them on the layout pass that a selectable `Text` requests.
  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  // A `TextView` that becomes selectable in the middle of a touch doesn't start a selection from
  // that touch, so the text views are configured when they are added to this view.
  override fun onViewAdded(child: View) {
    super.onViewAdded(child)
    if (isAttachedToWindow) {
      attachDescendants(child)
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    attachDescendants(this)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    attachedTextViews.keys.toList().forEach { detach(it) }
  }

  // A `Text` nested deeper can be added after this view, so a touch also looks for new ones.
  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      attachDescendants(this)
    }
    return super.dispatchTouchEvent(event)
  }

  private fun attachDescendants(view: View) {
    when (view) {
      is ReactTextView -> attach(view)
      is ViewGroup -> for (index in 0 until view.childCount) {
        attachDescendants(view.getChildAt(index))
      }
    }
  }

  private fun attach(textView: ReactTextView) {
    if (attachedTextViews.containsKey(textView)) {
      return
    }
    val listener = object : OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(view: View) = Unit

      override fun onViewDetachedFromWindow(view: View) {
        detach(textView)
      }
    }
    // A `Text` without `selectable` is made selectable while it is inside this view.
    attachedTextViews[textView] = AttachedTextView(!textView.isTextSelectable, listener)
    if (!textView.isTextSelectable) {
      textView.setTextIsSelectable(true)
    }
    textView.customSelectionActionModeCallback = SelectionMenuCallback(textView)
    textView.addOnAttachStateChangeListener(listener)
  }

  // React Native recycles text views, so they leave the way they came.
  private fun detach(textView: ReactTextView) {
    val attached = attachedTextViews.remove(textView) ?: return
    textView.removeOnAttachStateChangeListener(attached.listener)
    textView.customSelectionActionModeCallback = null
    if (attached.madeSelectable) {
      textView.setTextIsSelectable(false)
    }
  }

  private fun dispatchMenuAction(textView: ReactTextView, item: SelectionMenuItem) {
    val start = minOf(textView.selectionStart, textView.selectionEnd)
    val end = maxOf(textView.selectionStart, textView.selectionEnd)
    val text = textView.text ?: return
    if (start < 0 || end > text.length) {
      return
    }
    onMenuAction(
      mapOf(
        "id" to item.id,
        "selectedText" to text.subSequence(start, end).toString(),
        "start" to start,
        "end" to end
      )
    )
  }

  /**
   * `TextView` fills the menu with its system items, then calls [onCreateActionMode].
   */
  private inner class SelectionMenuCallback(private val textView: ReactTextView) : ActionMode.Callback {
    private val addedItems = mutableMapOf<MenuItem, SelectionMenuItem>()

    override fun onCreateActionMode(mode: ActionMode, menu: Menu): Boolean {
      addedItems.clear()
      menuItems.forEachIndexed { index, item ->
        addedItems[menu.add(Menu.NONE, Menu.NONE, index, item.title)] = item
      }
      return true
    }

    override fun onPrepareActionMode(mode: ActionMode, menu: Menu): Boolean = false

    override fun onActionItemClicked(mode: ActionMode, menuItem: MenuItem): Boolean {
      val item = addedItems[menuItem] ?: return false
      dispatchMenuAction(textView, item)
      // Finishing the action mode also collapses the selection.
      mode.finish()
      return true
    }

    override fun onDestroyActionMode(mode: ActionMode) {
      addedItems.clear()
    }
  }

  private class AttachedTextView(val madeSelectable: Boolean, val listener: OnAttachStateChangeListener)
}
