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

import static junit.framework.Assert.assertNotNull;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.sameInstance;
import static org.hamcrest.core.Is.is;

import android.os.Parcel;
import android.support.test.runner.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;


@RunWith(AndroidJUnit4.class)
public class AspectRatioInstrumentationTest {

    @Test
    public void testParcel() {
        final AspectRatio original = AspectRatio.of(4, 3);
        final Parcel parcel = Parcel.obtain();
        try {
            parcel.writeParcelable(original, 0);
            parcel.setDataPosition(0);
            final AspectRatio restored = parcel.readParcelable(getClass().getClassLoader());
            assertNotNull(restored);
            assertThat(restored.getX(), is(4));
            assertThat(restored.getY(), is(3));
            // As the first instance is alive, the parceled result should still be the same instance
            assertThat(restored, is(sameInstance(original)));
        } finally {
            parcel.recycle();
        }
    }

}
