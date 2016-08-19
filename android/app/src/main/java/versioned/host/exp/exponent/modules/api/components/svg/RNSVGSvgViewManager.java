/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

/**
 * ViewManager for RNSVGSvgView React views. Renders as a {@link RNSVGSvgView} and handles
 * invalidating the native view on shadow view updates happening in the underlying tree.
 */
public class RNSVGSvgViewManager extends ViewGroupManager<RNSVGSvgView> {

    private static final String REACT_CLASS = "RNSVGSvgView";
    // TODO: use an ArrayList to connect RNSVGSvgViewShadowNode with RNSVGSvgView, not sure if there will be a race condition.
    // TODO: find a better way to replace this
    private ArrayList<RNSVGSvgViewShadowNode> mSvgShadowNodes = new ArrayList<>();

    public static final int COMMAND_TO_DATA_URL = 100;

    @Override
    public String getName() {
        return REACT_CLASS;
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
    public Map getExportedCustomDirectEventTypeConstants() {
        MapBuilder.Builder builder = MapBuilder.builder();
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


    @Override
    public RNSVGSvgViewShadowNode createShadowNodeInstance() {
        RNSVGSvgViewShadowNode node = new RNSVGSvgViewShadowNode();
        mSvgShadowNodes.add(node);
        return node;
    }

    @Override
    public Class<RNSVGSvgViewShadowNode> getShadowNodeClass() {
        return RNSVGSvgViewShadowNode.class;
    }

    @Override
    protected RNSVGSvgView createViewInstance(ThemedReactContext reactContext) {
        RNSVGSvgView svgView = new RNSVGSvgView(reactContext);
        svgView.setShadowNode(mSvgShadowNodes.remove(0));
        return svgView;
    }

    @Override
    public void updateExtraData(RNSVGSvgView root, Object extraData) {
        root.setBitmap((Bitmap) extraData);
    }
}
