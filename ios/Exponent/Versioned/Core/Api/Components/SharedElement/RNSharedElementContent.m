//
//  RNSharedElementContent_m
//  react-native-shared-element
//

#import "RNSharedElementContent.h"

@implementation RNSharedElementContent
{
  // nop
}

- (instancetype)initWithData:(id) data type:(RNSharedElementContentType)type insets:(UIEdgeInsets)insets
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
          [className isEqualToString:@"RCTImageView"] ||
          [className isEqualToString:@"ExpoImage.ImageView"]
          );
}

+ (UIImageView*) imageViewFromView:(UIView*) view
{
  if ([view isKindOfClass:[UIImageView class]]) {
    return (UIImageView*) view;
  } else if ([RNSharedElementContent isKindOfImageView:view]) {
    // Both react-native and expo-image have a UIImageView
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
    case RNSharedElementContentTypeNone: return @"none";
    case RNSharedElementContentTypeRawImage: return @"image";
    case RNSharedElementContentTypeSnapshotView: return @"snapshotView";
    case RNSharedElementContentTypeSnapshotImage: return @"snapshotImage";
    default: return @"unknown";
  }
}

+ (CGSize) sizeForRect:(CGRect)layout content:(RNSharedElementContent*)content
{
  if (content == nil || content.data == nil) return layout.size;
  if (content.type != RNSharedElementContentTypeRawImage) return layout.size;
  CGSize size = layout.size;
  return [content.data isKindOfClass:[UIImage class]] ? ((UIImage*)content.data).size : size;
}

+ (CGRect) layoutForRect:(CGRect)layout content:(RNSharedElementContent*) content contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse
{
  if (content == nil || content.data == nil) return layout;
  if (content.type != RNSharedElementContentTypeRawImage) return layout;
  CGSize size = layout.size;
  size.width -= (content.insets.left + content.insets.right);
  size.height -= (content.insets.top + content.insets.bottom);
  CGSize contentSize = [RNSharedElementContent sizeForRect:layout content:content];
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
