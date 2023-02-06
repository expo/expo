#import "ABI48_0_0RNSVGGlyphContext.h"
#import <ABI48_0_0React/ABI48_0_0RCTFont.h>
#import "ABI48_0_0RNSVGFontData.h"
#import "ABI48_0_0RNSVGNode.h"
#import "ABI48_0_0RNSVGPropHelper.h"
#import "ABI48_0_0RNSVGText.h"

// https://www.w3.org/TR/SVG/text.html#TSpanElement
@interface ABI48_0_0RNSVGGlyphContext () {
 @public
  // Current stack (one per node push/pop)
  NSMutableArray *mFontContext_;

  // Unique input attribute lists (only added if node sets a value)
  NSMutableArray<NSArray<ABI48_0_0RNSVGLength *> *> *mXsContext_;
  NSMutableArray<NSArray<ABI48_0_0RNSVGLength *> *> *mYsContext_;
  NSMutableArray<NSArray<ABI48_0_0RNSVGLength *> *> *mDXsContext_;
  NSMutableArray<NSArray<ABI48_0_0RNSVGLength *> *> *mDYsContext_;
  NSMutableArray<NSArray<ABI48_0_0RNSVGLength *> *> *mRsContext_;

  // Unique index into attribute list (one per unique list)
  NSMutableArray<NSNumber *> *mXIndices_;
  NSMutableArray<NSNumber *> *mYIndices_;
  NSMutableArray<NSNumber *> *mDXIndices_;
  NSMutableArray<NSNumber *> *mDYIndices_;
  NSMutableArray<NSNumber *> *mRIndices_;

  // Index of unique context used (one per node push/pop)
  NSMutableArray<NSNumber *> *mXsIndices_;
  NSMutableArray<NSNumber *> *mYsIndices_;
  NSMutableArray<NSNumber *> *mDXsIndices_;
  NSMutableArray<NSNumber *> *mDYsIndices_;
  NSMutableArray<NSNumber *> *mRsIndices_;

  // Calculated on push context, percentage and em length depends on parent font size
  CGFloat mFontSize_;
  ABI48_0_0RNSVGFontData *topFont_;

  // Current accumulated values
  // https://www.w3.org/TR/SVG/types.html#DataTypeCoordinate
  // <coordinate> syntax is the same as that for <length>
  CGFloat mX_;
  CGFloat mY_;

  // https://www.w3.org/TR/SVG/types.html#Length
  CGFloat mDX_;
  CGFloat mDY_;

  // Current <list-of-coordinates> SVGLengthList
  // https://www.w3.org/TR/SVG/types.html#InterfaceSVGLengthList
  // https://www.w3.org/TR/SVG/types.html#DataTypeCoordinates

  // https://www.w3.org/TR/SVG/text.html#TSpanElementXAttribute
  NSArray<ABI48_0_0RNSVGLength *> *mXs_;

  // https://www.w3.org/TR/SVG/text.html#TSpanElementYAttribute
  NSArray<ABI48_0_0RNSVGLength *> *mYs_;

  // Current <list-of-lengths> SVGLengthList
  // https://www.w3.org/TR/SVG/types.html#DataTypeLengths

  // https://www.w3.org/TR/SVG/text.html#TSpanElementDXAttribute
  NSArray<ABI48_0_0RNSVGLength *> *mDXs_;

  // https://www.w3.org/TR/SVG/text.html#TSpanElementDYAttribute
  NSArray<ABI48_0_0RNSVGLength *> *mDYs_;

  // Current <list-of-numbers> SVGLengthList
  // https://www.w3.org/TR/SVG/types.html#DataTypeNumbers

  // https://www.w3.org/TR/SVG/text.html#TSpanElementRotateAttribute
  NSArray<ABI48_0_0RNSVGLength *> *mRs_;

  // Current attribute list index
  long mXsIndex_;
  long mYsIndex_;
  long mDXsIndex_;
  long mDYsIndex_;
  long mRsIndex_;

