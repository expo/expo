// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXAR/EXARModule+Serialization.h>

@implementation EXARModule (Serialization)

#pragma mark - Encode AR

+ (NSArray *)encodeMatrixFloat4x4:(matrix_float4x4)matrix
{
  const float *v = (const float *)&matrix;
  return @[@(v[0]), @(v[1]), @(v[2]), @(v[3]),
           @(v[4]), @(v[5]), @(v[6]), @(v[7]),
           @(v[8]), @(v[9]), @(v[10]), @(v[11]),
           @(v[12]), @(v[13]), @(v[14]), @(v[15])];
}

+ (NSArray *)encodeMatrixFloat3x3:(matrix_float3x3)matrix
{
  const float *v = (const float *)&matrix;
  return @[@(v[0]), @(v[1]), @(v[2]),
           @(v[3]), @(v[4]), @(v[5]),
           @(v[6]), @(v[7]), @(v[8])];
}

+ (NSArray *)encodeMatrixFloat4x3:(matrix_float4x3)matrix
{
  const float *v = (const float *)&matrix;
  return @[@(v[0]), @(v[1]), @(v[2]), @(v[3]),
           @(v[4]), @(v[5]), @(v[6]), @(v[7]),
           @(v[8]), @(v[9]), @(v[10]), @(v[11])];
}

+ (NSDictionary *)encodeCGPoint:(CGPoint)point
{
  return @{
           @"x": [NSNumber numberWithFloat: point.x],
           @"y": [NSNumber numberWithFloat: point.y]
           };
}

+ (NSDictionary *)encodeVectorFloat3:(vector_float3)vec
{
  return @{
           @"x": @(vec[0]),
           @"y": @(vec[1]),
           @"z": @(vec[2]),
           };
}

+ (NSDictionary *)encodeVectorFloat2:(vector_float2)vec
{
  return @{
           @"u": @(vec[0]),
           @"v": @(vec[1]),
           };
}

+ (NSDictionary *)encodeCGSize:(CGSize)size
{
  return @{
           @"width": [NSNumber numberWithFloat: size.width],
           @"height": [NSNumber numberWithFloat: size.height]
           };
}

+ (NSDictionary *)encodeARAnchor:(id)anchor props:(NSDictionary *)props
{
  if (@available(iOS 11.0, *)) {
    if ([anchor isKindOfClass:[ARAnchor class]]) {
      ARAnchor *_anchor = (ARAnchor *)anchor;
      NSString *type = @"anchor";
      NSDictionary *anchorData = @{
                                   @"type": type,
                                   @"transform": [EXARModule encodeMatrixFloat4x4:_anchor.transform],
                                   @"id": [NSString stringWithFormat:@"%@", _anchor.identifier],
                                   };
      NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:anchorData];
      
      NSDictionary *anchorProps = @{};
      if (props) {
        id possibleAnchorProps = [props valueForKey:type];
        if (possibleAnchorProps && [possibleAnchorProps isKindOfClass:[NSDictionary class]]) {
          anchorProps = (NSDictionary *)possibleAnchorProps;
        }
      }
      
      if ([anchor isKindOfClass:[ARPlaneAnchor class]]) {
        ARPlaneAnchor *planeAnchor = (ARPlaneAnchor *)anchor;
        NSDictionary *planeData = [EXARModule encodeARPlaneAnchor:planeAnchor];
        [output addEntriesFromDictionary:planeData];
      } else if (@available(iOS 11.3, *)) {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110300
        if ([anchor isKindOfClass:[ARImageAnchor class]]) {
          ARImageAnchor *imageAnchor = (ARImageAnchor *)anchor;
          NSDictionary *imageData = [EXARModule encodeARImageAnchor:imageAnchor];
          [output addEntriesFromDictionary:imageData];
        } else {
          NSDictionary *data = [EXARModule
                                encodeUnknownAnchor:anchor
                                props: anchorProps];
          [output addEntriesFromDictionary:data];
        }
#endif
      } else {
        NSDictionary *data = [EXARModule
                              encodeUnknownAnchor:anchor
                              props: anchorProps];
        [output addEntriesFromDictionary:data];
      }
      return output;
    }
  }
  return @{};
}

+ (NSDictionary *)encodeARPlaneAnchor:(ARPlaneAnchor *)anchor
API_AVAILABLE(ios(11.0))
{
  vector_float3 extent = anchor.extent;
  vector_float3 center = anchor.center;
  
  return @{
           @"type": @"plane",
           @"center": [EXARModule encodeVectorFloat3:center],
           @"extent": @{
               @"x": @(extent[0]),
               @"z": @(extent[2])
               },
           };
}

+ (NSDictionary *)encodeARImageAnchor:(ARImageAnchor *)anchor
API_AVAILABLE(ios(11.3))
{
  return @{
           @"type": @"image",
           @"name": anchor.referenceImage.name,
           @"extent": @{
               @"x": @(anchor.referenceImage.physicalSize.width),
               @"z": @(anchor.referenceImage.physicalSize.height),
               },
           @"image": @{
               @"name": anchor.referenceImage.name,
               @"size": [EXARModule encodeCGSize: anchor.referenceImage.physicalSize],
               },
           };
}

