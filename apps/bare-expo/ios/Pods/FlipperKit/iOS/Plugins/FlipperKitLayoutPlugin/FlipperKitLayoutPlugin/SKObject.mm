/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKObject.h"

SKObject::SKObject(CGRect rect) {
  _actual = @{@"origin" : SKObject(rect.origin), @"size" : SKObject(rect.size)};
}

SKObject::SKObject(CGSize size) {
  _actual = @{@"height" : @(size.height), @"width" : @(size.width)};
}

SKObject::SKObject(CGPoint point) {
  _actual = @{@"x" : @(point.x), @"y" : @(point.y)};
}

SKObject::SKObject(UIEdgeInsets insets) {
  _actual = @{
    @"top" : @(insets.top),
    @"bottom" : @(insets.bottom),
    @"left" : @(insets.left),
    @"right" : @(insets.right),
  };
}

SKObject::SKObject(CGAffineTransform transform) {
  _actual = @{
    @"a" : @(transform.a),
    @"b" : @(transform.b),
    @"c" : @(transform.c),
    @"d" : @(transform.d),
    @"tx" : @(transform.tx),
    @"ty" : @(transform.ty),
  };
}

SKObject::SKObject(id<SKSonarValueCoder> value) : _actual([value sonarValue]) {}

SKObject::SKObject(id value) : _actual(value) {}

static NSString* _objectType(id<NSObject> object) {
  if ([object isKindOfClass:[NSDictionary class]]) {
    return (NSString*)((NSDictionary*)object)[@"__type__"];
  }

  return nil;
}

static id<NSObject> _objectValue(id<NSObject> object) {
  if ([object isKindOfClass:[NSDictionary class]]) {
    return ((NSDictionary*)object)[@"value"];
  }

  return object;
}

static NSDictionary<NSString*, id<NSObject>>* _SKValue(
    id<NSObject> object,
    BOOL isMutable) {
  NSString* type = _objectType(object);
  id<NSObject> value = _objectValue(object);

  return @{
    @"__type__" : (type != nil ? type : @"auto"),
    @"__mutable__" : @(isMutable),
    @"value" : (value != nil ? value : [NSNull null]),
  };
}

static NSDictionary* _SKMutable(
    const NSDictionary<NSString*, id<NSObject>>* skObject) {
  NSMutableDictionary* mutableObject = [NSMutableDictionary new];
  for (NSString* key : skObject) {
    id<NSObject> value = skObject[key];

    if (_objectType(value) != nil) {
      mutableObject[key] = _SKValue(value, YES);
    } else if ([value isKindOfClass:[NSDictionary class]]) {
      auto objectValue = (NSDictionary<NSString*, id<NSObject>>*)value;
      mutableObject[key] = _SKMutable(objectValue);
    } else {
      mutableObject[key] = _SKValue(value, YES);
    }
  }

  return mutableObject;
}

void SKMutableObject::convertToMutable() {
  if (_convertedToMutable) {
    return;
  }

  if (_objectType(_actual) == nil &&
      [_actual isKindOfClass:[NSDictionary class]]) {
    auto object = (const NSDictionary<NSString*, id<NSObject>>*)_actual;
    _actual = _SKMutable(object);
  } else {
    _actual = _SKValue(_actual, YES);
  }

  _convertedToMutable = YES;
}

#endif