  // Current value index in current attribute list
  long mXIndex_;
  long mYIndex_;
  long mDXIndex_;
  long mDYIndex_;
  long mRIndex_;

  // Top index of stack
  long mTop_;

  // Constructor parameters
  CGFloat mWidth_;
  CGFloat mHeight_;
}

- (void)pushContext:(ABI48_0_0RNSVGText *)node
               font:(NSDictionary *)font
                  x:(NSArray<ABI48_0_0RNSVGLength *> *)x
                  y:(NSArray<ABI48_0_0RNSVGLength *> *)y
             deltaX:(NSArray<ABI48_0_0RNSVGLength *> *)deltaX
             deltaY:(NSArray<ABI48_0_0RNSVGLength *> *)deltaY
             rotate:(NSArray<ABI48_0_0RNSVGLength *> *)rotate;

- (void)pushContext:(ABI48_0_0RNSVGGroup *)node font:(NSDictionary *)font;
@end

@implementation ABI48_0_0RNSVGGlyphContext

- (NSArray *)getFontContext
{
  return mFontContext_;
}

- (CTFontRef)getGlyphFont
{
  CGFloat size = topFont_->fontSize;
  NSString *fontFamily = topFont_->fontFamily;
  NSString *fontStyle = ABI48_0_0RNSVGFontStyleStrings[topFont_->fontStyle];
  NSString *fontWeight = ABI48_0_0RNSVGFontWeightStrings[topFont_->fontWeight];
  UIFont *font = [ABI48_0_0RCTFont updateFont:nil
                          withFamily:[fontFamily isEqualToString:@""] ? nil : fontFamily
                                size:@(isnan(size) ? 0 : size)
                              weight:fontWeight
                               style:fontStyle
                             variant:nil
                     scaleMultiplier:1.0];
  CTFontRef ref = (__bridge CTFontRef)font;

  double weight = topFont_->absoluteFontWeight;
  if (weight == 400) {
    return ref;
  }

  CFArrayRef cgAxes = CTFontCopyVariationAxes(ref);
  if (cgAxes == 0) {
    return ref;
  }
  CFIndex cgAxisCount = CFArrayGetCount(cgAxes);
  CFNumberRef wght_id = 0;

  for (CFIndex i = 0; i < cgAxisCount; ++i) {
    CFTypeRef cgAxis = CFArrayGetValueAtIndex(cgAxes, i);
    if (CFGetTypeID(cgAxis) != CFDictionaryGetTypeID()) {
      continue;
    }

    CFDictionaryRef cgAxisDict = (CFDictionaryRef)cgAxis;
    CFTypeRef axisName = CFDictionaryGetValue(cgAxisDict, kCTFontVariationAxisNameKey);

    if (!axisName || CFGetTypeID(axisName) != CFStringGetTypeID()) {
      continue;
    }
    CFStringRef axisNameString = (CFStringRef)axisName;
    NSString *axisNameNSString = (__bridge NSString *)(axisNameString);
    if (![@"Weight" isEqualToString:axisNameNSString] && ![@"Size" isEqualToString:axisNameNSString]) {
      continue;
    }

    CFTypeRef axisMinValue = CFDictionaryGetValue(cgAxisDict, kCTFontVariationAxisMinimumValueKey);
    if (axisMinValue && CFGetTypeID(axisMinValue) == CFNumberGetTypeID()) {
      CFNumberRef axisMinValueNumber = (CFNumberRef)axisMinValue;
      double axisMinValueDouble;
      if (CFNumberGetValue(axisMinValueNumber, kCFNumberDoubleType, &axisMinValueDouble)) {
        weight = fmax(axisMinValueDouble, weight);
      }
    }

    CFTypeRef axisMaxValue = CFDictionaryGetValue(cgAxisDict, kCTFontVariationAxisMaximumValueKey);
    if (axisMaxValue && CFGetTypeID(axisMaxValue) == CFNumberGetTypeID()) {
      CFNumberRef axisMaxValueNumber = (CFNumberRef)axisMaxValue;
      double axisMaxValueDouble;
      if (CFNumberGetValue(axisMaxValueNumber, kCFNumberDoubleType, &axisMaxValueDouble)) {
        weight = fmin(axisMaxValueDouble, weight);
      }
    }

    CFTypeRef axisId = CFDictionaryGetValue(cgAxisDict, kCTFontVariationAxisIdentifierKey);
    if (!axisId || CFGetTypeID(axisId) != CFNumberGetTypeID()) {
      continue;
    }
    wght_id = (CFNumberRef)axisId;
    break;
  }

  if (wght_id == 0) {
    return ref;
  }
  UIFontDescriptor *uifd = font.fontDescriptor;
  CTFontDescriptorRef ctfd = (__bridge CTFontDescriptorRef)(uifd);
  CTFontDescriptorRef newfd = CTFontDescriptorCreateCopyWithVariation(ctfd, wght_id, (CGFloat)weight);
  CTFontRef newfont = CTFontCreateCopyWithAttributes(ref, size, nil, newfd);

  CFRelease(newfd);

  return (CTFontRef)CFAutorelease(newfont);
}

