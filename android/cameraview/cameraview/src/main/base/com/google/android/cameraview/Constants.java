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

public interface Constants {

    AspectRatio DEFAULT_ASPECT_RATIO = AspectRatio.of(4, 3);

    int FACING_BACK = 0;
    int FACING_FRONT = 1;

    int FLASH_OFF = 0;
    int FLASH_ON = 1;
    int FLASH_TORCH = 2;
    int FLASH_AUTO = 3;
    int FLASH_RED_EYE = 4;

    int LANDSCAPE_90 = 90;
    int LANDSCAPE_270 = 270;

    int WB_AUTO = 0;
    int WB_CLOUDY = 1;
    int WB_SUNNY = 2;
    int WB_SHADOW = 3;
    int WB_FLUORESCENT = 4;
    int WB_INCANDESCENT = 5;

}
