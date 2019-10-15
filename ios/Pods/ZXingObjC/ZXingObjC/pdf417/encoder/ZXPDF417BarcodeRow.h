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

@class ZXByteArray;

@interface ZXPDF417BarcodeRow : NSObject

@property (nonatomic, strong, readonly) ZXByteArray *row;

/**
 * Creates a Barcode row of the width
 */
+ (ZXPDF417BarcodeRow *)barcodeRowWithWidth:(int)width;

- (id)initWithWidth:(int)width;

/**
 * Sets a specific location in the bar
 *
 * @param x The location in the bar
 * @param value Black if true, white if false;
 */
- (void)setX:(int)x value:(int8_t)value;

/**
 * Sets a specific location in the bar
 *
 * @param x The location in the bar
 * @param black Black if true, white if false;
 */
- (void)setX:(int)x black:(BOOL)black;

/**
 * @param black A boolean which is true if the bar black false if it is white
 * @param width How many spots wide the bar is.
 */
- (void)addBar:(BOOL)black width:(int)width;

/**
 * This function scales the row
 *
 * @param scale How much you want the image to be scaled, must be greater than or equal to 1.
 * @return the scaled row
 */
- (ZXByteArray *)scaledRow:(int)scale;

@end
