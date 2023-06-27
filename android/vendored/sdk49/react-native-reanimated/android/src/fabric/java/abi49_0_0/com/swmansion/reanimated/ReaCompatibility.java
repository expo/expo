package abi49_0_0.com.swmansion.reanimated;

import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReadableMap;
import abi49_0_0.com.facebook.react.uimanager.UIManagerHelper;
import abi49_0_0.com.facebook.react.uimanager.common.UIManagerType;
import abi49_0_0.com.facebook.react.fabric.FabricUIManager;

class ReaCompatibility {
    private FabricUIManager fabricUIManager;

    public ReaCompatibility(ReactApplicationContext reactApplicationContext) {
        fabricUIManager = (FabricUIManager) UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC);
    }

    public void registerFabricEventListener(NodesManager nodeManager) {
        if (fabricUIManager != null) {
            fabricUIManager.getEventDispatcher().addListener(nodeManager);
        }
    }

    public void synchronouslyUpdateUIProps(int viewTag, ReadableMap uiProps) {
        fabricUIManager.synchronouslyUpdateViewOnUIThread(viewTag, uiProps);
    }
}