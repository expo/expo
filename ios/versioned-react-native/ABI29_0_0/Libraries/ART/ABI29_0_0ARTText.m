/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0ARTText.h"

#import <CoreText/CoreText.h>

@implementation ABI29_0_0ARTText

- (void)setAlignment:(CTTextAlignment)alignment
{
  [self invalidate];
  _alignment = alignment;
}

static void ABI29_0_0ARTFreeTextFrame(ABI29_0_0ARTTextFrame frame)
{
  if (frame.count) {
    // We must release each line before freeing up this struct
    for (int i = 0; i < frame.count; i++) {
      CFRelease(frame.lines[i]);
    }
    free(frame.lines);
    free(frame.widths);
  }
}

- (void)setTextFrame:(ABI29_0_0ARTTextFrame)frame
{
  if (frame.lines != _textFrame.lines) {
    ABI29_0_0ARTFreeTextFrame(_textFrame);
  }
  [self invalidate];
  _textFrame = frame;
}

- (void)dealloc
{
  ABI29_0_0ARTFreeTextFrame(_textFrame);
}

- (void)renderLayerTo:(CGContextRef)context
{
  ABI29_0_0ARTTextFrame frame = self.textFrame;

  if ((!self.fill && !self.stroke) || !frame.count) {
    return;
  }

  // to-do: draw along a path

  CGTextDrawingMode mode = kCGTextStroke;
  if (self.fill) {
    if ([self.fill applyFillColor:context]) {
      mode = kCGTextFill;
    } else {

      for (int i = 0; i < frame.count; i++) {
        CGContextSaveGState(context);
        // Inverse the coordinate space since CoreText assumes a bottom-up coordinate space
        CGContextScaleCTM(context, 1.0, -1.0);
        CGContextSetTextDrawingMode(context, kCGTextClip);
        [self renderLineTo:context atIndex:i];
        // Inverse the coordinate space back to the original before filling
        CGContextScaleCTM(context, 1.0, -1.0);
        [self.fill paint:context];
        // Restore the state so that the next line can be clipped separately
        CGContextRestoreGState(context);
      }

      if (!self.stroke) {
        return;
      }
    }
  }
  if (self.stroke) {
    CGContextSetStrokeColorWithColor(context, self.stroke);
    CGContextSetLineWidth(context, self.strokeWidth);
    CGContextSetLineCap(context, self.strokeCap);
    CGContextSetLineJoin(context, self.strokeJoin);
    ABI29_0_0ARTCGFloatArray dash = self.strokeDash;
    if (dash.count) {
      CGContextSetLineDash(context, 0, dash.array, dash.count);
    }
    if (mode == kCGTextFill) {
      mode = kCGTextFillStroke;
    }
  }

  CGContextSetTextDrawingMode(context, mode);

  // Inverse the coordinate space since CoreText assumes a bottom-up coordinate space
  CGContextScaleCTM(context, 1.0, -1.0);
  for (int i = 0; i < frame.count; i++) {
    [self renderLineTo:context atIndex:i];
  }
}

- (void)renderLineTo:(CGContextRef)context atIndex:(int)index
{
  ABI29_0_0ARTTextFrame frame = self.textFrame;
  CGFloat shift;
  switch (self.alignment) {
    case kCTTextAlignmentRight:
      shift = frame.widths[index];
      break;
    case kCTTextAlignmentCenter:
      shift = (frame.widths[index] / 2);
      break;
    default:
      shift = 0;
      break;
  }
  // We should consider snapping this shift to device pixels to improve rendering quality
  // when a line has subpixel width.
  CGContextSetTextPosition(context, -shift, -frame.baseLine - frame.lineHeight * index);
  CTLineRef line = frame.lines[index];
  CTLineDraw(line, context);
}

@end
