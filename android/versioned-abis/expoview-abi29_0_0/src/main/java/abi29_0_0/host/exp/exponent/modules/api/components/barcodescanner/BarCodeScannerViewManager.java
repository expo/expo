package abi29_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import android.support.annotation.Nullable;

import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.common.MapBuilder;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi29_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi29_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi29_0_0.host.exp.exponent.modules.api.components.barcodescanner.BarCodeScannerView.Events;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;

public class BarCodeScannerViewManager extends ViewGroupManager<BarCodeScannerView> {
    private static final String REACT_CLASS = "ExponentBarCodeScanner";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public BarCodeScannerView createViewInstance(ThemedReactContext themedReactContext) {
        return new BarCodeScannerView(themedReactContext);
    }

    @Override
    @Nullable
    public Map getExportedCustomDirectEventTypeConstants() {
        MapBuilder.Builder builder = MapBuilder.builder();
        for (Events event : Events.values()) {
            builder.put(event.toString(), MapBuilder.of("registrationName", event.toString()));
        }
        return builder.build();
    }


    @ReactProp(name = "type")
    public void setType(BarCodeScannerView view, int type) {
        view.setCameraType(type);
    }

    @ReactProp(name = "torchMode")
    public void setTorchMode(BarCodeScannerView view, int torchMode) {
        view.setTorchMode(torchMode);
    }

    @ReactProp(name = "barCodeTypes")
    public void setBarCodeTypes(BarCodeScannerView view, ReadableArray barCodeTypes) {
        if (barCodeTypes == null) {
            return;
        }
        List<Integer> result = new ArrayList<>(barCodeTypes.size());
        for (int i = 0; i < barCodeTypes.size(); i++) {
            result.add(barCodeTypes.getInt(i));
        }
        view.setBarCodeTypes(result);
    }
}