- (void)pushIndices
{
  [self->mXsIndices_ addObject:[NSNumber numberWithLong:self->mXsIndex_]];
  [self->mYsIndices_ addObject:[NSNumber numberWithLong:self->mYsIndex_]];
  [self->mDXsIndices_ addObject:[NSNumber numberWithLong:self->mDXsIndex_]];
  [self->mDYsIndices_ addObject:[NSNumber numberWithLong:self->mDYsIndex_]];
  [self->mRsIndices_ addObject:[NSNumber numberWithLong:self->mRsIndex_]];
}

- (instancetype)initWithWidth:(CGFloat)width height:(CGFloat)height
{
  self = [super init];
  self->mFontContext_ = [[NSMutableArray alloc] init];
  self->mXsContext_ = [[NSMutableArray alloc] init];
  self->mYsContext_ = [[NSMutableArray alloc] init];
  self->mDXsContext_ = [[NSMutableArray alloc] init];
  self->mDYsContext_ = [[NSMutableArray alloc] init];
  self->mRsContext_ = [[NSMutableArray alloc] init];

  self->mXIndices_ = [[NSMutableArray alloc] init];
  self->mYIndices_ = [[NSMutableArray alloc] init];
  self->mDXIndices_ = [[NSMutableArray alloc] init];
  self->mDYIndices_ = [[NSMutableArray alloc] init];
  self->mRIndices_ = [[NSMutableArray alloc] init];

  self->mXsIndices_ = [[NSMutableArray alloc] init];
  self->mYsIndices_ = [[NSMutableArray alloc] init];
  self->mDXsIndices_ = [[NSMutableArray alloc] init];
  self->mDYsIndices_ = [[NSMutableArray alloc] init];
  self->mRsIndices_ = [[NSMutableArray alloc] init];

  self->mFontSize_ = ABI48_0_0RNSVGFontData_DEFAULT_FONT_SIZE;
  self->topFont_ = [ABI48_0_0RNSVGFontData Defaults];

  self->mXs_ = [[NSArray alloc] init];
  self->mYs_ = [[NSArray alloc] init];
  self->mDXs_ = [[NSArray alloc] init];
  self->mDYs_ = [[NSArray alloc] init];
  self->mRs_ = [[NSArray alloc] initWithObjects:[ABI48_0_0RNSVGLength lengthWithNumber:0], nil];

  self->mXIndex_ = -1;
  self->mYIndex_ = -1;
  self->mDXIndex_ = -1;
  self->mDYIndex_ = -1;
  self->mRIndex_ = -1;

  self->mWidth_ = width;
  self->mHeight_ = height;

  [self->mXsContext_ addObject:self->mXs_];
  [self->mYsContext_ addObject:self->mYs_];
  [self->mDXsContext_ addObject:self->mDXs_];
  [self->mDYsContext_ addObject:self->mDYs_];
  [self->mRsContext_ addObject:self->mRs_];

  [self->mXIndices_ addObject:[NSNumber numberWithLong:self->mXIndex_]];
  [self->mYIndices_ addObject:[NSNumber numberWithLong:self->mYIndex_]];
  [self->mDXIndices_ addObject:[NSNumber numberWithLong:self->mDXIndex_]];
  [self->mDYIndices_ addObject:[NSNumber numberWithLong:self->mDYIndex_]];
  [self->mRIndices_ addObject:[NSNumber numberWithLong:self->mRIndex_]];

  [self->mFontContext_ addObject:self->topFont_];
  [self pushIndices];
  return self;
}

