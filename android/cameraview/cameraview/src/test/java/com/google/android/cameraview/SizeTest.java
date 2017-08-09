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

import java.util.HashSet;

public class SizeTest {

    @Test
    public void testGetters() {
        Size size = new Size(1, 2);
        assertThat(size.getWidth(), is(1));
        assertThat(size.getHeight(), is(2));
    }

    @Test
    public void testToString() {
        Size size = new Size(1, 2);
        assertThat(size.toString(), is("1x2"));
    }

    @Test
    public void testEquals() {
        Size a = new Size(1, 2);
        Size b = new Size(1, 2);
        Size c = new Size(3, 4);
        assertThat(a.equals(b), is(true));
        assertThat(a.equals(c), is(false));
    }

    @Test
    public void testHashCode() {
        int max = 100;
        HashSet<Integer> codes = new HashSet<>();
        for (int x = 1; x <= max; x++) {
            for (int y = 1; y <= max; y++) {
                codes.add(new Size(x, y).hashCode());
            }
        }
        assertThat(codes.size(), is(max * max));
    }

}
