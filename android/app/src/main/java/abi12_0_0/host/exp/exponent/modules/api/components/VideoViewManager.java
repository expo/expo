package abi12_0_0.host.exp.exponent.modules.api.components;

import abi12_0_0.com.facebook.react.bridge.ReadableMap;
import abi12_0_0.com.facebook.react.common.MapBuilder;
import abi12_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi12_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi12_0_0.com.facebook.react.uimanager.ThemedReactContext;
import com.yqritc.scalablevideoview.ScalableType;
import abi12_0_0.host.exp.exponent.modules.api.components.VideoView.Events;

import javax.annotation.Nullable;
import java.util.Map;

public class VideoViewManager extends SimpleViewManager<VideoView> {
    public static final String REACT_CLASS = "ExponentVideo";

    public static final String PROP_SRC = "src";
    public static final String PROP_SRC_URI = "uri";
    public static final String PROP_SRC_TYPE = "type";
    public static final String PROP_SRC_IS_NETWORK = "isNetwork";
    public static final String PROP_SRC_IS_ASSET = "isAsset";
    public static final String PROP_RESIZE_MODE = "resizeMode";
    public static final String PROP_REPEAT = "repeat";
    public static final String PROP_PAUSED = "paused";
    public static final String PROP_MUTED = "muted";
    public static final String PROP_VOLUME = "volume";
    public static final String PROP_SEEK = "seek";
    public static final String PROP_RATE = "rate";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected VideoView createViewInstance(ThemedReactContext themedReactContext) {
        return new VideoView(themedReactContext);
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

    @Override
    @Nullable
    public Map getExportedViewConstants() {
        return MapBuilder.of(
                "ScaleNone", Integer.toString(ScalableType.LEFT_TOP.ordinal()),
                "ScaleToFill", Integer.toString(ScalableType.FIT_XY.ordinal()),
                "ScaleAspectFit", Integer.toString(ScalableType.FIT_CENTER.ordinal()),
                "ScaleAspectFill", Integer.toString(ScalableType.CENTER_CROP.ordinal())
        );
    }

    @ReactProp(name = PROP_SRC)
    public void setSrc(final VideoView videoView, @Nullable ReadableMap src) {
        videoView.setSrc(
                src.getString(PROP_SRC_URI),
                src.getString(PROP_SRC_TYPE),
                src.getBoolean(PROP_SRC_IS_NETWORK),
                src.getBoolean(PROP_SRC_IS_ASSET)
        );
    }

    @ReactProp(name = PROP_RESIZE_MODE)
    public void setResizeMode(final VideoView videoView, final String resizeModeOrdinalString) {
        videoView.setResizeModeModifier(ScalableType.values()[Integer.parseInt(resizeModeOrdinalString)]);
    }

    @ReactProp(name = PROP_REPEAT, defaultBoolean = false)
    public void setRepeat(final VideoView videoView, final boolean repeat) {
        videoView.setRepeatModifier(repeat);
    }

    @ReactProp(name = PROP_PAUSED, defaultBoolean = false)
    public void setPaused(final VideoView videoView, final boolean paused) {
        videoView.setPausedModifier(paused);
    }

    @ReactProp(name = PROP_MUTED, defaultBoolean = false)
    public void setMuted(final VideoView videoView, final boolean muted) {
        videoView.setMutedModifier(muted);
    }

    @ReactProp(name = PROP_VOLUME, defaultFloat = 1.0f)
    public void setVolume(final VideoView videoView, final float volume) {
        videoView.setVolumeModifier(volume);
    }

    @ReactProp(name = PROP_SEEK)
    public void setSeek(final VideoView videoView, final float seek) {
        videoView.seekTo(Math.round(seek * 1000.0f));
    }

    @ReactProp(name = PROP_RATE)
    public void setRate(final VideoView videoView, final float rate) {
        videoView.setRateModifier(rate);
    }
}
