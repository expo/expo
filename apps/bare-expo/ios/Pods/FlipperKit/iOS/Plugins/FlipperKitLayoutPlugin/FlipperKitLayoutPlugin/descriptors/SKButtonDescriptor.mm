/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKButtonDescriptor.h"

#import "SKDescriptorMapper.h"
#import "SKObject.h"
#import "UIColor+SKSonarValueCoder.h"

@implementation SKButtonDescriptor

- (NSString*)identifierForNode:(UIButton*)node {
  return [NSString stringWithFormat:@"%p", node];
}

- (NSUInteger)childCountForNode:(UIButton*)node {
  return 0;
}

- (id)childForNode:(UIButton*)node atIndex:(NSUInteger)index {
  return nil;
}

- (NSArray<SKNamed<NSDictionary*>*>*)dataForNode:(UIButton*)node {
  SKNodeDescriptor* viewDescriptor = [self descriptorForClass:[UIView class]];
  auto* viewData = [viewDescriptor dataForNode:node];

  NSMutableArray* data = [NSMutableArray new];
  [data addObjectsFromArray:viewData];
  [data addObject:[SKNamed
                      newWithName:@"UIButton"
                        withValue:@{
                          @"focused" : @(node.focused),
                          @"enabled" : SKMutableObject(@(node.enabled)),
                          @"highlighted" : SKMutableObject(@(node.highlighted)),
                          @"titleEdgeInsets" : SKObject(node.titleEdgeInsets),
                          @"titleLabel" : SKMutableObject(
                              node.titleLabel.attributedText.string
                                  .stringByStandardizingPath),
                          @"currentTitleColor" :
                              SKMutableObject(node.currentTitleColor),
                        }]];
  return data;
}

- (NSDictionary<NSString*, SKNodeUpdateData>*)dataMutationsForNode:
    (UIButton*)node {
  NSDictionary* buttonMutations =
      @{@"UIButton.titleLabel" : ^(NSString* newValue){
          [node setTitle:newValue forState:node.state];
}
,
                                    @"UIButton.currentTitleColor": ^(NSNumber *newValue) {
                                      [node setTitleColor: [UIColor fromSonarValue: newValue] forState: node.state];
                                    },
                                    @"UIButton.highlighted": ^(NSNumber *highlighted) {
                                      [node setHighlighted: [highlighted boolValue]];
                                    },
                                    @"UIButton.enabled": ^(NSNumber *enabled) {
                                      [node setEnabled: [enabled boolValue]];
                                    }
}
;

SKNodeDescriptor* viewDescriptor = [self descriptorForClass:[UIView class]];
NSDictionary* viewMutations = [viewDescriptor dataMutationsForNode:node];

NSMutableDictionary* mutations = [NSMutableDictionary new];
[mutations addEntriesFromDictionary:buttonMutations];
[mutations addEntriesFromDictionary:viewMutations];

return mutations;
}

- (NSArray<SKNamed<NSString*>*>*)attributesForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor attributesForNode:node];
}

- (void)setHighlighted:(BOOL)highlighted forNode:(UIButton*)node {
  SKNodeDescriptor* viewDescriptor = [self descriptorForClass:[UIView class]];
  [viewDescriptor setHighlighted:highlighted forNode:node];
}

- (void)hitTest:(SKTouch*)touch forNode:(UIButton*)node {
  [touch finish];
}

@end

#endif
