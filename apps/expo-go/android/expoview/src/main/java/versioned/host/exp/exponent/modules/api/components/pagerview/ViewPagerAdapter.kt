package versioned.host.exp.exponent.modules.api.components.pagerview

import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.recyclerview.widget.RecyclerView.Adapter
import java.util.*

class ViewPagerAdapter() : Adapter<ViewPagerViewHolder>() {
  private val childrenViews: ArrayList<View> = ArrayList()

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewPagerViewHolder {
    return ViewPagerViewHolder.create(parent)
  }

  override fun onBindViewHolder(holder: ViewPagerViewHolder, index: Int) {
    val container: FrameLayout = holder.container
    val child = getChildAt(index)

    if (container.childCount > 0) {
      container.removeAllViews()
    }

    if (child.parent != null) {
      (child.parent as FrameLayout).removeView(child)
    }

    container.addView(child)
  }

  override fun getItemCount(): Int {
    return childrenViews.size
  }

  fun addChild(child: View, index: Int) {
    childrenViews.add(index, child)
    notifyItemInserted(index)
  }

  fun getChildAt(index: Int): View {
    return childrenViews[index]
  }

  fun removeChild(child: View) {
    val index = childrenViews.indexOf(child)
    removeChildAt(index)
  }

  fun removeAll() {
    val removedChildrenCount = childrenViews.size
    childrenViews.clear()
    notifyItemRangeRemoved(0, removedChildrenCount)
  }

  fun removeChildAt(index: Int) {
    childrenViews.removeAt(index)
    notifyItemRemoved(index)
  }
}
