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

import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;

import android.support.annotation.NonNull;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.view.View;

import org.hamcrest.Matcher;

class CameraViewActions {

    static ViewAction setAspectRatio(@NonNull final AspectRatio ratio) {
        return new ViewAction() {

            @Override
            public Matcher<View> getConstraints() {
                return isAssignableFrom(CameraView.class);
            }

            @Override
            public String getDescription() {
                return "Set aspect ratio to " + ratio;
            }

            @Override
            public void perform(UiController controller, View view) {
                ((CameraView) view).setAspectRatio(ratio);
            }
        };
    }

}
