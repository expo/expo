/*
 * Copyright 2012 ZXing authors
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

#import "ZXLuminanceSource.h"

/**
 * This object extends LuminanceSource around an array of YUV data returned from the camera driver,
 * with the option to crop to a rectangle within the full data. This can be used to exclude
 * superfluous pixels around the perimeter and speed up decoding.
 *
 * It works for any pixel format where the Y channel is planar and appears first, including
 * YCbCr_420_SP and YCbCr_422_SP.
 */
@interface ZXPlanarYUVLuminanceSource : ZXLuminanceSource

/**
 * @return width of image from renderThumbnail
 */
@property (nonatomic, assign, readonly) int thumbnailWidth;

/**
 * @return height of image from renderThumbnail
 */
@property (nonatomic, assign, readonly) int thumbnailHeight;

- (id)initWithYuvData:(int8_t *)yuvData yuvDataLen:(int)yuvDataLen dataWidth:(int)dataWidth
           dataHeight:(int)dataHeight left:(int)left top:(int)top width:(int)width height:(int)height
    reverseHorizontal:(BOOL)reverseHorizontal;
- (int32_t *)renderThumbnail;

@end
