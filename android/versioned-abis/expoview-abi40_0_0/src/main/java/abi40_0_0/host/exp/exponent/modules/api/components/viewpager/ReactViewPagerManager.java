/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi40_0_0.host.exp.exponent.modules.api.components.viewpager;

import java.util.Map;

import android.view.View;

import androidx.viewpager.widget.ViewPager;

import com.facebook.infer.annotation.Assertions;
import abi40_0_0.com.facebook.react.bridge.ReadableArray;
import abi40_0_0.com.facebook.react.common.MapBuilder;
import abi40_0_0.com.facebook.react.uimanager.PixelUtil;
import abi40_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi40_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi40_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Instance of {@link abi40_0_0.com.facebook.react.uimanager.ViewManager} that provides native {@link android.support.v4.view.ViewPager} view.
 */
public class ReactViewPagerManager extends ViewGroupManager<ReactViewPager> {

    private static final String REACT_CLASS = "RNCViewPager";

    private static final int COMMAND_SET_PAGE = 1;
    private static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;
    private static final int COMMAND_SET_SCROLL_ENABLED = 3;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactViewPager createViewInstance(ThemedReactContext reactContext) {
        return new ReactViewPager(reactContext);
    }

    @ReactProp(name = "scrollEnabled", defaultBoolean = true)
    public void setScrollEnabled(ReactViewPager viewPager, boolean value) {
        viewPager.setScrollEnabled(value);
    }

    @ReactProp(name = "orientation")
    public void setOrientation(ReactViewPager viewPager, String value) {
        viewPager.setOrientation(value.equals("vertical"));
    }

    @ReactProp(name = "overScrollMode")
    public void setOverScrollMode(ReactViewPager viewPager, String value) {
        if (value.equals("never")) {
            viewPager.setOverScrollMode(ViewPager.OVER_SCROLL_NEVER);
        } else if (value.equals("always")) {
            viewPager.setOverScrollMode(ViewPager.OVER_SCROLL_ALWAYS);
        } else {
            viewPager.setOverScrollMode(ViewPager.OVER_SCROLL_IF_CONTENT_SCROLLS);
        }
    }

    @Override
    public boolean needsCustomLayoutForChildren() {
        return true;
    }

    @Override
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of(
                PageScrollEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScroll"),
                PageScrollStateChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageScrollStateChanged"),
                PageSelectedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onPageSelected"));
    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
                "setPage",
                COMMAND_SET_PAGE,
                "setPageWithoutAnimation",
                COMMAND_SET_PAGE_WITHOUT_ANIMATION,
                "setScrollEnabled",
                COMMAND_SET_SCROLL_ENABLED);
    }

    @Override
    public void receiveCommand(
            ReactViewPager viewPager,
            int commandType,
            @Nullable ReadableArray args) {
        Assertions.assertNotNull(viewPager);
        Assertions.assertNotNull(args);
        switch (commandType) {
            case COMMAND_SET_PAGE: {
                viewPager.setCurrentItemFromJs(args.getInt(0), true);
                return;
            }
            case COMMAND_SET_PAGE_WITHOUT_ANIMATION: {
                viewPager.setCurrentItemFromJs(args.getInt(0), false);
                return;
            }
            case COMMAND_SET_SCROLL_ENABLED: {
                viewPager.setScrollEnabled(args.getBoolean(0));
                return;
            }
            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
    }

    @Override
    public void addView(ReactViewPager parent, View child, int index) {
        parent.addViewToAdapter(child, index);
    }

    @Override
    public int getChildCount(ReactViewPager parent) {
        return parent.getViewCountInAdapter();
    }

    @Override
    public View getChildAt(ReactViewPager parent, int index) {
        return parent.getViewFromAdapter(index);
    }

    @Override
    public void removeViewAt(ReactViewPager parent, int index) {
        parent.removeViewFromAdapter(index);
    }

    @ReactProp(name = "pageMargin", defaultFloat = 0)
    public void setPageMargin(ReactViewPager pager, float margin) {
        pager.setPageMargin((int) PixelUtil.toPixelFromDIP(margin));
    }

}
