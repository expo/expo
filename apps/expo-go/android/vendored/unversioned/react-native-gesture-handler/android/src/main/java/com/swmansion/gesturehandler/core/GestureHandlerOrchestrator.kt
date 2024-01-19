package com.swmansion.gesturehandler.core

import android.graphics.Matrix
import android.graphics.PointF
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
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
  private val gestureHandlers = arrayListOf<GestureHandler<*>>()
  private val awaitingHandlers = arrayListOf<GestureHandler<*>>()
  private val preparedHandlers = arrayListOf<GestureHandler<*>>()
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
    if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN || action == MotionEvent.ACTION_HOVER_MOVE) {
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

  fun getHandlersForView(view: View) = handlerRegistry.getHandlersForView(view)

  private fun scheduleFinishedHandlersCleanup() {
    if (isHandlingTouch || handlingChangeSemaphore != 0) {
      finishedHandlersCleanupScheduled = true
    } else {
      cleanupFinishedHandlers()
    }
  }

  private fun cleanupFinishedHandlers() {
    for (handler in gestureHandlers.asReversed()) {
      if (isFinished(handler.state) && !handler.isAwaiting) {
        handler.reset()
        handler.apply {
          isActive = false
          isAwaiting = false
          activationIndex = Int.MAX_VALUE
        }
      }
    }

    gestureHandlers.removeAll { isFinished(it.state) && !it.isAwaiting }

    finishedHandlersCleanupScheduled = false
  }

  private fun hasOtherHandlerToWaitFor(handler: GestureHandler<*>): Boolean {
    for (otherHandler in gestureHandlers) {
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
    awaitingHandlers.removeAll { !it.isAwaiting }
  }

  /*package*/
  fun onHandlerStateChange(handler: GestureHandler<*>, newState: Int, prevState: Int) {
    handlingChangeSemaphore += 1
    if (isFinished(newState)) {
      // if there were handlers awaiting completion of this handler, we can trigger active state
      for (otherHandler in awaitingHandlers) {
        if (shouldHandlerWaitForOther(otherHandler, handler)) {
          if (newState == GestureHandler.STATE_END) {
            // gesture has ended, we need to kill the awaiting handler
            otherHandler.cancel()
            if (otherHandler.state == GestureHandler.STATE_END) {
              // Handle edge case, where discrete gestures end immediately after activation thus
              // their state is set to END and when the gesture they are waiting for activates they
              // should be cancelled, however `cancel` was never sent as gestures were already in the END state.
              // Send synthetic BEGAN -> CANCELLED to properly handle JS logic
              otherHandler.dispatchStateChange(
                GestureHandler.STATE_CANCELLED,
                GestureHandler.STATE_BEGAN
              )
            }
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
      } else if (prevState == GestureHandler.STATE_ACTIVE && (newState == GestureHandler.STATE_CANCELLED || newState == GestureHandler.STATE_FAILED)) {
        // Handle edge case where handler awaiting for another one tries to activate but finishes
        // before the other would not send state change event upon ending. Note that we only want
        // to do this if the newState is either CANCELLED or FAILED, if it is END we still want to
        // wait for the other handler to finish as in that case synthetic events will be sent by the
        // makeActive method.
        handler.dispatchStateChange(newState, GestureHandler.STATE_BEGAN)
      }
    } else if (prevState != GestureHandler.STATE_UNDETERMINED || newState != GestureHandler.STATE_CANCELLED) {
      // If handler is changing state from UNDETERMINED to CANCELLED, the state change event shouldn't
      // be sent. Handler hasn't yet began so it may not be initialized which results in crashes.
      // If it doesn't crash, there may be some weird behavior on JS side, as `onFinalize` will be
      // called without calling `onBegin` first.
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
      shouldResetProgress = true
      activationIndex = this@GestureHandlerOrchestrator.activationIndex++
    }

    for (otherHandler in gestureHandlers.asReversed()) {
      if (shouldHandlerBeCancelledBy(otherHandler, handler)) {
        otherHandler.cancel()
      }
    }

    // Clear all awaiting handlers waiting for the current handler to fail
    for (otherHandler in awaitingHandlers.reversed()) {
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
    preparedHandlers.clear()
    preparedHandlers.addAll(gestureHandlers)

    // We want to deliver events to active handlers first in order of their activation (handlers
    // that activated first will first get event delivered). Otherwise we deliver events in the
    // order in which handlers has been added ("most direct" children goes first). Therefore we rely
    // on Arrays.sort providing a stable sort (as children are registered in order in which they
    // should be tested)
    preparedHandlers.sortWith(handlersComparator)
    for (handler in preparedHandlers) {
      deliverEventToGestureHandler(handler, event)
    }
  }

  private fun cancelAll() {
    for (handler in awaitingHandlers.reversed()) {
      handler.cancel()
    }
    // Copy handlers to "prepared handlers" array, because the list of active handlers can change
    // as a result of state updates
    preparedHandlers.clear()
    preparedHandlers.addAll(gestureHandlers)

    for (handler in gestureHandlers.reversed()) {
      handler.cancel()
    }
  }

  private fun deliverEventToGestureHandler(handler: GestureHandler<*>, sourceEvent: MotionEvent) {
    if (!isViewAttachedUnderWrapper(handler.view)) {
      handler.cancel()
      return
    }
    if (!handler.wantEvents()) {
      return
    }

    val action = sourceEvent.actionMasked
    val event = transformEventToViewCoords(handler.view, MotionEvent.obtain(sourceEvent))

    // Touch events are sent before the handler itself has a chance to process them,
    // mainly because `onTouchesUp` shoul be send befor gesture finishes. This means that
    // the first `onTouchesDown` event is sent before a gesture begins, activation in
    // callback for this event causes problems because the handler doesn't have a chance
    // to initialize itself with starting values of pointer (in pan this causes translation
    // to be equal to the coordinates of the pointer). The simplest solution is to send
    // the first `onTouchesDown` event after the handler processes it and changes state
    // to `BEGAN`.
    if (handler.needsPointerData && handler.state != 0) {
      handler.updatePointerData(event)
    }

    if (!handler.isAwaiting || action != MotionEvent.ACTION_MOVE) {
      val isFirstEvent = handler.state == 0
      handler.handle(event, sourceEvent)
      if (handler.isActive) {
        // After handler is done waiting for other one to fail its progress should be
        // reset, otherwise there may be a visible jump in values sent by the handler.
        // When handler is waiting it's already activated but the `isAwaiting` flag
        // prevents it from receiving touch stream. When the flag is changed, the
        // difference between this event and the last one may be large enough to be
        // visible in interactions based on this gesture. This makes it consistent with
        // the behavior on iOS.
        if (handler.shouldResetProgress) {
          handler.shouldResetProgress = false
          handler.resetProgress()
        }
        handler.dispatchHandlerUpdate(event)
      }

      if (handler.needsPointerData && isFirstEvent) {
        handler.updatePointerData(event)
      }

      // if event was of type UP or POINTER_UP we request handler to stop tracking now that
      // the event has been dispatched
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_HOVER_EXIT) {
        val pointerId = event.getPointerId(event.actionIndex)
        handler.stopTrackingPointer(pointerId)
      }
    }

    event.recycle()
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

  fun isAnyHandlerActive() = gestureHandlers.any { it.state == GestureHandler.STATE_ACTIVE }

  /**
   * Transforms an event in the coordinates of wrapperView into the coordinate space of the received view.
   *
   * This modifies and returns the same event as it receives
   *
   * @param view - view to which coordinate space the event should be transformed
   * @param event - event to transform
   */
  fun transformEventToViewCoords(view: View?, event: MotionEvent): MotionEvent {
    if (view == null) {
      return event
    }

    val parent = view.parent as? ViewGroup
    // Events are passed down to the orchestrator by the wrapperView, so they are already in the
    // relevant coordinate space. We want to stop traversing the tree when we reach it.
    if (parent != wrapperView) {
      transformEventToViewCoords(parent, event)
    }

    if (parent != null) {
      val localX = event.x + parent.scrollX - view.left
      val localY = event.y + parent.scrollY - view.top
      event.setLocation(localX, localY)
    }

    if (!view.matrix.isIdentity) {
      view.matrix.invert(inverseMatrix)
      event.transform(inverseMatrix)
    }

    return event
  }

  /**
   * Transforms a point in the coordinates of wrapperView into the coordinate space of the received view.
   *
   * This modifies and returns the same point as it receives
   *
   * @param view - view to which coordinate space the point should be transformed
   * @param point - point to transform
   */
  fun transformPointToViewCoords(view: View?, point: PointF): PointF {
    if (view == null) {
      return point
    }

    val parent = view.parent as? ViewGroup
    // Events are passed down to the orchestrator by the wrapperView, so they are already in the
    // relevant coordinate space. We want to stop traversing the tree when we reach it.
    if (parent != wrapperView) {
      transformPointToViewCoords(parent, point)
    }

    if (parent != null) {
      point.x += parent.scrollX - view.left
      point.y += parent.scrollY - view.top
    }

    if (!view.matrix.isIdentity) {
      view.matrix.invert(inverseMatrix)
      tempCoords[0] = point.x
      tempCoords[1] = point.y
      inverseMatrix.mapPoints(tempCoords)
      point.x = tempCoords[0]
      point.y = tempCoords[1]
    }

    return point
  }

  private fun addAwaitingHandler(handler: GestureHandler<*>) {
    if (awaitingHandlers.contains(handler)) {
      return
    }

    awaitingHandlers.add(handler)
    with(handler) {
      isAwaiting = true
      activationIndex = this@GestureHandlerOrchestrator.activationIndex++
    }
  }

  private fun recordHandlerIfNotPresent(handler: GestureHandler<*>, view: View) {
    if (gestureHandlers.contains(handler)) {
      return
    }

    gestureHandlers.add(handler)
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
          synchronized(it) {
            for (handler in it) {
              if (handler.isEnabled && handler.isWithinBounds(view, coords[0], coords[1])) {
                found = true
                recordHandlerIfNotPresent(handler, parentViewGroup)
                handler.startTrackingPointer(pointerId)
              }
            }
          }
        }
      }

      parent = parent.parent
    }

    return found
  }

  private fun recordViewHandlersForPointer(view: View, coords: FloatArray, pointerId: Int, event: MotionEvent): Boolean {
    var found = false
    handlerRegistry.getHandlersForView(view)?.let {
      synchronized(it) {
        for (handler in it) {
          // skip disabled and out-of-bounds handlers
          if (!handler.isEnabled || !handler.isWithinBounds(view, coords[0], coords[1])) {
            continue
          }

          // we don't want to extract gestures other than hover when processing hover events
          if (event.action in listOf(MotionEvent.ACTION_HOVER_EXIT, MotionEvent.ACTION_HOVER_ENTER, MotionEvent.ACTION_HOVER_MOVE) && handler !is HoverGestureHandler) {
            continue
          }

          recordHandlerIfNotPresent(handler, view)
          handler.startTrackingPointer(pointerId)
          found = true
        }
      }
    }

    // if the pointer is inside the view but it overflows its parent, handlers attached to the parent
    // might not have been extracted (pointer might be in a child, but may be outside parent)
    if (coords[0] in 0f..view.width.toFloat() && coords[1] in 0f..view.height.toFloat() &&
      isViewOverflowingParent(view) && extractAncestorHandlers(view, coords, pointerId)
    ) {
      found = true
    }

    return found
  }

  private fun extractGestureHandlers(event: MotionEvent) {
    val actionIndex = event.actionIndex
    val pointerId = event.getPointerId(actionIndex)
    tempCoords[0] = event.getX(actionIndex)
    tempCoords[1] = event.getY(actionIndex)
    traverseWithPointerEvents(wrapperView, tempCoords, pointerId, event)
    extractGestureHandlers(wrapperView, tempCoords, pointerId, event)
  }

  private fun extractGestureHandlers(viewGroup: ViewGroup, coords: FloatArray, pointerId: Int, event: MotionEvent): Boolean {
    val childrenCount = viewGroup.childCount
    for (i in childrenCount - 1 downTo 0) {
      val child = viewConfigHelper.getChildInDrawingOrderAtIndex(viewGroup, i)
      if (canReceiveEvents(child)) {
        val childPoint = tempPoint
        transformPointToChildViewCoords(coords[0], coords[1], viewGroup, child, childPoint)
        val restoreX = coords[0]
        val restoreY = coords[1]
        coords[0] = childPoint.x
        coords[1] = childPoint.y
        var found = false
        if (!isClipping(child) || isTransformedTouchPointInView(coords[0], coords[1], child)) {
          // we only consider the view if touch is inside the view bounds or if the view's children
          // can render outside of the view bounds (overflow visible)
          found = traverseWithPointerEvents(child, coords, pointerId, event)
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

  private fun traverseWithPointerEvents(view: View, coords: FloatArray, pointerId: Int, event: MotionEvent): Boolean =
    when (viewConfigHelper.getPointerEventsConfigForView(view)) {
      PointerEventsConfig.NONE -> {
        // This view and its children can't be the target
        false
      }
      PointerEventsConfig.BOX_ONLY -> {
        // This view is the target, its children don't matter
        (
          recordViewHandlersForPointer(view, coords, pointerId, event) ||
            shouldHandlerlessViewBecomeTouchTarget(view, coords)
          )
      }
      PointerEventsConfig.BOX_NONE -> {
        // This view can't be the target, but its children might
        when (view) {
          is ViewGroup -> {
            extractGestureHandlers(view, coords, pointerId, event).also { found ->
              // A child view is handling touch, also extract handlers attached to this view
              if (found) {
                recordViewHandlersForPointer(view, coords, pointerId, event)
              }
            }
          }
          // When <TextInput> has editable set to `false` getPointerEventsConfigForView returns
          // `BOX_NONE` as it's `isEnabled` property is false. In this case we still want to extract
          // handlers attached to the text input, as it makes sense that gestures would work on a
          // non-editable TextInput.
          is EditText -> {
            recordViewHandlersForPointer(view, coords, pointerId, event)
          }
          else -> false
        }
      }
      PointerEventsConfig.AUTO -> {
        // Either this view or one of its children is the target
        val found = if (view is ViewGroup) {
          extractGestureHandlers(view, coords, pointerId, event)
        } else false

        (
          recordViewHandlersForPointer(view, coords, pointerId, event) ||
            found || shouldHandlerlessViewBecomeTouchTarget(view, coords)
          )
      }
    }

  private fun canReceiveEvents(view: View) =
    view.visibility == View.VISIBLE && view.alpha >= minimumAlphaForTraversal

  // if view is not a view group it is clipping, otherwise we check for `getClipChildren` flag to
  // be turned on and also confirm with the ViewConfigHelper implementation
  private fun isClipping(view: View) =
    view !is ViewGroup || viewConfigHelper.isViewClippingChildren(view)

  fun activateNativeHandlersForView(view: View) {
    handlerRegistry.getHandlersForView(view)?.forEach {
      if (it !is NativeViewGestureHandler) {
        return@forEach
      }
      this.recordHandlerIfNotPresent(it, view)

      it.withMarkedAsInBounds {
        it.begin()
        it.activate()
        it.end()
      }
    }
  }

  companion object {
    // The limit doesn't necessarily need to exists, it was just simpler to implement it that way
    // it is also more allocation-wise efficient to have a fixed limit

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

    private fun transformPointToChildViewCoords(
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
      return handler !== other && (
        handler.shouldWaitForHandlerFailure(other) ||
          other.shouldRequireToWaitForFailure(handler)
        )
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
        (handler.isAwaiting || handler.state == GestureHandler.STATE_ACTIVE)
      ) {
        // in every other case as long as the handler is about to be activated or already in active
        // state, we delegate the decision to the implementation of GestureHandler#shouldBeCancelledBy
        handler.shouldBeCancelledBy(other)
      } else true
    }

    private fun isFinished(state: Int) =
      state == GestureHandler.STATE_CANCELLED ||
        state == GestureHandler.STATE_FAILED ||
        state == GestureHandler.STATE_END
  }
}
