package com.reactnativecommunity.picker;

import android.content.Context;
import android.content.res.Resources;
import android.util.AttributeSet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import androidx.appcompat.widget.AppCompatSpinner;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.StateWrapper;

public abstract class FabricEnabledPicker extends AppCompatSpinner {
    private StateWrapper mStateWrapper = null;

    @Nullable
    public StateWrapper getStateWrapper() {
        return mStateWrapper;
    }

    public void setStateWrapper(StateWrapper stateWrapper) {
        mStateWrapper = stateWrapper;
    }

    protected void setMeasuredHeight(int height) {
        updateState(height);
    }

    @UiThread
    void updateState(int measuredHeight) {
        float realHeight = PixelUtil.toDIPFromPixel(measuredHeight);

        // Check incoming state values. If they're already the correct value, return early to prevent
        // infinite UpdateState/SetState loop.
        ReadableMap currentState = mStateWrapper.getStateData();
        if (currentState != null) {
            float stateHeight = currentState.hasKey("measuredHeight") ? currentState.getInt("measuredHeight") : 1;
            if (Math.abs(stateHeight - realHeight) < 0.9) {
                return;
            }
        }
        WritableMap map = new WritableNativeMap();
        map.putDouble("measuredHeight", realHeight);
        mStateWrapper.updateState(map);
    }

    public FabricEnabledPicker(@NonNull Context context) {
        super(context);
    }

    public FabricEnabledPicker(@NonNull Context context, int mode) {
        super(context, mode);
    }

    public FabricEnabledPicker(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public FabricEnabledPicker(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public FabricEnabledPicker(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr, int mode) {
        super(context, attrs, defStyleAttr, mode);
    }

    public FabricEnabledPicker(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr, int mode, Resources.Theme popupTheme) {
        super(context, attrs, defStyleAttr, mode, popupTheme);
    }
}