- (ABI48_0_0RNSVGFontData *)getFont
{
  return topFont_;
}

- (ABI48_0_0RNSVGFontData *)getTopOrParentFont:(ABI48_0_0RNSVGGroup *)child
{
  if (self->mTop_ > 0) {
    return self->topFont_;
  } else {
    ABI48_0_0RNSVGGroup *parentRoot = [child getParentTextRoot];
    ABI48_0_0RNSVGFontData *Defaults = [ABI48_0_0RNSVGFontData Defaults];
    while (parentRoot != nil) {
      ABI48_0_0RNSVGFontData *map = [[parentRoot getGlyphContext] getFont];
      if (map != Defaults) {
        return map;
      }
      parentRoot = [parentRoot getParentTextRoot];
    }
    return Defaults;
  }
}

- (void)pushNode:(ABI48_0_0RNSVGGroup *)node andFont:(NSDictionary *)font
{
  ABI48_0_0RNSVGFontData *parent = [self getTopOrParentFont:node];
  self->mTop_++;
  if (font == nil) {
    [self->mFontContext_ addObject:parent];
    return;
  }
  ABI48_0_0RNSVGFontData *data = [ABI48_0_0RNSVGFontData initWithNSDictionary:font parent:parent];
  self->mFontSize_ = data->fontSize;
  [self->mFontContext_ addObject:data];
  self->topFont_ = data;
}

- (void)pushContext:(ABI48_0_0RNSVGGroup *)node font:(NSDictionary *)font
{
  [self pushNode:node andFont:font];
  [self pushIndices];
}

- (void)pushContext:(ABI48_0_0RNSVGText *)node
               font:(NSDictionary *)font
                  x:(NSArray<ABI48_0_0RNSVGLength *> *)x
                  y:(NSArray<ABI48_0_0RNSVGLength *> *)y
             deltaX:(NSArray<ABI48_0_0RNSVGLength *> *)deltaX
             deltaY:(NSArray<ABI48_0_0RNSVGLength *> *)deltaY
             rotate:(NSArray<ABI48_0_0RNSVGLength *> *)rotate
{
  [self pushNode:(ABI48_0_0RNSVGGroup *)node andFont:font];
  if (x != nil && [x count] != 0) {
    mXsIndex_++;
    mXIndex_ = -1;
    [mXIndices_ addObject:[NSNumber numberWithLong:mXIndex_]];
    mXs_ = x;
    [mXsContext_ addObject:mXs_];
  }
  if (y != nil && [y count] != 0) {
    mYsIndex_++;
    mYIndex_ = -1;
    [mYIndices_ addObject:[NSNumber numberWithLong:mYIndex_]];
    mYs_ = y;
    [mYsContext_ addObject:mYs_];
  }
  if (deltaX != nil && [deltaX count] != 0) {
    mDXsIndex_++;
    mDXIndex_ = -1;
    [mDXIndices_ addObject:[NSNumber numberWithLong:mDXIndex_]];
    mDXs_ = deltaX;
    [mDXsContext_ addObject:mDXs_];
  }
  if (deltaY != nil && [deltaY count] != 0) {
    mDYsIndex_++;
    mDYIndex_ = -1;
    [mDYIndices_ addObject:[NSNumber numberWithLong:mDYIndex_]];
    mDYs_ = deltaY;
    [mDYsContext_ addObject:mDYs_];
  }
  if (rotate != nil && [rotate count] != 0) {
    mRsIndex_++;
    mRIndex_ = -1;
    [mRIndices_ addObject:[NSNumber numberWithLong:mRIndex_]];
    mRs_ = rotate;
    [mRsContext_ addObject:mRs_];
  }
  [self pushIndices];
}

