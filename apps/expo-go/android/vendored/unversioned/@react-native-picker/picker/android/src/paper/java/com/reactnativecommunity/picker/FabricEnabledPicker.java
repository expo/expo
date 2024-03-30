package com.reactnativecommunity.picker;

import android.content.Context;
import android.content.res.Resources;
import android.util.AttributeSet;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatSpinner;

import com.facebook.react.uimanager.StateWrapper;

public abstract class FabricEnabledPicker extends AppCompatSpinner {
    public void setStateWrapper(StateWrapper stateWrapper) {
        // NO-OP on paper
    }

    protected void setMeasuredHeight(int height) {
        // NO-OP on paper
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
