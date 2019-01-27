package com.wix.detox.espresso;

import android.support.test.espresso.Espresso;
import android.support.test.espresso.EspressoException;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.view.View;

import junit.framework.AssertionFailedError;

import org.hamcrest.Matcher;
import org.hamcrest.Matchers;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.doesNotExist;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.hamcrest.Matchers.not;

/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAssertion {

    private DetoxAssertion() {
        // static class
    }

    public static ViewInteraction assertMatcher(ViewInteraction i, Matcher<View> m) {
        return i.check(matches(m));
    }

    public static ViewInteraction assertNotVisible(ViewInteraction i) {
        ViewInteraction ret;
        try {
            ret = i.check(doesNotExist());
            return ret;
        } catch (AssertionFailedError e) {
            ret = i.check(matches(not(isDisplayed())));
            return ret;
        }
    }

    public static ViewInteraction assertNotExists(ViewInteraction i) {
        return i.check(doesNotExist());
    }

    public static void waitForAssertMatcher(final ViewInteraction i, final Matcher<View> m, double timeoutSeconds) {
        long originTime = System.nanoTime();
        long currentTime;

        while (true) {
            currentTime = System.nanoTime();
            long elapsed = currentTime - originTime;
            double seconds = (double)elapsed / 1000000000.0;
            if (seconds >= timeoutSeconds) {
                return;
            }
            try {
                i.check(matches(m));
                break;
            } catch (Exception e) {
                if (e instanceof EspressoException) {
                    UiAutomatorHelper.espressoSync();
                } else {
                    throw e;
                }
            }
        }
    }

    public static void waitForAssertMatcherWithSearchAction(
            final ViewInteraction i,
            final Matcher<View> m,
            final ViewAction searchAction,
            final Matcher<View> searchMatcher) {

        while (true) {
            try {
                i.check(matches(m));
                break;
            } catch (Exception e) {
                if (e instanceof EspressoException) {
                    onView(searchMatcher).perform(searchAction);
                } else {
                    throw e;
                }
            }
        }
    }
}
