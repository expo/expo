package com.reactnativecommunity.picker;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.LayoutShadowNode;

public class ReactPickerShadowNode extends LayoutShadowNode {
    @Override
    public void setLocalData(Object data) {
        Assertions.assertCondition(data instanceof ReactPickerLocalData);
        setStyleMinHeight(((ReactPickerLocalData) data).getHeight());
    }
}
