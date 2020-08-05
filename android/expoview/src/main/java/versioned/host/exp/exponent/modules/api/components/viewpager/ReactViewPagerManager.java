/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * <p>
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package versioned.host.exp.exponent.modules.api.components.viewpager;

import android.util.SparseArray;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;


import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;

import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.reactnative.community.viewpager2.widget.ViewPager2;
import versioned.host.exp.exponent.modules.api.components.viewpager.event.PageScrollEvent;
import versioned.host.exp.exponent.modules.api.components.viewpager.event.PageScrollStateChangedEvent;
import versioned.host.exp.exponent.modules.api.components.viewpager.event.PageSelectedEvent;

import java.util.Map;

import static com.reactnative.community.viewpager2.widget.ViewPager2.ORIENTATION_HORIZONTAL;
import static com.reactnative.community.viewpager2.widget.ViewPager2.SCROLL_STATE_DRAGGING;
import static com.reactnative.community.viewpager2.widget.ViewPager2.SCROLL_STATE_IDLE;
import static com.reactnative.community.viewpager2.widget.ViewPager2.SCROLL_STATE_SETTLING;
import static versioned.host.exp.exponent.modules.api.components.viewpager.ViewPagerFragment.CHILD_VIEW_KEY;

public class ReactViewPagerManager extends ViewGroupManager<ViewPager2> {

    private static final String REACT_CLASS = "RNCViewPager";
    private static final int COMMAND_SET_PAGE = 1;
    private static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;
    private static final int COMMAND_SET_SCROLL_ENABLED = 3;
    private EventDispatcher eventDispatcher;
    static SparseArray<View> reactChildrenViews = new SparseArray<>();

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected ViewPager2 createViewInstance(@NonNull ThemedReactContext reactContext) {
        final ViewPager2 vp = new ViewPager2(reactContext);
        FragmentAdapter adapter = new FragmentAdapter((FragmentActivity) reactContext.getCurrentActivity());
        vp.setAdapter(adapter);
        eventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        vp.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
                super.onPageScrolled(position, positionOffset, positionOffsetPixels);
                eventDispatcher.dispatchEvent(
                        new PageScrollEvent(vp.getId(), position, positionOffset));
            }

            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                eventDispatcher.dispatchEvent(
                        new PageSelectedEvent(vp.getId(), position));
            }

            @Override
            public void onPageScrollStateChanged(int state) {
                super.onPageScrollStateChanged(state);
                String pageScrollState;
                switch (state) {
                    case SCROLL_STATE_IDLE:
                        pageScrollState = "idle";
                        break;
                    case SCROLL_STATE_DRAGGING:
                        pageScrollState = "dragging";
                        break;
                    case SCROLL_STATE_SETTLING:
                        pageScrollState = "settling";
                        break;
                    default:
                        throw new IllegalStateException("Unsupported pageScrollState");
                }
                eventDispatcher.dispatchEvent(
                        new PageScrollStateChangedEvent(vp.getId(), pageScrollState));
            }
        });
        return vp;
    }

    @Override
    public void addView(ViewPager2 parent, View child, int index) {
        if (child == null) {
            return;
        }
        reactChildrenViews.put(child.getId(), child);
        ((FragmentAdapter) parent.getAdapter()).addFragment(child, index);
    }

    @Override
    public int getChildCount(ViewPager2 parent) {
        return parent.getAdapter().getItemCount();
    }


    @Override
    public View getChildAt(ViewPager2 parent, int index) {
        return ((FragmentAdapter) parent.getAdapter()).getChildAt(index);
    }

    @Override
    public void removeView(ViewPager2 parent, View view) {
        reactChildrenViews.remove(view.getId());
        ((FragmentAdapter) parent.getAdapter()).removeFragment(view);
    }


    public void removeAllViews(ViewPager2 parent) {
        FragmentAdapter adapter = ((FragmentAdapter) parent.getAdapter());
        for (Fragment fragment : adapter.getChildren()) {
            int viewID = fragment.getArguments().getInt(CHILD_VIEW_KEY);
            reactChildrenViews.remove(viewID);
        }
        adapter.removeAll();
        parent.setAdapter(null);
    }

    @Override
    public void removeViewAt(ViewPager2 parent, int index) {
        FragmentAdapter adapter = ((FragmentAdapter) parent.getAdapter());
        Fragment fragment = adapter.getChildren().get(index);
        int viewID = fragment.getArguments().getInt(CHILD_VIEW_KEY);
        reactChildrenViews.remove(viewID);
        adapter.removeFragmentAt(index);
    }

    @Override
    public boolean needsCustomLayoutForChildren() {
        return true;
    }


    @ReactProp(name = "scrollEnabled", defaultBoolean = true)
    public void setScrollEnabled(ViewPager2 viewPager, boolean value) {
        viewPager.setUserInputEnabled(value);
    }

    @ReactProp(name = "orientation")
    public void setOrientation(ViewPager2 viewPager, String value) {
        viewPager.setOrientation(value.equals("vertical") ? ViewPager2.ORIENTATION_VERTICAL : ORIENTATION_HORIZONTAL);
    }

    @ReactProp(name = "overScrollMode")
    public void setOverScrollMode(ViewPager2 viewPager, String value) {
        View child = viewPager.getChildAt(0);
        if (value.equals("never")) {
            child.setOverScrollMode(ViewPager2.OVER_SCROLL_NEVER);
        } else if (value.equals("always")) {
            child.setOverScrollMode(ViewPager2.OVER_SCROLL_ALWAYS);
        } else {
            child.setOverScrollMode(ViewPager2.OVER_SCROLL_IF_CONTENT_SCROLLS);
        }
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
    public void receiveCommand(@NonNull final ViewPager2 root, int commandId, @Nullable final ReadableArray args) {
        super.receiveCommand(root, commandId, args);
        Assertions.assertNotNull(root);
        Assertions.assertNotNull(args);
        switch (commandId) {
            case COMMAND_SET_PAGE: {
                root.setCurrentItem(args.getInt(0), true);
                eventDispatcher.dispatchEvent(new PageSelectedEvent(root.getId(), args.getInt(0)));
                return;

            }
            case COMMAND_SET_PAGE_WITHOUT_ANIMATION: {
                root.setCurrentItem(args.getInt(0), false);
                eventDispatcher.dispatchEvent(new PageSelectedEvent(root.getId(), args.getInt(0)));
                return;
            }
            case COMMAND_SET_SCROLL_ENABLED: {
                root.setUserInputEnabled(args.getBoolean(0));
                return;
            }
            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandId,
                        getClass().getSimpleName()));
        }
    }


    @ReactProp(name = "pageMargin", defaultFloat = 0)
    public void setPageMargin(ViewPager2 pager, float margin) {
        int pageMargin = (int) PixelUtil.toPixelFromDIP(margin);
        pager.setPadding(pageMargin, pageMargin, pageMargin, pageMargin);
    }

}
