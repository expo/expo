package com.swmansion.rnscreens

import android.view.ViewGroup
import androidx.annotation.UiThread
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.FabricViewStateManager
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.abs

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context), FabricViewStateManager.HasFabricViewStateManager {
    private val mFabricViewStateManager: FabricViewStateManager = FabricViewStateManager()

    override fun getFabricViewStateManager(): FabricViewStateManager {
        return mFabricViewStateManager
    }

    protected fun updateScreenSizeFabric(width: Int, height: Int) {
        updateState(width, height)
    }

    @UiThread
    fun updateState(width: Int, height: Int) {
        val realWidth: Float = PixelUtil.toDIPFromPixel(width.toFloat())
        val realHeight: Float = PixelUtil.toDIPFromPixel(height.toFloat())

        // Check incoming state values. If they're already the correct value, return early to prevent
        // infinite UpdateState/SetState loop.
        val currentState: ReadableMap? = mFabricViewStateManager.getStateData()
        if (currentState != null) {
            val delta = 0.9f
            val stateFrameHeight: Float = if (currentState.hasKey("frameHeight")) currentState.getDouble("frameHeight").toFloat() else 0f
            val stateFrameWidth: Float = if (currentState.hasKey("frameWidth")) currentState.getDouble("frameWidth").toFloat() else 0f
            if (abs(stateFrameWidth - realWidth) < delta &&
                abs(stateFrameHeight - realHeight) < delta
            ) {
                return
            }
        }
        mFabricViewStateManager.setState {
            val map: WritableMap = WritableNativeMap()
            map.putDouble("frameWidth", realWidth.toDouble())
            map.putDouble("frameHeight", realHeight.toDouble())
            map
        }
    }
}
