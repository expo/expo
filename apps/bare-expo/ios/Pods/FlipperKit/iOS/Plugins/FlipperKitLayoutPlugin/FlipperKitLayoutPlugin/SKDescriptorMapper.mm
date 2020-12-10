/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKDescriptorMapper.h"

#import "SKApplicationDescriptor.h"
#import "SKButtonDescriptor.h"
#import "SKScrollViewDescriptor.h"
#import "SKViewControllerDescriptor.h"
#import "SKViewDescriptor.h"

@implementation SKDescriptorMapper {
  NSMutableDictionary<NSString*, SKNodeDescriptor*>* _descriptors;
}

- (instancetype)initWithDefaults {
  if (self = [super init]) {
    _descriptors = [NSMutableDictionary new];

    [self registerDescriptor:[[SKApplicationDescriptor alloc]
                                 initWithDescriptorMapper:self]
                    forClass:[UIApplication class]];
    [self registerDescriptor:[[SKViewControllerDescriptor alloc]
                                 initWithDescriptorMapper:self]
                    forClass:[UIViewController class]];
    [self registerDescriptor:[[SKScrollViewDescriptor alloc]
                                 initWithDescriptorMapper:self]
                    forClass:[UIScrollView class]];
    [self registerDescriptor:[[SKButtonDescriptor alloc]
                                 initWithDescriptorMapper:self]
                    forClass:[UIButton class]];
    [self registerDescriptor:[[SKViewDescriptor alloc]
                                 initWithDescriptorMapper:self]
                    forClass:[UIView class]];
  }

  return self;
}

- (SKNodeDescriptor*)descriptorForClass:(Class)cls {
  SKNodeDescriptor* classDescriptor = nil;

  while (classDescriptor == nil && cls != nil) {
    classDescriptor = [_descriptors objectForKey:NSStringFromClass(cls)];
    cls = [cls superclass];
  }

  return classDescriptor;
}

- (void)registerDescriptor:(SKNodeDescriptor*)descriptor forClass:(Class)cls {
  NSString* className = NSStringFromClass(cls);
  _descriptors[className] = descriptor;
}

- (NSArray<SKNodeDescriptor*>*)allDescriptors {
  return [_descriptors allValues];
}

@end

#endif
