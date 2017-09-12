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

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

public class SizeMapTest {

    @Test
    public void testAdd_simple() {
        SizeMap map = new SizeMap();
        map.add(new Size(3, 4));
        map.add(new Size(9, 16));
        assertThat(map.ratios().size(), is(2));
    }

    @Test
    public void testAdd_duplicate() {
        SizeMap map = new SizeMap();
        map.add(new Size(3, 4));
        map.add(new Size(6, 8));
        map.add(new Size(9, 12));
        assertThat(map.ratios().size(), is(1));
        AspectRatio ratio = (AspectRatio) map.ratios().toArray()[0];
        assertThat(ratio.toString(), is("3:4"));
        assertThat(map.sizes(ratio).size(), is(3));
    }

    @Test
    public void testClear() {
        SizeMap map = new SizeMap();
        map.add(new Size(12, 34));
        assertThat(map.ratios().size(), is(1));
        map.clear();
        assertThat(map.ratios().size(), is(0));
    }

}