+ (NSDictionary *)encodeUnknownAnchor:(id)anchor props:(NSDictionary *) props
{
  
  NSMutableDictionary *output = [NSMutableDictionary new];
  
  if (@available(iOS 11.0, *)) {
    
    output[@"isTracked"] = @([anchor isTracked]);
    NSString *type = NSStringFromClass([anchor class]);
    output[@"type"] = type;
    
    if (props == nil) {
      return output;
    }
    
    BOOL hasGeometry = [[props valueForKey:@"geometry"] boolValue];
    if (hasGeometry) {
      NSMutableArray *vertices = [NSMutableArray new];
      id geometry = [anchor geometry];
      for (int i = 0; i < [geometry vertexCount]; i++) {
        [vertices addObject:[EXARModule encodeVectorFloat3:[geometry vertices][i]]];
      }
      
      NSMutableArray *textureCoordinates = [NSMutableArray new];
      for (int i = 0; i < [geometry triangleCount]; i++) {
        [textureCoordinates addObject:[EXARModule encodeVectorFloat2:[geometry textureCoordinates][i]]];
      }
      
      NSMutableArray *triangleIndices = [NSMutableArray new];
      for (int i = 0; i < [geometry triangleCount] * 3; i++) {
        int16_t triangle = [geometry triangleIndices][i];
        [triangleIndices addObject: [NSNumber numberWithInt:triangle]];
      }
      
      [output setObject:@{
                          @"vertexCount": [NSNumber numberWithInteger:[geometry vertexCount]],
                          @"textureCoordinateCount": [NSNumber numberWithInteger:[geometry textureCoordinateCount]],
                          @"triangleCount": [NSNumber numberWithInteger:[geometry triangleCount]],
                          @"vertices": vertices,
                          @"textureCoordinates": textureCoordinates,
                          @"triangleIndices": triangleIndices,
                          } forKey:@"geometry"];
    }
    
    id blendShapes = [props valueForKey:@"blendShapes"];
    if (blendShapes) {
      NSDictionary *blendShapeValues;
      if ([blendShapes isKindOfClass:[NSArray class]]) {
        NSArray *attributes = (NSArray *)blendShapes;
        if (attributes.count > 0) {
          NSMutableDictionary *selectiveBlendShapeValues = [NSMutableDictionary new];
          for (NSString *blendShapeLocation in attributes) {
            [selectiveBlendShapeValues setObject:[anchor blendShapes][blendShapeLocation] forKey:blendShapeLocation];
          }
          blendShapeValues = [NSDictionary dictionaryWithDictionary:selectiveBlendShapeValues];
        } else {
          blendShapeValues = [anchor blendShapes];
        }
      } else {
        blendShapeValues = [anchor blendShapes];
      }
      [output setObject:blendShapeValues forKey:@"blendShapes"];
    }
  }
  
  return output;
}

+ (NSArray *)encodeARAnchors:(NSArray *)anchors props:(NSDictionary *)props
{
  NSMutableArray *output = [NSMutableArray new];
  
  if (@available(iOS 11.0, *)) {
    for (ARAnchor *anchor in anchors) {
      NSDictionary *anchorData = [EXARModule encodeARAnchor:anchor props:props];
      [output addObject:anchorData];
    }
  }
  return output;
}


+ (NSDictionary *)encodeARVideoFormat:(ARVideoFormat *)videoFormat
API_AVAILABLE(ios(11.3))
{
  return @{
           @"type": NSStringFromClass([videoFormat class]),
           @"imageResolution": @{
               @"width": @(videoFormat.imageResolution.width),
               @"height": @(videoFormat.imageResolution.height)
               },
           @"framesPerSecond": @(videoFormat.framesPerSecond)
           };
}

+ (NSMutableArray *)encodeARVideoFormats:(NSArray<ARVideoFormat *>*)videoFormats
API_AVAILABLE(ios(11.3))
{
  NSMutableArray *output = [NSMutableArray array];
  
  if (@available(iOS 11.3, *)) {
    for (ARVideoFormat *videoFormat in videoFormats) {
      [output addObject:[EXARModule encodeARVideoFormat: videoFormat]];
    }
  }
  
  return output;
}

#pragma mark - Decode AR

+ (ARPlaneDetection)decodeARPlaneDetection:(NSString *)input
API_AVAILABLE(ios(11.0))
{
  if ([input isEqualToString:@"horizontal"]) {
    return ARPlaneDetectionHorizontal;
  } else {
    if (@available(iOS 11.3, *)) {
      if ([input isEqualToString:@"vertical"]) {
        return ARPlaneDetectionVertical;
      }
    }
  }
  return ARPlaneDetectionNone;
}

+ (ARHitTestResultType)decodeARHitTestResultType:(NSString *)input
API_AVAILABLE(ios(11.0))
{
  if ([input isEqualToString:@"horizontalPlane"]) {
    return ARHitTestResultTypeEstimatedHorizontalPlane;
  } else if ([input isEqualToString:@"existingPlane"]) {
    return ARHitTestResultTypeExistingPlane;
  } else if ([input isEqualToString:@"existingPlaneUsingExtent"]) {
    return ARHitTestResultTypeExistingPlaneUsingExtent;
  } else {
    if (@available(iOS 11.3, *)) {
      if ([input isEqualToString:@"verticalPlane"]) {
        return ARHitTestResultTypeEstimatedVerticalPlane;
      } else if ([input isEqualToString:@"existingPlaneUsingGeometry"]) {
        return ARHitTestResultTypeExistingPlaneUsingGeometry;
      }
    }
  }
  return ARHitTestResultTypeFeaturePoint;
}

+ (ARWorldAlignment)decodeARWorldAlignment:(NSString *)input
API_AVAILABLE(ios(11.0))
{
  if ([input isEqualToString:@"gravityAndHeading"]) {
    return ARWorldAlignmentGravityAndHeading;
  } else if ([input isEqualToString:@"alignmentCamera"]) {
    return ARWorldAlignmentCamera;
  }
  return ARWorldAlignmentGravity;
}

@end
