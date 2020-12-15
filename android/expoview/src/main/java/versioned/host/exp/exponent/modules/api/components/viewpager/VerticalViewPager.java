package versioned.host.exp.exponent.modules.api.components.viewpager;

import android.content.Context;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;

import androidx.viewpager.widget.ViewPager;

// Vertical ViewPager implement, original code from
// https://android.googlesource.com/platform/packages/apps/DeskClock/+/master/src/com/android/deskclock/VerticalViewPager.java
public class VerticalViewPager extends ViewPager {
    private boolean mVertical = false;
    private GestureDetector mGestureDetector;

    public VerticalViewPager(Context context) {
        super(context);
    }

    public void setOrientation(boolean vertical) {
        mVertical = vertical;
        if (!mVertical) return;

        // Make page transit vertical
        setPageTransformer(true, new VerticalPageTransformer());

        // Nested scroll issue, follow the link
        // https://stackoverflow.com/questions/46828920/vertical-viewpager-with-horizontalscrollview-inside-fragment
        mGestureDetector = new GestureDetector(getContext(), new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                return Math.abs(distanceY) > Math.abs(distanceX);
            }
        });
    }

    /**
     * @return {@code false} since a vertical view pager can never be scrolled horizontally
     */
    @Override
    public boolean canScrollHorizontally(int direction) {
        return !canScrollVertically(direction);
    }

    /**
     * @return {@code true} if a normal view pager would support horizontal scrolling at this time
     */
    @Override
    public boolean canScrollVertically(int direction) {
        return mVertical;
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        boolean result = super.onInterceptTouchEvent(flipXY(ev));
        // Return MotionEvent to normal
        flipXY(ev);

        if (mVertical) {
            if (mGestureDetector.onTouchEvent(ev)) {
                result = true;
            }
        }

        return result;
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        boolean result = super.onTouchEvent(flipXY(ev));
        // Return MotionEvent to normal
        flipXY(ev);

        if (mVertical) {
            if (mGestureDetector.onTouchEvent(ev)) {
                result = true;
            }
        }

        return result;
    }

    private MotionEvent flipXY(MotionEvent ev) {
        if (mVertical) {
            final float width = getWidth();
            final float height = getHeight();
            final float x = (ev.getY() / height) * width;
            final float y = (ev.getX() / width) * height;
            ev.setLocation(x, y);
        }
        return ev;
    }

    private static final class VerticalPageTransformer implements ViewPager.PageTransformer {
        @Override
        public void transformPage(View view, float position) {
            final int pageWidth = view.getWidth();
            final int pageHeight = view.getHeight();
            if (position < -1) {
                // This page is way off-screen to the left.
                view.setAlpha(0);
            } else if (position <= 1) {
                view.setAlpha(1);
                // Counteract the default slide transition
                view.setTranslationX(pageWidth * -position);
                // set Y position to swipe in from top
                float yPosition = position * pageHeight;
                view.setTranslationY(yPosition);
            } else {
                // This page is way off-screen to the right.
                view.setAlpha(0);
            }
        }
    }
}

