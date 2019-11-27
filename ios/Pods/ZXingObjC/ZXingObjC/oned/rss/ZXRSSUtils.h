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

@class ZXIntArray;

/**
 * Adapted from listings in ISO/IEC 24724 Appendix B and Appendix G.
 */
@interface ZXRSSUtils : NSObject

//+ (NSArray *)rssWidths:(int)val n:(int)n elements:(int)elements maxWidth:(int)maxWidth noNarrow:(BOOL)noNarrow;
+ (int)rssValue:(ZXIntArray *)widths maxWidth:(int)maxWidth noNarrow:(BOOL)noNarrow;
//+ (NSArray *)elements:(NSArray *)eDist N:(int)N K:(int)K;

@end