- (void)popContext
{
  [mFontContext_ removeLastObject];
  [mXsIndices_ removeLastObject];
  [mYsIndices_ removeLastObject];
  [mDXsIndices_ removeLastObject];
  [mDYsIndices_ removeLastObject];
  [mRsIndices_ removeLastObject];

  mTop_--;

  long x = mXsIndex_;
  long y = mYsIndex_;
  long dx = mDXsIndex_;
  long dy = mDYsIndex_;
  long r = mRsIndex_;

  topFont_ = [mFontContext_ lastObject];

  mXsIndex_ = [[mXsIndices_ lastObject] longValue];
  mYsIndex_ = [[mYsIndices_ lastObject] longValue];
  mDXsIndex_ = [[mDXsIndices_ lastObject] longValue];
  mDYsIndex_ = [[mDYsIndices_ lastObject] longValue];
  mRsIndex_ = [[mRsIndices_ lastObject] longValue];

  if (x != mXsIndex_) {
    [mXsContext_ removeObjectAtIndex:x];
    mXs_ = [mXsContext_ objectAtIndex:mXsIndex_];
    mXIndex_ = [[mXIndices_ objectAtIndex:mXsIndex_] longValue];
  }
  if (y != mYsIndex_) {
    [mYsContext_ removeObjectAtIndex:y];
    mYs_ = [mYsContext_ objectAtIndex:mYsIndex_];
    mYIndex_ = [[mYIndices_ objectAtIndex:mYsIndex_] longValue];
  }
  if (dx != mDXsIndex_) {
    [mDXsContext_ removeObjectAtIndex:dx];
    mDXs_ = [mDXsContext_ objectAtIndex:mDXsIndex_];
    mDXIndex_ = [[mDXIndices_ objectAtIndex:mDXsIndex_] longValue];
  }
  if (dy != mDYsIndex_) {
    [mDYsContext_ removeObjectAtIndex:dy];
    mDYs_ = [mDYsContext_ objectAtIndex:mDYsIndex_];
    mDYIndex_ = [[mDYIndices_ objectAtIndex:mDYsIndex_] longValue];
  }
  if (r != mRsIndex_) {
    [mRsContext_ removeObjectAtIndex:r];
    mRs_ = [mRsContext_ objectAtIndex:mRsIndex_];
    mRIndex_ = [[mRIndices_ objectAtIndex:mRsIndex_] longValue];
  }
}

+ (void)incrementIndices:(NSMutableArray *)indices topIndex:(long)topIndex
{
  for (long index = topIndex; index >= 0; index--) {
    long xIndex = [[indices objectAtIndex:index] longValue];
    [indices setObject:[NSNumber numberWithLong:xIndex + 1] atIndexedSubscript:index];
  }
}

// https://www.w3.org/TR/SVG11/text.html#FontSizeProperty

