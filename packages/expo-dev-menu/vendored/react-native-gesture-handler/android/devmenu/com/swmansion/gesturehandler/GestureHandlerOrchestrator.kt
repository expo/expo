package devmenu.com.swmansion.gesturehandler

import android.graphics.Matrix
import android.graphics.PointF
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import java.util.*

class GestureHandlerOrchestrator(
  private val wrapperView: ViewGroup,
  private val handlerRegistry: GestureHandlerRegistry,
  private val viewConfigHelper: ViewConfigurationHelper,
) {
  /**
   * Minimum alpha (value from 0 to 1) that should be set to a view so that it can be treated as a
   * gesture target. E.g. if set to 0.1 then views that less than 10% opaque will be ignored when
   * traversing view hierarchy and looking for gesture handlers.
   */
  var minimumAlphaForTraversal = DEFAULT_MIN_ALPHA_FOR_TRAVERSAL

  private val gestureHandlers = arrayOfNulls<GestureHandler<*>?>(SIMULTANEOUS_GESTURE_HANDLER_LIMIT)
  private val awaitingHandlers = arrayOfNulls<GestureHandler<*>?>(SIMULTANEOUS_GESTURE_HANDLER_LIMIT)
  private val preparedHandlers = arrayOfNulls<GestureHandler<*>?>(SIMULTANEOUS_GESTURE_HANDLER_LIMIT)
  private val handlersToCancel = arrayOfNulls<GestureHandler<*>?>(SIMULTANEOUS_GESTURE_HANDLER_LIMIT)
  private var gestureHandlersCount = 0
  private var awaitingHandlersCount = 0
  private var isHandlingTouch = false
  private var handlingChangeSemaphore = 0
  private var finishedHandlersCleanupScheduled = false
  private var activationIndex = 0

  /**
   * Should be called from the view wrapper
   */
  fun onTouchEvent(event: MotionEvent): Boolean {
    isHandlingTouch = true
    val action = event.actionMasked
    if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
      extractGestureHandlers(event)
    } else if (action == MotionEvent.ACTION_CANCEL) {
      cancelAll()
    }
    deliverEventToGestureHandlers(event)
    isHandlingTouch = false
    if (finishedHandlersCleanupScheduled && handlingChangeSemaphore == 0) {
      cleanupFinishedHandlers()
    }
    return true
  }

  private fun scheduleFinishedHandlersCleanup() {
    if (isHandlingTouch || handlingChangeSemaphore != 0) {
      finishedHandlersCleanupScheduled = true
    } else {
      cleanupFinishedHandlers()
    }
  }

  private inline fun compactHandlersIf(handlers: Array<GestureHandler<*>?>, count: Int, predicate: (handler: GestureHandler<*>?) -> Boolean): Int {
    var out = 0
    for (i in 0 until count) {
      if (predicate(handlers[i])) {
        handlers[out++] = handlers[i]
      }
    }
    return out
  }

  private fun cleanupFinishedHandlers() {
    var shouldCleanEmptyCells = false
    for (i in gestureHandlersCount - 1 downTo 0) {
      val handler = gestureHandlers[i]!!
      if (isFinished(handler.state) && !handler.isAwaiting) {
        gestureHandlers[i] = null
        shouldCleanEmptyCells = true
        handler.reset()
        handler.apply {
          isActive = false
          isAwaiting = false
          activationIndex = Int.MAX_VALUE
        }
      }
    }
    if (shouldCleanEmptyCells) {
      gestureHandlersCount = compactHandlersIf(gestureHandlers, gestureHandlersCount) { handler ->
        handler != null
      }
    }
    finishedHandlersCleanupScheduled = false
  }

  private fun hasOtherHandlerToWaitFor(handler: GestureHandler<*>): Boolean {
    for (i in 0 until gestureHandlersCount) {
      val otherHandler = gestureHandlers[i]!!
      if (!isFinished(otherHandler.state) && shouldHandlerWaitForOther(handler, otherHandler)) {
        return true
      }
    }
    return false
  }

  private fun tryActivate(handler: GestureHandler<*>) {
    // see if there is anyone else who we need to wait for
    if (hasOtherHandlerToWaitFor(handler)) {
      addAwaitingHandler(handler)
    } else {
      // we can activate handler right away
      makeActive(handler)
      handler.isAwaiting = false
    }
  }

  private fun cleanupAwaitingHandlers() {
    awaitingHandlersCount = compactHandlersIf(awaitingHandlers, awaitingHandlersCount) { handler ->
      handler!!.isAwaiting
    }
  }

  /*package*/
  fun onHandlerStateChange(handler: GestureHandler<*>, newState: Int, prevState: Int) {
    handlingChangeSemaphore += 1
    if (isFinished(newState)) {
      // if there were handlers awaiting completion of this handler, we can trigger active state
      for (i in 0 until awaitingHandlersCount) {
        val otherHandler = awaitingHandlers[i]
        if (shouldHandlerWaitForOther(otherHandler!!, handler)) {
          if (newState == GestureHandler.STATE_END) {
            // gesture has ended, we need to kill the awaiting handler
            otherHandler.cancel()
            otherHandler.isAwaiting = false
          } else {
            // gesture has failed recognition, we may try activating
            tryActivate(otherHandler)
          }
        }
      }
      cleanupAwaitingHandlers()
    }
    if (newState == GestureHandler.STATE_ACTIVE) {
      tryActivate(handler)
    } else if (prevState == GestureHandler.STATE_ACTIVE || prevState == GestureHandler.STATE_END) {
      if (handler.isActive) {
        handler.dispatchStateChange(newState, prevState)
      }
    } else {
      handler.dispatchStateChange(newState, prevState)
    }
    handlingChangeSemaphore -= 1
    scheduleFinishedHandlersCleanup()
  }

  private fun makeActive(handler: GestureHandler<*>) {
    val currentState = handler.state
    with(handler) {
      isAwaiting = false
      isActive = true
      activationIndex = this@GestureHandlerOrchestrator.activationIndex++
    }
    var toCancelCount = 0
    // Cancel all handlers that are required to be cancel upon current handler's activation
    for (i in 0 until gestureHandlersCount) {
      val otherHandler = gestureHandlers[i]!!
      if (shouldHandlerBeCancelledBy(otherHandler, handler)) {
        handlersToCancel[toCancelCount++] = otherHandler
      }
    }
    for (i in toCancelCount - 1 downTo 0) {
      handlersToCancel[i]!!.cancel()
    }

    // Clear all awaiting handlers waiting for the current handler to fail
    for (i in awaitingHandlersCount - 1 downTo 0) {
      val otherHandler = awaitingHandlers[i]!!
      if (shouldHandlerBeCancelledBy(otherHandler, handler)) {
        otherHandler.cancel()
        otherHandler.isAwaiting = false
      }
    }
    cleanupAwaitingHandlers()

    // Dispatch state change event if handler is no longer in the active state we should also
    // trigger END state change and UNDETERMINED state change if necessary
    handler.dispatchStateChange(GestureHandler.STATE_ACTIVE, GestureHandler.STATE_BEGAN)
    if (currentState != GestureHandler.STATE_ACTIVE) {
      handler.dispatchStateChange(GestureHandler.STATE_END, GestureHandler.STATE_ACTIVE)
      if (currentState != GestureHandler.STATE_END) {
        handler.dispatchStateChange(GestureHandler.STATE_UNDETERMINED, GestureHandler.STATE_END)
      }
    }
  }

  private fun deliverEventToGestureHandlers(event: MotionEvent) {
    // Copy handlers to "prepared handlers" array, because the list of active handlers can change
    // as a result of state updates
    val handlersCount = gestureHandlersCount

    gestureHandlers.copyInto(preparedHandlers, 0, 0, handlersCount)
    // We want to deliver events to active handlers first in order of their activation (handlers
    // that activated first will first get event delivered). Otherwise we deliver events in the
    // order in which handlers has been added ("most direct" children goes first). Therefore we rely
    // on Arrays.sort providing a stable sort (as children are registered in order in which they
    // should be tested)
    preparedHandlers.sortWith(handlersComparator, 0, handlersCount)
    for (i in 0 until handlersCount) {
      deliverEventToGestureHandler(preparedHandlers[i]!!, event)
    }
  }

  private fun cancelAll() {
    for (i in awaitingHandlersCount - 1 downTo 0) {
      awaitingHandlers[i]!!.cancel()
    }
    // Copy handlers to "prepared handlers" array, because the list of active handlers can change
    // as a result of state updates
    val handlersCount = gestureHandlersCount
    for (i in 0 until handlersCount) {
      preparedHandlers[i] = gestureHandlers[i]
    }
    for (i in handlersCount - 1 downTo 0) {
      preparedHandlers[i]!!.cancel()
    }
  }

  private fun deliverEventToGestureHandler(handler: GestureHandler<*>, event: MotionEvent) {
    if (!isViewAttachedUnderWrapper(handler.view)) {
      handler.cancel()
      return
    }
    if (!handler.wantEvents()) {
      return
    }
    val action = event.actionMasked
    val coords = tempCoords
    extractCoordsForView(handler.view, event, coords)
    val oldX = event.x
    val oldY = event.y
    // TODO: we may consider scaling events if necessary using MotionEvent.transform
    // for now the events are only offset to the top left corner of the view but if
    // view or any ot the parents is scaled the other pointers position will not reflect
    // their actual place in the view. On the other hand not scaling seems like a better
    // approach when we want to use pointer coordinates to calculate velocity or distance
    // for pinch so I don't know yet if we should transform or not...
    event.setLocation(coords[0], coords[1])
    if (handler.needsPointerData) {
      handler.updatePointerData(event)
    }

    if (!handler.isAwaiting || action != MotionEvent.ACTION_MOVE) {
      handler.handle(event)
      if (handler.isActive) {
        handler.dispatchHandlerUpdate(event)
      }

      // if event was of type UP or POINTER_UP we request handler to stop tracking now that
      // the event has been dispatched
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP) {
        val pointerId = event.getPointerId(event.actionIndex)
        handler.stopTrackingPointer(pointerId)
      }
    }

    event.setLocation(oldX, oldY)
  }

  /**
   * isViewAttachedUnderWrapper checks whether all of parents for view related to handler
   * view are attached. Since there might be an issue rarely observed when view
   * has been detached and handler's state hasn't been change to canceled, failed or
   * ended yet. Probably it's a result of some race condition and stopping delivering
   * for this handler and changing its state to failed of end appear to be good enough solution.
   */
  private fun isViewAttachedUnderWrapper(view: View?): Boolean {
    if (view == null) {
      return false
    }
    if (view === wrapperView) {
      return true
    }
    var parent = view.parent
    while (parent != null && parent !== wrapperView) {
      parent = parent.parent
    }
    return parent === wrapperView
  }

  private fun extractCoordsForView(view: View?, event: MotionEvent, outputCoords: FloatArray) {
    if (view === wrapperView) {
      outputCoords[0] = event.x
      outputCoords[1] = event.y
      return
    }
    require(!(view == null || view.parent !is ViewGroup)) { "Parent is null? View is no longer in the tree" }
    val parent = view.parent as ViewGroup
    extractCoordsForView(parent, event, outputCoords)
    val childPoint = tempPoint
    transformTouchPointToViewCoords(outputCoords[0], outputCoords[1], parent, view, childPoint)
    outputCoords[0] = childPoint.x
    outputCoords[1] = childPoint.y
  }

  private fun addAwaitingHandler(handler: GestureHandler<*>) {
    for (i in 0 until awaitingHandlersCount) {
      if (awaitingHandlers[i] === handler) {
        return
      }
    }
    check(awaitingHandlersCount < awaitingHandlers.size) { "Too many recognizers" }
    awaitingHandlers[awaitingHandlersCount++] = handler
    with(handler) {
      isAwaiting = true
      activationIndex = this@GestureHandlerOrchestrator.activationIndex++
    }
  }

  private fun recordHandlerIfNotPresent(handler: GestureHandler<*>, view: View) {
    for (i in 0 until gestureHandlersCount) {
      if (gestureHandlers[i] === handler) {
        return
      }
    }
    check(gestureHandlersCount < gestureHandlers.size) { "Too many recognizers" }
    gestureHandlers[gestureHandlersCount++] = handler
    handler.isActive = false
    handler.isAwaiting = false
    handler.activationIndex = Int.MAX_VALUE
    handler.prepare(view, this)
  }

  private fun isViewOverflowingParent(view: View): Boolean {
    val parent = view.parent as? ViewGroup ?: return false
    val matrix = view.matrix
    val localXY = matrixTransformCoords
    localXY[0] = 0f
    localXY[1] = 0f
    matrix.mapPoints(localXY)
    val left = localXY[0] + view.left
    val top = localXY[1] + view.top

    return left < 0f || left + view.width > parent.width || top < 0f || top + view.height > parent.height
  }

  private fun extractAncestorHandlers(view: View, coords: FloatArray, pointerId: Int): Boolean {
    var found = false
    var parent = view.parent

    while (parent != null) {
      if (parent is ViewGroup) {
        val parentViewGroup: ViewGroup = parent

        handlerRegistry.getHandlersForView(parent)?.let {
          for (handler in it) {
            if (handler.isEnabled && handler.isWithinBounds(view, coords[0], coords[1])) {
              found = true
              recordHandlerIfNotPresent(handler, parentViewGroup)
              handler.startTrackingPointer(pointerId)
            }
          }
        }
      }

      parent = parent.parent
    }

    return found
  }

  private fun recordViewHandlersForPointer(view: View, coords: FloatArray, pointerId: Int): Boolean {
    var found = false
    handlerRegistry.getHandlersForView(view)?.let {
      val size = it.size
      for (i in 0 until size) {
        val handler = it[i]
        if (handler.isEnabled && handler.isWithinBounds(view, coords[0], coords[1])) {
          recordHandlerIfNotPresent(handler, view)
          handler.startTrackingPointer(pointerId)
          found = true
        }
      }
    }

    // if the pointer is inside the view but it overflows its parent, handlers attached to the parent
    // might not have been extracted (pointer might be in a child, but may be outside parent)
    if (coords[0] in 0f..view.width.toFloat() && coords[1] in 0f..view.height.toFloat()
      && isViewOverflowingParent(view) && extractAncestorHandlers(view, coords, pointerId)) {
        found = true
    }

    return found
  }

  private fun extractGestureHandlers(event: MotionEvent) {
    val actionIndex = event.actionIndex
    val pointerId = event.getPointerId(actionIndex)
    tempCoords[0] = event.getX(actionIndex)
    tempCoords[1] = event.getY(actionIndex)
    traverseWithPointerEvents(wrapperView, tempCoords, pointerId)
    extractGestureHandlers(wrapperView, tempCoords, pointerId)
  }

  private fun extractGestureHandlers(viewGroup: ViewGroup, coords: FloatArray, pointerId: Int): Boolean {
    val childrenCount = viewGroup.childCount
    for (i in childrenCount - 1 downTo 0) {
      val child = viewConfigHelper.getChildInDrawingOrderAtIndex(viewGroup, i)
      if (canReceiveEvents(child)) {
        val childPoint = tempPoint
        transformTouchPointToViewCoords(coords[0], coords[1], viewGroup, child, childPoint)
        val restoreX = coords[0]
        val restoreY = coords[1]
        coords[0] = childPoint.x
        coords[1] = childPoint.y
        var found = false
        if (!isClipping(child) || isTransformedTouchPointInView(coords[0], coords[1], child)) {
          // we only consider the view if touch is inside the view bounds or if the view's children
          // can render outside of the view bounds (overflow visible)
          found = traverseWithPointerEvents(child, coords, pointerId)
        }
        coords[0] = restoreX
        coords[1] = restoreY
        if (found) {
          return true
        }
      }
    }
    return false
  }

  private fun traverseWithPointerEvents(view: View, coords: FloatArray, pointerId: Int): Boolean =
    when (viewConfigHelper.getPointerEventsConfigForView(view)) {
      PointerEventsConfig.NONE -> {
        // This view and its children can't be the target
        false
      }
      PointerEventsConfig.BOX_ONLY -> {
        // This view is the target, its children don't matter
        (recordViewHandlersForPointer(view, coords, pointerId)
          || shouldHandlerlessViewBecomeTouchTarget(view, coords))
      }
      PointerEventsConfig.BOX_NONE -> {
        // This view can't be the target, but its children might
        if (view is ViewGroup) {
          extractGestureHandlers(view, coords, pointerId)
        } else false
      }
      PointerEventsConfig.AUTO -> {
        // Either this view or one of its children is the target
        val found = if (view is ViewGroup) {
          extractGestureHandlers(view, coords, pointerId)
        } else false

        (recordViewHandlersForPointer(view, coords, pointerId)
          || found || shouldHandlerlessViewBecomeTouchTarget(view, coords))
      }
    }

  private fun canReceiveEvents(view: View) =
    view.visibility == View.VISIBLE && view.alpha >= minimumAlphaForTraversal

  // if view is not a view group it is clipping, otherwise we check for `getClipChildren` flag to
  // be turned on and also confirm with the ViewConfigHelper implementation
  private fun isClipping(view: View) =
    view !is ViewGroup || viewConfigHelper.isViewClippingChildren(view)


  companion object {
    // The limit doesn't necessarily need to exists, it was just simpler to implement it that way
    // it is also more allocation-wise efficient to have a fixed limit
    private const val SIMULTANEOUS_GESTURE_HANDLER_LIMIT = 20

    // Be default fully transparent views can receive touch
    private const val DEFAULT_MIN_ALPHA_FOR_TRAVERSAL = 0f
    private val tempPoint = PointF()
    private val matrixTransformCoords = FloatArray(2)
    private val inverseMatrix = Matrix()
    private val tempCoords = FloatArray(2)
    private val handlersComparator = Comparator<GestureHandler<*>?> { a, b ->
      return@Comparator if (a.isActive && b.isActive || a.isAwaiting && b.isAwaiting) {
        // both A and B are either active or awaiting activation, in which case we prefer one that
        // has activated (or turned into "awaiting" state) earlier
        Integer.signum(b.activationIndex - a.activationIndex)
      } else if (a.isActive) {
        -1 // only A is active
      } else if (b.isActive) {
        1 // only B is active
      } else if (a.isAwaiting) {
        -1 // only A is awaiting, B is inactive
      } else if (b.isAwaiting) {
        1 // only B is awaiting, A is inactive
      } else {
        0 // both A and B are inactive, stable order matters
      }
    }

    private fun shouldHandlerlessViewBecomeTouchTarget(view: View, coords: FloatArray): Boolean {
      // The following code is to match the iOS behavior where transparent parts of the views can
      // pass touch events through them allowing sibling nodes to handle them.

      // TODO: this is not an ideal solution as we only consider ViewGroups that has no background set
      // TODO: ideally we should determine the pixel color under the given coordinates and return
      // false if the color is transparent
      val isLeafOrTransparent = view !is ViewGroup || view.getBackground() != null
      return isLeafOrTransparent && isTransformedTouchPointInView(coords[0], coords[1], view)
    }

    private fun transformTouchPointToViewCoords(
      x: Float,
      y: Float,
      parent: ViewGroup,
      child: View,
      outLocalPoint: PointF,
    ) {
      var localX = x + parent.scrollX - child.left
      var localY = y + parent.scrollY - child.top
      val matrix = child.matrix
      if (!matrix.isIdentity) {
        val localXY = matrixTransformCoords
        localXY[0] = localX
        localXY[1] = localY
        matrix.invert(inverseMatrix)
        inverseMatrix.mapPoints(localXY)
        localX = localXY[0]
        localY = localXY[1]
      }
      outLocalPoint[localX] = localY
    }

    private fun isTransformedTouchPointInView(x: Float, y: Float, child: View) =
      x in 0f..child.width.toFloat() && y in 0f..child.height.toFloat()

    private fun shouldHandlerWaitForOther(handler: GestureHandler<*>, other: GestureHandler<*>): Boolean {
      return handler !== other && (handler.shouldWaitForHandlerFailure(other)
        || other.shouldRequireToWaitForFailure(handler))
    }

    private fun canRunSimultaneously(a: GestureHandler<*>, b: GestureHandler<*>) =
      a === b || a.shouldRecognizeSimultaneously(b) || b.shouldRecognizeSimultaneously(a)


    private fun shouldHandlerBeCancelledBy(handler: GestureHandler<*>, other: GestureHandler<*>): Boolean {
      if (!handler.hasCommonPointers(other)) {
        // if two handlers share no common pointer one can never trigger cancel for the other
        return false
      }
      if (canRunSimultaneously(handler, other)) {
        // if handlers are allowed to run simultaneously, when first activates second can still remain
        // in began state
        return false
      }
      return if (handler !== other &&
        (handler.isAwaiting || handler.state == GestureHandler.STATE_ACTIVE)) {
        // in every other case as long as the handler is about to be activated or already in active
        // state, we delegate the decision to the implementation of GestureHandler#shouldBeCancelledBy
        handler.shouldBeCancelledBy(other)
      } else true
    }

    private fun isFinished(state: Int) =
      state == GestureHandler.STATE_CANCELLED
        || state == GestureHandler.STATE_FAILED
        || state == GestureHandler.STATE_END
  }
}
