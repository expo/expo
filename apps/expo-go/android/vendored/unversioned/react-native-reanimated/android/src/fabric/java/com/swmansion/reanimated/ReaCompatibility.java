package com.swmansion.reanimated;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.fabric.FabricUIManager;

class ReaCompatibility {
    private FabricUIManager fabricUIManager;

    public ReaCompatibility(ReactApplicationContext reactApplicationContext) {
        fabricUIManager = (FabricUIManager) UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC);
    }

    public void registerFabricEventListener(NodesManager nodesManager) {
        if (fabricUIManager != null) {
            fabricUIManager.getEventDispatcher().addListener(nodesManager);
        }
    }

    public void synchronouslyUpdateUIProps(int viewTag, ReadableMap uiProps) {
        fabricUIManager.synchronouslyUpdateViewOnUIThread(viewTag, uiProps);
    }
}