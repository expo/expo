//
//  ABI48_0_0RNSharedElementContent_m
//  ABI48_0_0React-native-shared-element
//

#import "ABI48_0_0RNSharedElementContent.h"

@implementation ABI48_0_0RNSharedElementContent
{
  // nop
}

- (instancetype)initWithData:(id) data type:(ABI48_0_0RNSharedElementContentType)type insets:(UIEdgeInsets)insets
{
  _data = data;
  _type = type;
  _insets = insets;
  return self;
}

+ (BOOL) isKindOfImageView:(UIView*) view
{
  NSString* className = NSStringFromClass(view.class);
  return (
          [view isKindOfClass:[UIImageView class]] ||
          [className isEqualToString:@"ABI48_0_0RCTImageView"] ||
          [className isEqualToString:@"ExpoImage.ImageView"]
          );
}

+ (UIImageView*) imageViewFromView:(UIView*) view
{
  if ([view isKindOfClass:[UIImageView class]]) {
    return (UIImageView*) view;
  } else if ([ABI48_0_0RNSharedElementContent isKindOfImageView:view]) {
    // Both ABI48_0_0React-native and expo-image have a UIImageView
    // as the first child.
    return (UIImageView*) view.subviews.firstObject;
  } else {
    // Error
    return nil;
  }
}

- (NSString*) typeName
{
  switch(_type) {
    case ABI48_0_0RNSharedElementContentTypeNone: return @"none";
    case ABI48_0_0RNSharedElementContentTypeRawImage: return @"image";
    case ABI48_0_0RNSharedElementContentTypeSnapshotView: return @"snapshotView";
    case ABI48_0_0RNSharedElementContentTypeSnapshotImage: return @"snapshotImage";
    default: return @"unknown";
  }
}

+ (CGSize) sizeForRect:(CGRect)layout content:(ABI48_0_0RNSharedElementContent*)content
{
  if (content == nil || content.data == nil) return layout.size;
  if (content.type != ABI48_0_0RNSharedElementContentTypeRawImage) return layout.size;
  CGSize size = layout.size;
  return [content.data isKindOfClass:[UIImage class]] ? ((UIImage*)content.data).size : size;
}

+ (CGRect) layoutForRect:(CGRect)layout content:(ABI48_0_0RNSharedElementContent*) content contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse
{
  if (content == nil || content.data == nil) return layout;
  if (content.type != ABI48_0_0RNSharedElementContentTypeRawImage) return layout;
  CGSize size = layout.size;
  size.width -= (content.insets.left + content.insets.right);
  size.height -= (content.insets.top + content.insets.bottom);
  CGSize contentSize = [ABI48_0_0RNSharedElementContent sizeForRect:layout content:content];
  CGFloat contentAspectRatio = (contentSize.width / contentSize.height);
  BOOL lo = (size.width / size.height) < contentAspectRatio;
  BOOL aspectRatioCriteria = reverse ? !lo : lo;
  switch (contentMode) {
    case UIViewContentModeScaleToFill: // stretch
      break;
    case UIViewContentModeScaleAspectFit: // contain
      if (aspectRatioCriteria) {
        size.height = size.width / contentAspectRatio;
      } else {
        size.width = size.height * contentAspectRatio;
      }
      break;
    case UIViewContentModeScaleAspectFill: // cover
      if (aspectRatioCriteria) {
        size.width = size.height * contentAspectRatio;
      } else {
        size.height = size.width / contentAspectRatio;
      }
      break;
    case UIViewContentModeCenter: // center
      size = contentSize;
      break;
    default:
      break;
  }
  CGRect contentLayout = layout;
  contentLayout.origin.x += (contentLayout.size.width - size.width) / 2;
  contentLayout.origin.y += (contentLayout.size.height - size.height) / 2;
  contentLayout.size = size;
  return contentLayout;
}

@end