/**
 * Get font size from context.
 * <p>
 * ‘font-size’
 * Value:       < absolute-size > | < relative-size > | < length > | < percentage > | inherit
 * Initial:     medium
 * Applies to:  text content elements
 * Inherited:   yes, the computed value is inherited
 * Percentages: refer to parent element's font size
 * Media:       visual
 * Animatable:  yes
 * <p>
 * This property refers to the size of the font from baseline to
 * baseline when multiple lines of text are set solid in a multiline
 * layout environment.
 * <p>
 * For SVG, if a < length > is provided without a unit identifier
 * (e.g., an unqualified number such as 128), the SVG user agent
 * processes the < length > as a height value in the current user
 * coordinate system.
 * <p>
 * If a < length > is provided with one of the unit identifiers
 * (e.g., 12pt or 10%), then the SVG user agent converts the
 * < length > into a corresponding value in the current user
 * coordinate system by applying the rules described in Units.
 * <p>
 * Except for any additional information provided in this specification,
 * the normative definition of the property is in CSS2 ([CSS2], section 15.2.4).
 */
- (CGFloat)getFontSize
{
  return mFontSize_;
}

- (CGFloat)nextXWithDouble:(CGFloat)advance
{
  [ABI48_0_0RNSVGGlyphContext incrementIndices:mXIndices_ topIndex:mXsIndex_];
  long nextIndex = mXIndex_ + 1;
  if (nextIndex < [mXs_ count]) {
    mDX_ = 0;
    mXIndex_ = nextIndex;
    ABI48_0_0RNSVGLength *length = [mXs_ objectAtIndex:nextIndex];
    mX_ = [ABI48_0_0RNSVGPropHelper fromRelative:length relative:mWidth_ fontSize:mFontSize_];
  }
  mX_ += advance;
  return mX_;
}

- (CGFloat)nextY
{
  [ABI48_0_0RNSVGGlyphContext incrementIndices:mYIndices_ topIndex:mYsIndex_];
  long nextIndex = mYIndex_ + 1;
  if (nextIndex < [mYs_ count]) {
    mDY_ = 0;
    mYIndex_ = nextIndex;
    ABI48_0_0RNSVGLength *length = [mYs_ objectAtIndex:nextIndex];
    mY_ = [ABI48_0_0RNSVGPropHelper fromRelative:length relative:mHeight_ fontSize:mFontSize_];
  }
  return mY_;
}

- (CGFloat)nextDeltaX
{
  [ABI48_0_0RNSVGGlyphContext incrementIndices:mDXIndices_ topIndex:mDXsIndex_];
  long nextIndex = mDXIndex_ + 1;
  if (nextIndex < [mDXs_ count]) {
    mDXIndex_ = nextIndex;
    ABI48_0_0RNSVGLength *length = [mDXs_ objectAtIndex:nextIndex];
    CGFloat val = [ABI48_0_0RNSVGPropHelper fromRelative:length relative:mWidth_ fontSize:mFontSize_];
    mDX_ += val;
  }
  return mDX_;
}

- (CGFloat)nextDeltaY
{
  [ABI48_0_0RNSVGGlyphContext incrementIndices:mDYIndices_ topIndex:mDYsIndex_];
  long nextIndex = mDYIndex_ + 1;
  if (nextIndex < [mDYs_ count]) {
    mDYIndex_ = nextIndex;
    ABI48_0_0RNSVGLength *length = [mDYs_ objectAtIndex:nextIndex];
    CGFloat val = [ABI48_0_0RNSVGPropHelper fromRelative:length relative:mHeight_ fontSize:mFontSize_];
    mDY_ += val;
  }
  return mDY_;
}

- (CGFloat)nextRotation
{
  [ABI48_0_0RNSVGGlyphContext incrementIndices:mRIndices_ topIndex:mRsIndex_];
  long nextIndex = mRIndex_ + 1;
  long count = [mRs_ count];
  if (nextIndex < count) {
    mRIndex_ = nextIndex;
  } else {
    mRIndex_ = count - 1;
  }
  return [mRs_[mRIndex_] value];
}

- (CGFloat)getWidth
{
  return mWidth_;
}

- (CGFloat)getHeight
{
  return mHeight_;
}
@end
