package com.shopify.reactnative.flash_list

import android.content.Context
import android.graphics.Canvas
import android.util.DisplayMetrics
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.ScrollView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.views.view.ReactViewGroup


/** Container for all RecyclerListView children. This will automatically remove all gaps and overlaps for GridLayouts with flexible spans.
 * Note: This cannot work for masonry layouts i.e, pinterest like layout */
class AutoLayoutView(context: Context) : ReactViewGroup(context) {
    val alShadow = AutoLayoutShadow()
    var enableInstrumentation = false
    var disableAutoLayout = false

    var pixelDensity = 1.0;

    /** Overriding draw instead of onLayout. RecyclerListView uses absolute positions for each and every item which means that changes in child layouts may not trigger onLayout on this container. The same layout
     * can still cause views to overlap. Therefore, it makes sense to override draw to do correction. */
    override fun dispatchDraw(canvas: Canvas?) {
        fixLayout()
        fixFooter()
        super.dispatchDraw(canvas)

        val parentScrollView = getParentScrollView()
        if (enableInstrumentation && parentScrollView != null) {
            /** Since we need to call this method with scrollOffset on the UI thread and not with the one react has we're querying parent's parent
            directly which will be a ScrollView. If it isn't reported values will be incorrect but the component will not break.
            RecyclerListView is expected not to change the hierarchy of children. */

            val scrollContainerSize = if (alShadow.horizontal) parentScrollView.width else parentScrollView.height

            val scrollOffset = if (alShadow.horizontal) parentScrollView.scrollX else parentScrollView.scrollY

            val startOffset = if (alShadow.horizontal) left else top
            val endOffset = if (alShadow.horizontal) right else bottom

            val distanceFromWindowStart = kotlin.math.max(startOffset - scrollOffset, 0)
            val distanceFromWindowEnd = kotlin.math.max(scrollOffset + scrollContainerSize - endOffset, 0)

            alShadow.computeBlankFromGivenOffset(scrollOffset, distanceFromWindowStart, distanceFromWindowEnd)
            emitBlankAreaEvent()
        }
    }

    /** Sorts views by index and then invokes clearGaps which does the correction.
     * Performance: Sort is needed. Given relatively low number of views in RecyclerListView render tree this should be a non issue.*/
    private fun fixLayout() {
        if (childCount > 1 && !disableAutoLayout) {
            val positionSortedViews: Array<CellContainer> = Array(childCount) {
                val child = getChildAt(it)
                if (child is CellContainer) {
                    child
                } else {
                    throw IllegalStateException("CellRendererComponent outer view should always be CellContainer. Learn more here: https://shopify.github.io/flash-list/docs/usage#cellrenderercomponent.")
                }
            }
            positionSortedViews.sortBy { it.index }
            alShadow.offsetFromStart = if (alShadow.horizontal) left else top
            alShadow.clearGapsAndOverlaps(positionSortedViews)
        }
    }

    /** Fixes footer position along with rest of the items */
    private fun fixFooter() {
        val parentScrollView = getParentScrollView()
        if (disableAutoLayout || parentScrollView == null) {
            return
        }
        val isAutoLayoutEndVisible = if (alShadow.horizontal) right <= parentScrollView.width else bottom <= parentScrollView.height
        if (!isAutoLayoutEndVisible) {
            return
        }
        val autoLayoutParent = parent as? View
        val footer = getFooter();
        val diff = getFooterDiff()
        if (diff == 0 || footer == null || autoLayoutParent == null) {
            return
        }

        if (alShadow.horizontal) {
            footer.offsetLeftAndRight(diff)
            right += diff
            autoLayoutParent.right += diff
        } else {
            footer.offsetTopAndBottom(diff)
            bottom += diff
            autoLayoutParent.bottom += diff
        }
    }

    private fun getFooterDiff(): Int {
        if (childCount == 0) {
            alShadow.lastMaxBoundOverall = 0
        } else if (childCount == 1) {
            val firstChild = getChildAt(0)
            alShadow.lastMaxBoundOverall = if (alShadow.horizontal) {
                firstChild.right
            } else {
                firstChild.bottom
            }
        }
        val autoLayoutEnd = if (alShadow.horizontal) right - left else bottom - top
        return alShadow.lastMaxBoundOverall - autoLayoutEnd
    }

    private fun getFooter(): View? {
        return (parent as? ViewGroup)?.let {
            for (i in 0 until it.childCount) {
                val view = it.getChildAt(i)
                if (view is CellContainer && view.index == -1) {
                    return@let view
                }
            }
            return@let null
        }
    }

    private fun getParentScrollView(): View? {
        var autoLayoutParent = parent;
        while (autoLayoutParent != null) {
            if (autoLayoutParent is ScrollView || autoLayoutParent is HorizontalScrollView) {
                return autoLayoutParent as View
            }
            autoLayoutParent = autoLayoutParent.parent;
        }
        return null
    }


    /** TODO: Check migration to Fabric */
    private fun emitBlankAreaEvent() {
        val event: WritableMap = Arguments.createMap()
        event.putDouble("offsetStart", alShadow.blankOffsetAtStart / pixelDensity)
        event.putDouble("offsetEnd", alShadow.blankOffsetAtEnd / pixelDensity)
        val reactContext = context as ReactContext
        reactContext
                .getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "onBlankAreaEvent", event)
    }
}
