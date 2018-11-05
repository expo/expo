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

import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;

/**
 * Immutable class for describing width and height dimensions in pixels.
 */
public class Size implements Comparable<Size>, Parcelable {

    private final int mWidth;
    private final int mHeight;

    /**
     * Create a new immutable Size instance.
     *
     * @param width  The width of the size, in pixels
     * @param height The height of the size, in pixels
     */
    public Size(int width, int height) {
        mWidth = width;
        mHeight = height;
    }

    public static Size parse(String s) {
        int position = s.indexOf('x');
        if (position == -1) {
            throw new IllegalArgumentException("Malformed size: " + s);
        }
        try {
            int width = Integer.parseInt(s.substring(0, position));
            int height = Integer.parseInt(s.substring(position + 1));
            return new Size(width, height);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Malformed size: " + s, e);
        }
    }

    public int getWidth() {
        return mWidth;
    }

    public int getHeight() {
        return mHeight;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null) {
            return false;
        }
        if (this == o) {
            return true;
        }
        if (o instanceof Size) {
            Size size = (Size) o;
            return mWidth == size.mWidth && mHeight == size.mHeight;
        }
        return false;
    }

    @Override
    public String toString() {
        return mWidth + "x" + mHeight;
    }

    @Override
    public int hashCode() {
        // assuming most sizes are <2^16, doing a rotate will give us perfect hashing
        return mHeight ^ ((mWidth << (Integer.SIZE / 2)) | (mWidth >>> (Integer.SIZE / 2)));
    }

    @Override
    public int compareTo(@NonNull Size another) {
        return mWidth * mHeight - another.mWidth * another.mHeight;
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(mWidth);
        dest.writeInt(mHeight);
    }

    public static final Parcelable.Creator<Size> CREATOR
            = new Parcelable.Creator<Size>() {

        @Override
        public Size createFromParcel(Parcel source) {
            int width = source.readInt();
            int height = source.readInt();
            return new Size(width, height);
        }

        @Override
        public Size[] newArray(int size) {
            return new Size[size];
        }
    };
}
