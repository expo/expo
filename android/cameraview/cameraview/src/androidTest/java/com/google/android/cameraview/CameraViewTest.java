/*
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.android.cameraview;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.Espresso.registerIdlingResources;
import static android.support.test.espresso.Espresso.unregisterIdlingResources;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.assertThat;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withId;

import static com.google.android.cameraview.AspectRatioIsCloseTo.closeToOrInverse;
import static com.google.android.cameraview.CameraViewActions.setAspectRatio;
import static com.google.android.cameraview.CameraViewMatchers.hasAspectRatio;

import static junit.framework.Assert.assertFalse;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import android.graphics.Bitmap;
import android.os.SystemClock;
import android.support.test.espresso.IdlingResource;
import android.support.test.espresso.NoMatchingViewException;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewAssertion;
import android.support.test.filters.FlakyTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.cameraview.test.R;

import org.hamcrest.Matcher;
import org.hamcrest.core.IsAnything;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.Closeable;
import java.io.IOException;
import java.util.Set;

@RunWith(AndroidJUnit4.class)
public class CameraViewTest {

    @Rule
    public final ActivityTestRule<CameraViewActivity> rule;

    private CameraViewIdlingResource mCameraViewIdlingResource;

    public CameraViewTest() {
        rule = new ActivityTestRule<>(CameraViewActivity.class);
    }

    @Before
    public void setUpIdlingResource() {
        mCameraViewIdlingResource = new CameraViewIdlingResource(
                (CameraView) rule.getActivity().findViewById(R.id.camera));
        registerIdlingResources(mCameraViewIdlingResource);
    }

    @After
    public void tearDownIdlingResource() throws Exception {
        unregisterIdlingResources(mCameraViewIdlingResource);
        mCameraViewIdlingResource.close();
    }

    @Test
    public void testSetup() {
        onView(withId(R.id.camera))
                .check(matches(isDisplayed()));
        try {
            onView(withId(R.id.texture_view))
                    .check(matches(isDisplayed()));
        } catch (NoMatchingViewException e) {
            onView(withId(R.id.surface_view))
                    .check(matches(isDisplayed()));
        }
    }

    @Test
    @FlakyTest
    public void preview_isShowing() throws Exception {
        onView(withId(R.id.camera))
                .perform(waitFor(1000))
                .check(showingPreview());
    }

    @Test
    public void testAspectRatio() {
        final CameraView cameraView = (CameraView) rule.getActivity().findViewById(R.id.camera);
        final Set<AspectRatio> ratios = cameraView.getSupportedAspectRatios();
        for (AspectRatio ratio : ratios) {
            onView(withId(R.id.camera))
                    .perform(setAspectRatio(ratio))
                    .check(matches(hasAspectRatio(ratio)));
        }
    }

    @Test
    public void testAdjustViewBounds() {
        onView(withId(R.id.camera))
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        assertThat(cameraView.getAdjustViewBounds(), is(false));
                        cameraView.setAdjustViewBounds(true);
                        assertThat(cameraView.getAdjustViewBounds(), is(true));
                    }
                })
                .perform(new AnythingAction("layout") {
                    @Override
                    public void perform(UiController uiController, View view) {
                        ViewGroup.LayoutParams params = view.getLayoutParams();
                        params.height = ViewGroup.LayoutParams.WRAP_CONTENT;
                        view.setLayoutParams(params);
                    }
                })
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        AspectRatio cameraRatio = cameraView.getAspectRatio();
                        AspectRatio viewRatio = AspectRatio.of(view.getWidth(), view.getHeight());
                        assertThat(cameraRatio, is(closeToOrInverse(viewRatio)));
                    }
                });
    }

    @Test
    public void testPreviewViewSize() {
        onView(withId(R.id.camera))
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        View preview = view.findViewById(R.id.texture_view);
                        if (preview == null) {
                            preview = view.findViewById(R.id.surface_view);
                        }
                        AspectRatio cameraRatio = cameraView.getAspectRatio();
                        assert cameraRatio != null;
                        AspectRatio textureRatio = AspectRatio.of(
                                preview.getWidth(), preview.getHeight());
                        assertThat(textureRatio, is(closeToOrInverse(cameraRatio)));
                    }
                });
    }

    @Test
    public void testAutoFocus() {
        onView(withId(R.id.camera))
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        // This can fail on devices without auto-focus support
                        assertThat(cameraView.getAutoFocus(), is(true));
                        cameraView.setAutoFocus(false);
                        assertThat(cameraView.getAutoFocus(), is(false));
                        cameraView.setAutoFocus(true);
                        assertThat(cameraView.getAutoFocus(), is(true));
                    }
                });
    }

    @Test
    public void testFacing() {
        onView(withId(R.id.camera))
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        assertThat(cameraView.getFacing(), is(CameraView.FACING_BACK));
                        cameraView.setFacing(CameraView.FACING_FRONT);
                        assertThat(cameraView.getFacing(), is(CameraView.FACING_FRONT));
                    }
                })
                .perform(waitFor(1000))
                .check(showingPreview());
    }

    @Test
    public void testFlash() {
        onView(withId(R.id.camera))
                .check(new ViewAssertion() {
                    @Override
                    public void check(View view, NoMatchingViewException noViewFoundException) {
                        CameraView cameraView = (CameraView) view;
                        assertThat(cameraView.getFlash(), is(CameraView.FLASH_AUTO));
                        cameraView.setFlash(CameraView.FLASH_TORCH);
                        assertThat(cameraView.getFlash(), is(CameraView.FLASH_TORCH));
                    }
                });
    }

    @Test
    public void testTakePicture() throws Exception {
        TakePictureIdlingResource resource = new TakePictureIdlingResource(
                (CameraView) rule.getActivity().findViewById(R.id.camera));
        onView(withId(R.id.camera))
                .perform(new AnythingAction("take picture") {
                    @Override
                    public void perform(UiController uiController, View view) {
                        CameraView cameraView = (CameraView) view;
                        cameraView.takePicture();
                    }
                });
        try {
            registerIdlingResources(resource);
            onView(withId(R.id.camera))
                    .perform(waitFor(1000))
                    .check(showingPreview());
            assertThat("Didn't receive valid JPEG data.", resource.receivedValidJpeg(), is(true));
        } finally {
            unregisterIdlingResources(resource);
            resource.close();
        }
    }

    private static ViewAction waitFor(final long ms) {
        return new AnythingAction("wait") {
            @Override
            public void perform(UiController uiController, View view) {
                SystemClock.sleep(ms);
            }
        };
    }

    private static ViewAssertion showingPreview() {
        return new ViewAssertion() {
            @Override
            public void check(View view, NoMatchingViewException noViewFoundException) {
                if (android.os.Build.VERSION.SDK_INT < 14) {
                    return;
                }
                CameraView cameraView = (CameraView) view;
                TextureView textureView = (TextureView) cameraView.findViewById(R.id.texture_view);
                Bitmap bitmap = textureView.getBitmap();
                int topLeft = bitmap.getPixel(0, 0);
                int center = bitmap.getPixel(bitmap.getWidth() / 2, bitmap.getHeight() / 2);
                int bottomRight = bitmap.getPixel(
                        bitmap.getWidth() - 1, bitmap.getHeight() - 1);
                assertFalse("Preview possibly blank: " + Integer.toHexString(topLeft),
                        topLeft == center && center == bottomRight);
            }
        };
    }

    /**
     * Wait for a camera to open.
     */
    private static class CameraViewIdlingResource implements IdlingResource, Closeable {

        private final CameraView.Callback mCallback
                = new CameraView.Callback() {

            @Override
            public void onCameraOpened(CameraView cameraView) {
                if (!mIsIdleNow) {
                    mIsIdleNow = true;
                    if (mResourceCallback != null) {
                        mResourceCallback.onTransitionToIdle();
                    }
                }
            }

            @Override
            public void onCameraClosed(CameraView cameraView) {
                mIsIdleNow = false;
            }
        };

        private final CameraView mCameraView;

        private ResourceCallback mResourceCallback;

        private boolean mIsIdleNow;

        public CameraViewIdlingResource(CameraView cameraView) {
            mCameraView = cameraView;
            mCameraView.addCallback(mCallback);
            mIsIdleNow = mCameraView.isCameraOpened();
        }

        @Override
        public void close() throws IOException {
            mCameraView.removeCallback(mCallback);
        }

        @Override
        public String getName() {
            return CameraViewIdlingResource.class.getSimpleName();
        }

        @Override
        public boolean isIdleNow() {
            return mIsIdleNow;
        }

        @Override
        public void registerIdleTransitionCallback(ResourceCallback callback) {
            mResourceCallback = callback;
        }

    }

    private static class TakePictureIdlingResource implements IdlingResource, Closeable {

        private final CameraView.Callback mCallback
                = new CameraView.Callback() {
            @Override
            public void onPictureTaken(CameraView cameraView, byte[] data) {
                if (!mIsIdleNow) {
                    mIsIdleNow = true;
                    mValidJpeg = data.length > 2 &&
                            data[0] == (byte) 0xFF && data[1] == (byte) 0xD8;
                    if (mResourceCallback != null) {
                        mResourceCallback.onTransitionToIdle();
                    }
                }
            }
        };

        private final CameraView mCameraView;

        private ResourceCallback mResourceCallback;

        private boolean mIsIdleNow;

        private boolean mValidJpeg;

        public TakePictureIdlingResource(CameraView cameraView) {
            mCameraView = cameraView;
            mCameraView.addCallback(mCallback);
        }

        @Override
        public void close() throws IOException {
            mCameraView.removeCallback(mCallback);
        }

        @Override
        public String getName() {
            return TakePictureIdlingResource.class.getSimpleName();
        }

        @Override
        public boolean isIdleNow() {
            return mIsIdleNow;
        }

        @Override
        public void registerIdleTransitionCallback(ResourceCallback callback) {
            mResourceCallback = callback;
        }

        public boolean receivedValidJpeg() {
            return mValidJpeg;
        }

    }

    private static abstract class AnythingAction implements ViewAction {

        private final String mDescription;

        public AnythingAction(String description) {
            mDescription = description;
        }

        @Override
        public Matcher<View> getConstraints() {
            return new IsAnything<>();
        }

        @Override
        public String getDescription() {
            return mDescription;
        }

    }

}
