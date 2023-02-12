package devmenu.com.swmansion.gesturehandler.react

import android.content.Context
import android.view.MotionEvent
import android.view.ViewGroup
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.UIBlock
import devmenu.com.swmansion.common.GestureHandlerStateManager
import devmenu.com.swmansion.gesturehandler.*
import java.util.*

@ReactModule(name = RNGestureHandlerModule.MODULE_NAME)
class RNGestureHandlerModule(reactContext: ReactApplicationContext?)
  : ReactContextBaseJavaModule(reactContext), GestureHandlerStateManager {
  private abstract class HandlerFactory<T : GestureHandler<T>> : RNGestureHandlerEventDataExtractor<T> {
    abstract val type: Class<T>
    abstract val name: String
    abstract fun create(context: Context?): T
    open fun configure(handler: T, config: ReadableMap) {
      handler.resetConfig()
      if (config.hasKey(KEY_SHOULD_CANCEL_WHEN_OUTSIDE)) {
        handler.setShouldCancelWhenOutside(config.getBoolean(KEY_SHOULD_CANCEL_WHEN_OUTSIDE))
      }
      if (config.hasKey(KEY_ENABLED)) {
        handler.setEnabled(config.getBoolean(KEY_ENABLED))
      }
      if (config.hasKey(KEY_HIT_SLOP)) {
        handleHitSlopProperty(handler, config)
      }
      if (config.hasKey(KEY_NEEDS_POINTER_DATA)) {
        handler.needsPointerData = config.getBoolean(KEY_NEEDS_POINTER_DATA)
      }
      if (config.hasKey(KEY_MANUAL_ACTIVATION)) {
        handler.setManualActivation(config.getBoolean(KEY_MANUAL_ACTIVATION))
      }
    }

    override fun extractEventData(handler: T, eventData: WritableMap) {
      eventData.putDouble("numberOfPointers", handler.numberOfPointers.toDouble())
    }
  }

  private class NativeViewGestureHandlerFactory : HandlerFactory<NativeViewGestureHandler>() {
    override val type = NativeViewGestureHandler::class.java
    override val name = "NativeViewGestureHandler"

    override fun create(context: Context?): NativeViewGestureHandler {
      return NativeViewGestureHandler()
    }

    override fun configure(handler: NativeViewGestureHandler, config: ReadableMap) {
      super.configure(handler, config)
      if (config.hasKey(KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START)) {
        handler.setShouldActivateOnStart(
          config.getBoolean(KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START))
      }
      if (config.hasKey(KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION)) {
        handler.setDisallowInterruption(config.getBoolean(KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION))
      }
    }

    override fun extractEventData(handler: NativeViewGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      eventData.putBoolean("pointerInside", handler.isWithinBounds)
    }
  }

  private class TapGestureHandlerFactory : HandlerFactory<TapGestureHandler>() {
    override val type = TapGestureHandler::class.java
    override val name = "TapGestureHandler"

    override fun create(context: Context?): TapGestureHandler {
      return TapGestureHandler()
    }

    override fun configure(handler: TapGestureHandler, config: ReadableMap) {
      super.configure(handler, config)
      if (config.hasKey(KEY_TAP_NUMBER_OF_TAPS)) {
        handler.setNumberOfTaps(config.getInt(KEY_TAP_NUMBER_OF_TAPS))
      }
      if (config.hasKey(KEY_TAP_MAX_DURATION_MS)) {
        handler.setMaxDurationMs(config.getInt(KEY_TAP_MAX_DURATION_MS).toLong())
      }
      if (config.hasKey(KEY_TAP_MAX_DELAY_MS)) {
        handler.setMaxDelayMs(config.getInt(KEY_TAP_MAX_DELAY_MS).toLong())
      }
      if (config.hasKey(KEY_TAP_MAX_DELTA_X)) {
        handler.setMaxDx(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DELTA_X)))
      }
      if (config.hasKey(KEY_TAP_MAX_DELTA_Y)) {
        handler.setMaxDy(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DELTA_Y)))
      }
      if (config.hasKey(KEY_TAP_MAX_DIST)) {
        handler.setMaxDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DIST)))
      }
      if (config.hasKey(KEY_TAP_MIN_POINTERS)) {
        handler.setMinNumberOfPointers(config.getInt(KEY_TAP_MIN_POINTERS))
      }
    }

    override fun extractEventData(handler: TapGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("x", PixelUtil.toDIPFromPixel(handler.lastRelativePositionX).toDouble())
        putDouble("y", PixelUtil.toDIPFromPixel(handler.lastRelativePositionY).toDouble())
        putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionX).toDouble())
        putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionY).toDouble())
      }
    }
  }

  private class LongPressGestureHandlerFactory : HandlerFactory<LongPressGestureHandler>() {
    override val type = LongPressGestureHandler::class.java
    override val name = "LongPressGestureHandler"

    override fun create(context: Context?): LongPressGestureHandler {
      return LongPressGestureHandler((context)!!)
    }

    override fun configure(handler: LongPressGestureHandler, config: ReadableMap) {
      super.configure(handler, config)
      if (config.hasKey(KEY_LONG_PRESS_MIN_DURATION_MS)) {
        handler.minDurationMs = config.getInt(KEY_LONG_PRESS_MIN_DURATION_MS).toLong()
      }
      if (config.hasKey(KEY_LONG_PRESS_MAX_DIST)) {
        handler.setMaxDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_LONG_PRESS_MAX_DIST)))
      }
    }

    override fun extractEventData(handler: LongPressGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("x", PixelUtil.toDIPFromPixel(handler.lastRelativePositionX).toDouble())
        putDouble("y", PixelUtil.toDIPFromPixel(handler.lastRelativePositionY).toDouble())
        putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionX).toDouble())
        putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionY).toDouble())
        putInt("duration", handler.duration)
      }
    }
  }

  private class PanGestureHandlerFactory : HandlerFactory<PanGestureHandler>() {
    override val type = PanGestureHandler::class.java
    override val name = "PanGestureHandler"

    override fun create(context: Context?): PanGestureHandler {
      return PanGestureHandler(context)
    }

    override fun configure(handler: PanGestureHandler, config: ReadableMap) {
      super.configure(handler, config)
      var hasCustomActivationCriteria = false
      if (config.hasKey(KEY_PAN_ACTIVE_OFFSET_X_START)) {
        handler.setActiveOffsetXStart(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_ACTIVE_OFFSET_X_START)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_ACTIVE_OFFSET_X_END)) {
        handler.setActiveOffsetXEnd(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_ACTIVE_OFFSET_X_END)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_FAIL_OFFSET_RANGE_X_START)) {
        handler.setFailOffsetXStart(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_FAIL_OFFSET_RANGE_X_START)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_FAIL_OFFSET_RANGE_X_END)) {
        handler.setFailOffsetXEnd(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_FAIL_OFFSET_RANGE_X_END)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_ACTIVE_OFFSET_Y_START)) {
        handler.setActiveOffsetYStart(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_ACTIVE_OFFSET_Y_START)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_ACTIVE_OFFSET_Y_END)) {
        handler.setActiveOffsetYEnd(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_ACTIVE_OFFSET_Y_END)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_FAIL_OFFSET_RANGE_Y_START)) {
        handler.setFailOffsetYStart(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_FAIL_OFFSET_RANGE_Y_START)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_FAIL_OFFSET_RANGE_Y_END)) {
        handler.setFailOffsetYEnd(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_FAIL_OFFSET_RANGE_Y_END)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_MIN_VELOCITY)) {
        // This value is actually in DPs/ms, but we can use the same function as for converting
        // from DPs to pixels as the unit we're converting is in the numerator
        handler.setMinVelocity(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_MIN_VELOCITY_X)) {
        handler.setMinVelocityX(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY_X)))
        hasCustomActivationCriteria = true
      }
      if (config.hasKey(KEY_PAN_MIN_VELOCITY_Y)) {
        handler.setMinVelocityY(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY_Y)))
        hasCustomActivationCriteria = true
      }

      // PanGestureHandler sets minDist by default, if there are custom criteria specified we want
      // to reset that setting and use provided criteria instead.
      if (config.hasKey(KEY_PAN_MIN_DIST)) {
        handler.setMinDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_DIST)))
      } else if (hasCustomActivationCriteria) {
        handler.setMinDist(Float.MAX_VALUE)
      }
      if (config.hasKey(KEY_PAN_MIN_POINTERS)) {
        handler.setMinPointers(config.getInt(KEY_PAN_MIN_POINTERS))
      }
      if (config.hasKey(KEY_PAN_MAX_POINTERS)) {
        handler.setMaxPointers(config.getInt(KEY_PAN_MAX_POINTERS))
      }
      if (config.hasKey(KEY_PAN_AVG_TOUCHES)) {
        handler.setAverageTouches(config.getBoolean(KEY_PAN_AVG_TOUCHES))
      }
    }

    override fun extractEventData(handler: PanGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("x", PixelUtil.toDIPFromPixel(handler.lastRelativePositionX).toDouble())
        putDouble("y", PixelUtil.toDIPFromPixel(handler.lastRelativePositionY).toDouble())
        putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionX).toDouble())
        putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionY).toDouble())
        putDouble("translationX", PixelUtil.toDIPFromPixel(handler.translationX).toDouble())
        putDouble("translationY", PixelUtil.toDIPFromPixel(handler.translationY).toDouble())
        putDouble("velocityX", PixelUtil.toDIPFromPixel(handler.velocityX).toDouble())
        putDouble("velocityY", PixelUtil.toDIPFromPixel(handler.velocityY).toDouble())
      }
    }
  }

  private class PinchGestureHandlerFactory : HandlerFactory<PinchGestureHandler>() {
    override val type = PinchGestureHandler::class.java
    override val name = "PinchGestureHandler"

    override fun create(context: Context?): PinchGestureHandler {
      return PinchGestureHandler()
    }

    override fun extractEventData(handler: PinchGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("scale", handler.scale)
        putDouble("focalX", PixelUtil.toDIPFromPixel(handler.focalPointX).toDouble())
        putDouble("focalY", PixelUtil.toDIPFromPixel(handler.focalPointY).toDouble())
        putDouble("velocity", handler.velocity)
      }
    }
  }

  private class FlingGestureHandlerFactory : HandlerFactory<FlingGestureHandler>() {
    override val type = FlingGestureHandler::class.java
    override val name = "FlingGestureHandler"

    override fun create(context: Context?): FlingGestureHandler {
      return FlingGestureHandler()
    }

    override fun configure(handler: FlingGestureHandler, config: ReadableMap) {
      super.configure(handler, config)
      if (config.hasKey(KEY_NUMBER_OF_POINTERS)) {
        handler.numberOfPointersRequired = config.getInt(KEY_NUMBER_OF_POINTERS)
      }
      if (config.hasKey(KEY_DIRECTION)) {
        handler.direction = config.getInt(KEY_DIRECTION)
      }
    }

    override fun extractEventData(handler: FlingGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("x", PixelUtil.toDIPFromPixel(handler.lastRelativePositionX).toDouble())
        putDouble("y", PixelUtil.toDIPFromPixel(handler.lastRelativePositionY).toDouble())
        putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionX).toDouble())
        putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.lastAbsolutePositionY).toDouble())
      }
    }
  }

  private class RotationGestureHandlerFactory : HandlerFactory<RotationGestureHandler>() {
    override val type = RotationGestureHandler::class.java
    override val name = "RotationGestureHandler"

    override fun create(context: Context?): RotationGestureHandler {
      return RotationGestureHandler()
    }

    override fun extractEventData(handler: RotationGestureHandler, eventData: WritableMap) {
      super.extractEventData(handler, eventData)
      with(eventData) {
        putDouble("rotation", handler.rotation)
        putDouble("anchorX", PixelUtil.toDIPFromPixel(handler.anchorX).toDouble())
        putDouble("anchorY", PixelUtil.toDIPFromPixel(handler.anchorY).toDouble())
        putDouble("velocity", handler.velocity)
      }
    }
  }

  private class ManualGestureHandlerFactory : HandlerFactory<ManualGestureHandler>() {
    override val type = ManualGestureHandler::class.java
    override val name = "ManualGestureHandler"

    override fun create(context: Context?): ManualGestureHandler {
      return ManualGestureHandler()
    }
  }

  private val eventListener = object : OnTouchEventListener {
    override fun <T : GestureHandler<T>> onHandlerUpdate(handler: T, event: MotionEvent) {
      this@RNGestureHandlerModule.onHandlerUpdate(handler, event)
    }

    override fun <T : GestureHandler<T>> onStateChange(handler: T, newState: Int, oldState: Int) {
      this@RNGestureHandlerModule.onStateChange(handler, newState, oldState)
    }

    override fun <T : GestureHandler<T>> onTouchEvent(handler: T) {
      this@RNGestureHandlerModule.onTouchEvent(handler)
    }
  }
  private val handlerFactories = arrayOf<HandlerFactory<*>>(
    NativeViewGestureHandlerFactory(),
    TapGestureHandlerFactory(),
    LongPressGestureHandlerFactory(),
    PanGestureHandlerFactory(),
    PinchGestureHandlerFactory(),
    RotationGestureHandlerFactory(),
    FlingGestureHandlerFactory(),
    ManualGestureHandlerFactory(),
  )
  val registry: RNGestureHandlerRegistry = RNGestureHandlerRegistry()
  private val interactionManager = RNGestureHandlerInteractionManager()
  private val roots: MutableList<RNGestureHandlerRootHelper> = ArrayList()
  private val enqueuedRootViewInit: MutableList<Int> = ArrayList()
  override fun getName() = MODULE_NAME

  @ReactMethod
  @Suppress("UNCHECKED_CAST")
  fun <T : GestureHandler<T>> createGestureHandler(
    handlerName: String, handlerTag: Int, config: ReadableMap,
  ) {
    for (handlerFactory in handlerFactories as Array<HandlerFactory<T>>) {
      if (handlerFactory.name == handlerName) {
        val handler = handlerFactory.create(reactApplicationContext).apply {
          tag = handlerTag
          setOnTouchEventListener(eventListener)
        }
        registry.registerHandler(handler)
        interactionManager.configureInteractions(handler, config)
        handlerFactory.configure(handler, config)
        return
      }
    }
    throw JSApplicationIllegalArgumentException("Invalid handler name $handlerName")
  }

  @ReactMethod
  fun attachGestureHandler(handlerTag: Int, viewTag: Int, useDeviceEvents: Boolean) {
    tryInitializeHandlerForReactRootView(viewTag)

    if (!registry.attachHandlerToView(handlerTag, viewTag, useDeviceEvents)) {
      throw JSApplicationIllegalArgumentException("Handler with tag $handlerTag does not exists")
    }
  }

  @ReactMethod
  @Suppress("UNCHECKED_CAST")
  fun <T : GestureHandler<T>> updateGestureHandler(handlerTag: Int, config: ReadableMap) {
    val handler = registry.getHandler(handlerTag) as T?
    if (handler != null) {
      val factory = findFactoryForHandler(handler)
      if (factory != null) {
        interactionManager.dropRelationsForHandlerWithTag(handlerTag)
        interactionManager.configureInteractions(handler, config)
        factory.configure(handler, config)
      }
    }
  }

  @ReactMethod
  fun dropGestureHandler(handlerTag: Int) {
    interactionManager.dropRelationsForHandlerWithTag(handlerTag)
    registry.dropHandler(handlerTag)
  }

  @ReactMethod
  fun handleSetJSResponder(viewTag: Int, blockNativeResponder: Boolean) {
    val rootView = findRootHelperForViewAncestor(viewTag)
    rootView?.handleSetJSResponder(viewTag, blockNativeResponder)
  }

  @ReactMethod
  fun handleClearJSResponder() {
  }

  override fun setGestureHandlerState(handlerTag: Int, newState: Int) {
    registry.getHandler(handlerTag)?.let { handler ->
      when (newState) {
        GestureHandler.STATE_ACTIVE -> handler.activate(force = true)
        GestureHandler.STATE_BEGAN -> handler.begin()
        GestureHandler.STATE_END -> handler.end()
        GestureHandler.STATE_FAILED -> handler.fail()
        GestureHandler.STATE_CANCELLED -> handler.cancel()
      }
    }
  }

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "State" to mapOf(
        "UNDETERMINED" to GestureHandler.STATE_UNDETERMINED,
        "BEGAN" to GestureHandler.STATE_BEGAN,
        "ACTIVE" to GestureHandler.STATE_ACTIVE,
        "CANCELLED" to GestureHandler.STATE_CANCELLED,
        "FAILED" to GestureHandler.STATE_FAILED,
        "END" to GestureHandler.STATE_END
      ),
      "Direction" to mapOf(
        "RIGHT" to GestureHandler.DIRECTION_RIGHT,
        "LEFT" to GestureHandler.DIRECTION_LEFT,
        "UP" to GestureHandler.DIRECTION_UP,
        "DOWN" to GestureHandler.DIRECTION_DOWN
      )
    )
  }

  override fun onCatalystInstanceDestroy() {
    registry.dropAllHandlers()
    interactionManager.reset()
    synchronized(roots) {
      while (roots.isNotEmpty()) {
        val sizeBefore: Int = roots.size
        val root: RNGestureHandlerRootHelper = roots[0]
        val reactRootView: ViewGroup = root.rootView
        if (reactRootView is RNGestureHandlerEnabledRootView) {
          reactRootView.tearDown()
        } else {
          root.tearDown()
        }
        if (roots.size >= sizeBefore) {
          throw IllegalStateException("Expected root helper to get unregistered while tearing down")
        }
      }
    }
    super.onCatalystInstanceDestroy()
  }

  private fun tryInitializeHandlerForReactRootView(ancestorViewTag: Int) {
    val uiManager = reactApplicationContext.UIManager
    val rootViewTag = uiManager.resolveRootTagFromReactTag(ancestorViewTag)
    if (rootViewTag < 1) {
      throw JSApplicationIllegalArgumentException("Could find root view for a given ancestor with tag $ancestorViewTag")
    }
    synchronized(roots) {
      for (root in roots) {
        val rootView: ViewGroup = root.rootView
        if (rootView is ReactRootView && rootView.rootViewTag == rootViewTag) {
          // we have found root helper registered for a given react root, we don't need to
          // initialize a new one then
          return
        }
      }
    }
    synchronized(enqueuedRootViewInit) {
      if (rootViewTag in enqueuedRootViewInit) {
        // root view initialization already enqueued -> we skip
        return
      }
      enqueuedRootViewInit.add(rootViewTag)
    }
    // root helper for a given root tag has not been found, we may wat to check if the root view is
    // an instance of RNGestureHandlerEnabledRootView and then initialize gesture handler with it
    uiManager.addUIBlock(UIBlock { nativeViewHierarchyManager ->
      val view = nativeViewHierarchyManager.resolveView(rootViewTag)
      if (view is RNGestureHandlerEnabledRootView) {
        view.initialize()
      } else {
        // Seems like the root view is something else than RNGestureHandlerEnabledRootView, this
        // is fine though as long as gestureHandlerRootHOC is used in JS
        // FIXME: check and warn about gestureHandlerRootHOC
      }
      synchronized(enqueuedRootViewInit) { enqueuedRootViewInit.remove(rootViewTag) }
    })
  }

  fun registerRootHelper(root: RNGestureHandlerRootHelper) {
    synchronized(roots) {
      if (root in roots) {
        throw IllegalStateException("Root helper$root already registered")
      }
      roots.add(root)
    }
  }

  fun unregisterRootHelper(root: RNGestureHandlerRootHelper) {
    synchronized(roots) { roots.remove(root) }
  }

  private fun findRootHelperForViewAncestor(viewTag: Int): RNGestureHandlerRootHelper? {
    val uiManager = reactApplicationContext.UIManager
    val rootViewTag = uiManager.resolveRootTagFromReactTag(viewTag)
    if (rootViewTag < 1) {
      return null
    }
    synchronized(roots) {
      return roots.firstOrNull {
        it.rootView is ReactRootView && it.rootView.rootViewTag == rootViewTag
      }
    }
  }

  @Suppress("UNCHECKED_CAST")
  private fun <T : GestureHandler<T>> findFactoryForHandler(handler: GestureHandler<T>): HandlerFactory<T>? =
    handlerFactories.firstOrNull { it.type == handler.javaClass } as HandlerFactory<T>?

  private fun <T : GestureHandler<T>> onHandlerUpdate(handler: T, motionEvent: MotionEvent) {
    if (handler.tag < 0) {
      // root containers use negative tags, we don't need to dispatch events for them to the JS
      return
    }
    if (handler.state == GestureHandler.STATE_ACTIVE) {
      val handlerFactory = findFactoryForHandler(handler)

      if (handler.usesDeviceEvents) {
        val data = RNGestureHandlerEvent.createEventData(handler, handlerFactory)

        reactApplicationContext
          .deviceEventEmitter
          .emit(RNGestureHandlerEvent.EVENT_NAME, data)
      } else {
        reactApplicationContext
          .UIManager
          .eventDispatcher.let {
            val event = RNGestureHandlerEvent.obtain(handler, handlerFactory)
            it.dispatchEvent(event)
          }
      }
    }
  }

  private fun <T : GestureHandler<T>> onStateChange(handler: T, newState: Int, oldState: Int) {
    if (handler.tag < 0) {
      // root containers use negative tags, we don't need to dispatch events for them to the JS
      return
    }
    val handlerFactory = findFactoryForHandler(handler)

    if (handler.usesDeviceEvents) {
      val data = RNGestureHandlerStateChangeEvent.createEventData(
        handler,
        handlerFactory,
        newState,
        oldState,
      )

      reactApplicationContext
        .deviceEventEmitter
        .emit(RNGestureHandlerStateChangeEvent.EVENT_NAME, data)
    } else {
      reactApplicationContext
        .UIManager
        .eventDispatcher.let {
          val event =
            RNGestureHandlerStateChangeEvent.obtain(handler, newState, oldState, handlerFactory)
          it.dispatchEvent(event)
        }
    }
  }

  private fun <T : GestureHandler<T>> onTouchEvent(handler: T) {
    if (handler.tag < 0) {
      // root containers use negative tags, we don't need to dispatch events for them to the JS
      return
    }
    if (handler.state == GestureHandler.STATE_BEGAN || handler.state == GestureHandler.STATE_ACTIVE
        || handler.state == GestureHandler.STATE_UNDETERMINED || handler.view != null) {
      if (handler.usesDeviceEvents) {
        val data = RNGestureHandlerTouchEvent.createEventData(handler)

        reactApplicationContext
            .deviceEventEmitter
            .emit(RNGestureHandlerTouchEvent.EVENT_NAME, data)
      } else {
        reactApplicationContext
            .UIManager
            .eventDispatcher.let {
              val event = RNGestureHandlerTouchEvent.obtain(handler)
              it.dispatchEvent(event)
            }
      }
    }
  }

  companion object {
    const val MODULE_NAME = "RNGestureHandlerModule"
    private const val KEY_SHOULD_CANCEL_WHEN_OUTSIDE = "shouldCancelWhenOutside"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_NEEDS_POINTER_DATA = "needsPointerData"
    private const val KEY_MANUAL_ACTIVATION = "manualActivation"
    private const val KEY_HIT_SLOP = "hitSlop"
    private const val KEY_HIT_SLOP_LEFT = "left"
    private const val KEY_HIT_SLOP_TOP = "top"
    private const val KEY_HIT_SLOP_RIGHT = "right"
    private const val KEY_HIT_SLOP_BOTTOM = "bottom"
    private const val KEY_HIT_SLOP_VERTICAL = "vertical"
    private const val KEY_HIT_SLOP_HORIZONTAL = "horizontal"
    private const val KEY_HIT_SLOP_WIDTH = "width"
    private const val KEY_HIT_SLOP_HEIGHT = "height"
    private const val KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START = "shouldActivateOnStart"
    private const val KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION = "disallowInterruption"
    private const val KEY_TAP_NUMBER_OF_TAPS = "numberOfTaps"
    private const val KEY_TAP_MAX_DURATION_MS = "maxDurationMs"
    private const val KEY_TAP_MAX_DELAY_MS = "maxDelayMs"
    private const val KEY_TAP_MAX_DELTA_X = "maxDeltaX"
    private const val KEY_TAP_MAX_DELTA_Y = "maxDeltaY"
    private const val KEY_TAP_MAX_DIST = "maxDist"
    private const val KEY_TAP_MIN_POINTERS = "minPointers"
    private const val KEY_LONG_PRESS_MIN_DURATION_MS = "minDurationMs"
    private const val KEY_LONG_PRESS_MAX_DIST = "maxDist"
    private const val KEY_PAN_ACTIVE_OFFSET_X_START = "activeOffsetXStart"
    private const val KEY_PAN_ACTIVE_OFFSET_X_END = "activeOffsetXEnd"
    private const val KEY_PAN_FAIL_OFFSET_RANGE_X_START = "failOffsetXStart"
    private const val KEY_PAN_FAIL_OFFSET_RANGE_X_END = "failOffsetXEnd"
    private const val KEY_PAN_ACTIVE_OFFSET_Y_START = "activeOffsetYStart"
    private const val KEY_PAN_ACTIVE_OFFSET_Y_END = "activeOffsetYEnd"
    private const val KEY_PAN_FAIL_OFFSET_RANGE_Y_START = "failOffsetYStart"
    private const val KEY_PAN_FAIL_OFFSET_RANGE_Y_END = "failOffsetYEnd"
    private const val KEY_PAN_MIN_DIST = "minDist"
    private const val KEY_PAN_MIN_VELOCITY = "minVelocity"
    private const val KEY_PAN_MIN_VELOCITY_X = "minVelocityX"
    private const val KEY_PAN_MIN_VELOCITY_Y = "minVelocityY"
    private const val KEY_PAN_MIN_POINTERS = "minPointers"
    private const val KEY_PAN_MAX_POINTERS = "maxPointers"
    private const val KEY_PAN_AVG_TOUCHES = "avgTouches"
    private const val KEY_NUMBER_OF_POINTERS = "numberOfPointers"
    private const val KEY_DIRECTION = "direction"

    private fun handleHitSlopProperty(handler: GestureHandler<*>, config: ReadableMap) {
      if (config.getType(KEY_HIT_SLOP) == ReadableType.Number) {
        val hitSlop = PixelUtil.toPixelFromDIP(config.getDouble(KEY_HIT_SLOP))
        handler.setHitSlop(hitSlop, hitSlop, hitSlop, hitSlop, GestureHandler.HIT_SLOP_NONE, GestureHandler.HIT_SLOP_NONE)
      } else {
        val hitSlop = config.getMap(KEY_HIT_SLOP)!!
        var left = GestureHandler.HIT_SLOP_NONE
        var top = GestureHandler.HIT_SLOP_NONE
        var right = GestureHandler.HIT_SLOP_NONE
        var bottom = GestureHandler.HIT_SLOP_NONE
        var width = GestureHandler.HIT_SLOP_NONE
        var height = GestureHandler.HIT_SLOP_NONE
        if (hitSlop.hasKey(KEY_HIT_SLOP_HORIZONTAL)) {
          val horizontalPad = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_HORIZONTAL))
          right = horizontalPad
          left = right
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_VERTICAL)) {
          val verticalPad = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_VERTICAL))
          bottom = verticalPad
          top = bottom
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_LEFT)) {
          left = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_LEFT))
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_TOP)) {
          top = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_TOP))
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_RIGHT)) {
          right = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_RIGHT))
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_BOTTOM)) {
          bottom = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_BOTTOM))
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_WIDTH)) {
          width = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_WIDTH))
        }
        if (hitSlop.hasKey(KEY_HIT_SLOP_HEIGHT)) {
          height = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_HEIGHT))
        }
        handler.setHitSlop(left, top, right, bottom, width, height)
      }
    }
  }
}
