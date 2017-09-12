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

public class AspectRatioTest {

    @Test
    public void testGcd() {
        AspectRatio r;
        r = AspectRatio.of(1, 2);
        assertThat(r.getX(), is(1));
        r = AspectRatio.of(2, 4);
        assertThat(r.getX(), is(1));
        assertThat(r.getY(), is(2));
        r = AspectRatio.of(391, 713);
        assertThat(r.getX(), is(17));
        assertThat(r.getY(), is(31));
    }

    @Test
    public void testMatches() {
        AspectRatio ratio = AspectRatio.of(3, 4);
        assertThat(ratio.matches(new Size(6, 8)), is(true));
        assertThat(ratio.matches(new Size(1, 2)), is(false));
    }

    @Test
    public void testGetters() {
        AspectRatio ratio = AspectRatio.of(2, 4); // Reduced to 1:2
        assertThat(ratio.getX(), is(1));
        assertThat(ratio.getY(), is(2));
    }

    @Test
    public void testToString() {
        AspectRatio ratio = AspectRatio.of(1, 2);
        assertThat(ratio.toString(), is("1:2"));
    }

    @Test
    public void testEquals() {
        AspectRatio a = AspectRatio.of(1, 2);
        AspectRatio b = AspectRatio.of(2, 4);
        AspectRatio c = AspectRatio.of(2, 3);
        assertThat(a.equals(b), is(true));
        assertThat(a.equals(c), is(false));
    }

    @Test
    public void testHashCode() {
        int max = 100;
        HashSet<Integer> codes = new HashSet<>();
        for (int x = 1; x <= 100; x++) {
            codes.add(AspectRatio.of(x, 1).hashCode());
        }
        assertThat(codes.size(), is(max));
        codes.clear();
        for (int y = 1; y <= 100; y++) {
            codes.add(AspectRatio.of(1, y).hashCode());
        }
        assertThat(codes.size(), is(max));
    }

    @Test
    public void testInverse() {
        AspectRatio r = AspectRatio.of(4, 3);
        assertThat(r.getX(), is(4));
        assertThat(r.getY(), is(3));
        AspectRatio s = r.inverse();
        assertThat(s.getX(), is(3));
        assertThat(s.getY(), is(4));
    }

    @Test
    public void testParse() {
        AspectRatio r = AspectRatio.parse("23:31");
        assertThat(r.getX(), is(23));
        assertThat(r.getY(), is(31));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testParseFailure() {
        AspectRatio.parse("MALFORMED");
    }

}
