/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi42_0_0.host.exp.exponent.modules.api.components.viewpager;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.widget.ViewPager2;

import com.facebook.infer.annotation.Assertions;
import abi42_0_0.com.facebook.react.bridge.ReadableArray;
import abi42_0_0.com.facebook.react.common.MapBuilder;
import abi42_0_0.com.facebook.react.uimanager.PixelUtil;
import abi42_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi42_0_0.com.facebook.react.uimanager.UIManagerModule;

import abi42_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi42_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi42_0_0.com.facebook.react.uimanager.events.EventDispatcher;
import abi42_0_0.host.exp.exponent.modules.api.components.viewpager.event.PageScrollEvent;
import abi42_0_0.host.exp.exponent.modules.api.components.viewpager.event.PageScrollStateChangedEvent;
import abi42_0_0.host.exp.exponent.modules.api.components.viewpager.event.PageSelectedEvent;

import java.util.Map;

import static androidx.viewpager2.widget.ViewPager2.ORIENTATION_HORIZONTAL;
import static androidx.viewpager2.widget.ViewPager2.SCROLL_STATE_DRAGGING;
import static androidx.viewpager2.widget.ViewPager2.SCROLL_STATE_IDLE;
import static androidx.viewpager2.widget.ViewPager2.SCROLL_STATE_SETTLING;

public class ReactViewPagerManager extends ViewGroupManager<ViewPager2> {

    private static final String REACT_CLASS = "RNCViewPager";
    private static final int COMMAND_SET_PAGE = 1;
    private static final int COMMAND_SET_PAGE_WITHOUT_ANIMATION = 2;
    private static final int COMMAND_SET_SCROLL_ENABLED = 3;
    private EventDispatcher eventDispatcher;

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected ViewPager2 createViewInstance(@NonNull ThemedReactContext reactContext) {
        final ViewPager2 vp = new ViewPager2(reactContext);
        final FragmentAdapter adapter = new FragmentAdapter((FragmentActivity) reactContext.getCurrentActivity());
        vp.setAdapter(adapter);
        //https://github.com/callstack/react-native-viewpager/issues/183
        vp.setSaveEnabled(false);
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

    private void setCurrentItem(final ViewPager2 view, int selectedTab, boolean scrollSmooth) {
        view.post(new Runnable() {
            @Override
            public void run() {
                view.measure(
                        View.MeasureSpec.makeMeasureSpec(view.getWidth(), View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(view.getHeight(), View.MeasureSpec.EXACTLY));
                view.layout(view.getLeft(), view.getTop(), view.getRight(), view.getBottom());
            }
        });
        view.setCurrentItem(selectedTab, scrollSmooth);
    }


    @Override
    public void addView(ViewPager2 parent, View child, int index) {
        if (child == null) {
            return;
        }
        ((FragmentAdapter) parent.getAdapter()).addFragment(child, index);
    }

    @Override
    public int getChildCount(ViewPager2 parent) {
        return parent.getAdapter().getItemCount();
    }


    @Override
    public View getChildAt(ViewPager2 parent, int index) {
        return ((FragmentAdapter) parent.getAdapter()).getChildViewAt(index);
    }

    @Override
    public void removeView(ViewPager2 parent, View view) {
        ((FragmentAdapter) parent.getAdapter()).removeFragment(view);
    }


    public void removeAllViews(ViewPager2 parent) {
        parent.setUserInputEnabled(false);
        FragmentAdapter adapter = ((FragmentAdapter) parent.getAdapter());
        adapter.removeAll();
    }

    @Override
    public void removeViewAt(ViewPager2 parent, int index) {
        FragmentAdapter adapter = ((FragmentAdapter) parent.getAdapter());
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

    @ReactProp(name = "offscreenPageLimit", defaultInt = ViewPager2.OFFSCREEN_PAGE_LIMIT_DEFAULT)
    public void set(ViewPager2 viewPager, int value) {
        viewPager.setOffscreenPageLimit(value);
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
                setCurrentItem(root, args.getInt(0), true);
                eventDispatcher.dispatchEvent(new PageSelectedEvent(root.getId(), args.getInt(0)));
                return;

            }
            case COMMAND_SET_PAGE_WITHOUT_ANIMATION: {
                setCurrentItem(root, args.getInt(0), false);
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
        final int pageMargin = (int) PixelUtil.toPixelFromDIP(margin);
        final ViewPager2 vp = pager;

        /**
         * Don't use MarginPageTransformer to be able to support negative margins
         */
        pager.setPageTransformer(new ViewPager2.PageTransformer() {
            @Override
            public void transformPage(@NonNull View page, float position) {
                float offset = pageMargin * position;

                if (vp.getOrientation() == ViewPager2.ORIENTATION_HORIZONTAL) {
                    boolean isRTL = vp.getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;

                    page.setTranslationX(isRTL ? -offset : offset);
                } else {
                    page.setTranslationY(offset);
                }
            }
        });
    }
}
