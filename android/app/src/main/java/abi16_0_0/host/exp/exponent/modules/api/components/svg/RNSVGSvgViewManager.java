/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi16_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;

import abi16_0_0.com.facebook.react.bridge.ReadableArray;
import abi16_0_0.com.facebook.react.common.MapBuilder;
import abi16_0_0.com.facebook.react.uimanager.BaseViewManager;
import abi16_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi16_0_0.com.facebook.yoga.YogaMeasureFunction;
import abi16_0_0.com.facebook.yoga.YogaMeasureMode;
import abi16_0_0.com.facebook.yoga.YogaNodeAPI;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * ViewManager for RNSVGSvgView React views. Renders as a {@link RNSVGSvgView} and handles
 * invalidating the native view on shadow view updates happening in the underlying tree.
 */
public class RNSVGSvgViewManager extends BaseViewManager<RNSVGSvgView, RNSVGSvgViewShadowNode> {

    private static final String REACT_CLASS = "RNSVGSvgView";
    private static final int COMMAND_TO_DATA_URL = 100;
    private static final YogaMeasureFunction MEASURE_FUNCTION = new YogaMeasureFunction() {
      @Override
      public long measure(
          YogaNodeAPI node,
          float width,
          YogaMeasureMode widthMode,
          float height,
          YogaMeasureMode heightMode) {
        throw new IllegalStateException("SurfaceView should have explicit width and height set");
      }
    };

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public Class<RNSVGSvgViewShadowNode> getShadowNodeClass() {
        return RNSVGSvgViewShadowNode.class;
    }

    @Override
    public RNSVGSvgViewShadowNode createShadowNodeInstance() {
        RNSVGSvgViewShadowNode node = new RNSVGSvgViewShadowNode();
        node.setMeasureFunction(MEASURE_FUNCTION);
        return node;
    }

    @Override
    protected RNSVGSvgView createViewInstance(ThemedReactContext reactContext) {
        return new RNSVGSvgView(reactContext);
    }

    @Override
    public void updateExtraData(RNSVGSvgView root, Object extraData) {
        root.setBitmap((Bitmap) extraData);
    }

    @Override
    public @Nullable Map<String, Integer> getCommandsMap() {
        Map<String, Integer> commandsMap = super.getCommandsMap();
        if (commandsMap == null) {
            commandsMap = new HashMap<>();
        }

        commandsMap.put("toDataURL", COMMAND_TO_DATA_URL);
        return commandsMap;
    }

    @Override
    @Nullable
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        MapBuilder.Builder<String, Object> builder = MapBuilder.builder();

        for (RNSVGSvgView.Events event : RNSVGSvgView.Events.values()) {
            builder.put(event.toString(), MapBuilder.of("registrationName", event.toString()));
        }
        return builder.build();
    }

    @Override
    public void receiveCommand(RNSVGSvgView root, int commandId, @Nullable ReadableArray args) {
        super.receiveCommand(root, commandId, args);

        switch (commandId) {
            case COMMAND_TO_DATA_URL:
                root.onDataURL();
                break;
        }
    }
}
