package com.wix.detox.espresso;

import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.action.CoordinatesProvider;
import android.support.test.espresso.action.GeneralClickAction;
import android.support.test.espresso.action.GeneralLocation;
import android.support.test.espresso.action.GeneralSwipeAction;
import android.support.test.espresso.action.Press;
import android.support.test.espresso.action.Swipe;
import android.support.test.espresso.action.Tap;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.widget.AbsListView;
import android.widget.HorizontalScrollView;
import android.widget.ScrollView;

import org.hamcrest.Matcher;

import static android.support.test.espresso.action.ViewActions.actionWithAssertions;
import static android.support.test.espresso.action.ViewActions.swipeDown;
import static android.support.test.espresso.action.ViewActions.swipeLeft;
import static android.support.test.espresso.action.ViewActions.swipeRight;
import static android.support.test.espresso.action.ViewActions.swipeUp;
import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.hamcrest.Matchers.allOf;


/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {
    private static final String LOG_TAG = "detox";

    private DetoxAction() {
        // static class
    }

    public static ViewAction multiClick(int times) {
        return actionWithAssertions(new GeneralClickAction(new MultiTap(times), GeneralLocation.CENTER, Press.FINGER, 0, 0));
    }

    public static ViewAction tapAtLocation(final int x, final int y) {
        final int px = UiAutomatorHelper.convertDiptoPix(x);
        final int py = UiAutomatorHelper.convertDiptoPix(y);
        CoordinatesProvider c = new CoordinatesProvider() {
            @Override
            public float[] calculateCoordinates(View view) {
                final int[] xy = new int[2];
                view.getLocationOnScreen(xy);
                final float fx = xy[0] + px;
                final float fy = xy[1] + py;
                float[] coordinates = {fx, fy};
                return coordinates;
            }
        };
        return actionWithAssertions(new GeneralClickAction(
                Tap.SINGLE, c, Press.FINGER, InputDevice.SOURCE_UNKNOWN, MotionEvent.BUTTON_PRIMARY));
    }

    /**
     * Scrolls to the edge of the given scrollable view.
     *
     * Edge
     * 1 -> Left
     * 2 -> Right
     * 3 -> Top
     * 4 -> Bottom
     *
     * @param edge
     * @return ViewAction
     */
    public static ViewAction scrollToEdge(final int edge) {
        return actionWithAssertions(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
            }

            @Override
            public String getDescription() {
                return "scrollToEdge";
            }

            @Override
            public void perform(UiController uiController, View view) {
                Class<?> recyclerViewClass = null;
                try {
                    recyclerViewClass = Class.forName(RecyclerViewScrollListener.CLASS_RECYCLERVIEW);
                } catch (ClassNotFoundException e) {
                    // ok
                }
                if (view instanceof AbsListView) {
                    RNScrollListener l = new RNScrollListener((AbsListView) view);
                    do {
                        ScrollHelper.performOnce(uiController, view, edge);
                    } while (l.didScroll());
                    l.cleanup();
                } else if (view instanceof ScrollView) {
                    int prevScrollY = view.getScrollY();
                    while (true) {
                        ScrollHelper.performOnce(uiController, view, edge);
                        int currentScrollY = view.getScrollY();
                        if (currentScrollY == prevScrollY) break;
                        prevScrollY = currentScrollY;
                    }
                } else if (view instanceof HorizontalScrollView) {
                    int prevScrollX = view.getScrollX();
                    while (true) {
                        ScrollHelper.performOnce(uiController, view, edge);
                        int currentScrollX = view.getScrollX();
                        if (currentScrollX == prevScrollX) break;
                        prevScrollX = currentScrollX;
                    }
                } else if (recyclerViewClass != null && recyclerViewClass.isInstance(view)) {
                    RecyclerViewScrollListener l = new RecyclerViewScrollListener(view);
                    do {
                        ScrollHelper.performOnce(uiController, view, edge);
                    } while (l.didScroll());
                    l.cleanup();
                } else {
                    throw new RuntimeException(
                            "Only descendants of AbsListView, ScrollView, HorizontalScrollView and RecyclerView are supported");
                }
            }
        });
    }

    /**
     * Scrolls the View in a direction by the Density Independent Pixel amount.
     *
     * Direction
     * 1 -> left
     * 2 -> Right
     * 3 -> Up
     * 4 -> Down
     *
     * @param direction Direction to scroll
     * @param amountInDP Density Independent Pixels
     *
     */
    public static ViewAction scrollInDirection(final int direction, final double amountInDP) {
        return actionWithAssertions(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
            }

            @Override
            public String getDescription() {
                return "scrollInDirection";
            }

            @Override
            public void perform(UiController uiController, View view) {
                ScrollHelper.perform(uiController, view, direction, amountInDP);
            }
        });
    }

    private final static float EDGE_FUZZ_FACTOR = 0.083f;

    /**
     * Swipes the View in a direction.
     *
     * Direction
     * 1 -> left
     * 2 -> Right
     * 3 -> Up
     * 4 -> Down
     *
     * @param direction Direction to scroll
     * @param fast true if fast, false if slow
     *
     */
    public static ViewAction swipeInDirection(final int direction, boolean fast) {
        if (fast) {
            switch (direction) {
                case 1:
                    return swipeLeft();
                case 2:
                    return swipeRight();
                case 3:
                    return swipeUp();
                case 4:
                    return swipeDown();
                default:
                    throw new RuntimeException("Unsupported swipe direction: " + direction);
            }
        }
        switch (direction) {
            case 1:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.CENTER_RIGHT, -EDGE_FUZZ_FACTOR, 0),
                        GeneralLocation.CENTER_LEFT, Press.FINGER));
            case 2:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.CENTER_LEFT, EDGE_FUZZ_FACTOR, 0),
                        GeneralLocation.CENTER_RIGHT, Press.FINGER));
            case 3:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.BOTTOM_CENTER, 0, -EDGE_FUZZ_FACTOR),
                        GeneralLocation.TOP_CENTER, Press.FINGER));
            case 4:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.TOP_CENTER, 0, EDGE_FUZZ_FACTOR),
                        GeneralLocation.BOTTOM_CENTER, Press.FINGER));
            default:
                throw new RuntimeException("Unsupported swipe direction: " + direction);
        }
    }

    private static CoordinatesProvider translate(final CoordinatesProvider coords,
                                                 final float dx, final float dy) {
        return new CoordinatesProvider() {
            @Override
            public float[] calculateCoordinates(View view) {
                float xy[] = coords.calculateCoordinates(view);
                xy[0] += dx * view.getWidth();
                xy[1] += dy * view.getHeight();
                return xy;
            }
        };
    }

}
