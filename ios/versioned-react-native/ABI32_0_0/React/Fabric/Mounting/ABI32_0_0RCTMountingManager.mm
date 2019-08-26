/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTMountingManager.h"

#import <ABI32_0_0fabric/ABI32_0_0core/LayoutableShadowNode.h>
#import <ReactABI32_0_0/ABI32_0_0RCTAssert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUtils.h>

#import "ABI32_0_0RCTComponentViewProtocol.h"
#import "ABI32_0_0RCTComponentViewRegistry.h"
#import "ABI32_0_0RCTMountItemProtocol.h"

#import "ABI32_0_0RCTCreateMountItem.h"
#import "ABI32_0_0RCTConversions.h"
#import "ABI32_0_0RCTDeleteMountItem.h"
#import "ABI32_0_0RCTInsertMountItem.h"
#import "ABI32_0_0RCTRemoveMountItem.h"
#import "ABI32_0_0RCTUpdatePropsMountItem.h"
#import "ABI32_0_0RCTUpdateEventEmitterMountItem.h"
#import "ABI32_0_0RCTUpdateLocalDataMountItem.h"
#import "ABI32_0_0RCTUpdateLayoutMetricsMountItem.h"

using namespace facebook::ReactABI32_0_0;

@implementation ABI32_0_0RCTMountingManager

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[ABI32_0_0RCTComponentViewRegistry alloc] init];
  }

  return self;
}

- (void)mutateComponentViewTreeWithMutationInstructions:(facebook::ReactABI32_0_0::TreeMutationInstructionList)instructions
                                                rootTag:(ReactABI32_0_0Tag)rootTag
{
  NSMutableArray<ABI32_0_0RCTMountItemProtocol> *mountItems =
    [[NSMutableArray<ABI32_0_0RCTMountItemProtocol> alloc] initWithCapacity:instructions.size() * 2 /* ~ the worst case */];

  for (auto instruction : instructions) {
    switch (instruction.getType()) {
      case TreeMutationInstruction::Creation: {
        NSString *componentName = ABI32_0_0RCTNSStringFromString(instruction.getNewChildNode()->getComponentName(), NSASCIIStringEncoding);
        ABI32_0_0RCTCreateMountItem *mountItem =
          [[ABI32_0_0RCTCreateMountItem alloc] initWithComponentName:componentName
                                                        tag:instruction.getNewChildNode()->getTag()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Deletion: {
        NSString *componentName = ABI32_0_0RCTNSStringFromString(instruction.getOldChildNode()->getComponentName(), NSASCIIStringEncoding);
        ABI32_0_0RCTDeleteMountItem *mountItem =
          [[ABI32_0_0RCTDeleteMountItem alloc] initWithComponentName:componentName
                                                        tag:instruction.getOldChildNode()->getTag()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Insertion: {
        // Props
        [mountItems addObject:[[ABI32_0_0RCTUpdatePropsMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                  oldProps:nullptr
                                                                  newProps:instruction.getNewChildNode()->getProps()]];

        // EventEmitter
        [mountItems addObject:[[ABI32_0_0RCTUpdateEventEmitterMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                     eventEmitter:instruction.getNewChildNode()->getEventEmitter()]];

        // LocalData
        if (instruction.getNewChildNode()->getLocalData()) {
          [mountItems addObject:[[ABI32_0_0RCTUpdateLocalDataMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                    oldLocalData:nullptr
                                                                    newLocalData:instruction.getNewChildNode()->getLocalData()]];
        }

        // Layout
        auto layoutableNewShadowNode =
          std::dynamic_pointer_cast<const LayoutableShadowNode>(instruction.getNewChildNode());

        if (layoutableNewShadowNode) {
          [mountItems addObject:[[ABI32_0_0RCTUpdateLayoutMetricsMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                    oldLayoutMetrics:{}
                                                                    newLayoutMetrics:layoutableNewShadowNode->getLayoutMetrics()]];
        }

        // Insertion
        ABI32_0_0RCTInsertMountItem *mountItem =
        [[ABI32_0_0RCTInsertMountItem alloc] initWithChildTag:instruction.getNewChildNode()->getTag()
                                           parentTag:instruction.getParentNode()->getTag()
                                               index:instruction.getIndex()];
        [mountItems addObject:mountItem];

        break;
      }

      case TreeMutationInstruction::Removal: {
        ABI32_0_0RCTRemoveMountItem *mountItem =
          [[ABI32_0_0RCTRemoveMountItem alloc] initWithChildTag:instruction.getOldChildNode()->getTag()
                                             parentTag:instruction.getParentNode()->getTag()
                                                 index:instruction.getIndex()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Replacement: {
        SharedShadowNode oldShadowNode = instruction.getOldChildNode();
        SharedShadowNode newShadowNode = instruction.getNewChildNode();

        // Props
        if (oldShadowNode->getProps() != newShadowNode->getProps()) {
          ABI32_0_0RCTUpdatePropsMountItem *mountItem =
            [[ABI32_0_0RCTUpdatePropsMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                oldProps:instruction.getOldChildNode()->getProps()
                                                newProps:instruction.getNewChildNode()->getProps()];
          [mountItems addObject:mountItem];
        }

        // EventEmitter
        if (oldShadowNode->getEventEmitter() != newShadowNode->getEventEmitter()) {
          ABI32_0_0RCTUpdateEventEmitterMountItem *mountItem =
            [[ABI32_0_0RCTUpdateEventEmitterMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                   eventEmitter:instruction.getOldChildNode()->getEventEmitter()];
          [mountItems addObject:mountItem];
        }

        // LocalData
        if (oldShadowNode->getLocalData() != newShadowNode->getLocalData()) {
          ABI32_0_0RCTUpdateLocalDataMountItem *mountItem =
            [[ABI32_0_0RCTUpdateLocalDataMountItem alloc] initWithTag:newShadowNode->getTag()
                                                oldLocalData:oldShadowNode->getLocalData()
                                                newLocalData:newShadowNode->getLocalData()];
          [mountItems addObject:mountItem];
        }

        // Layout
        auto layoutableOldShadowNode =
          std::dynamic_pointer_cast<const LayoutableShadowNode>(oldShadowNode);

        if (layoutableOldShadowNode) {
          auto layoutableNewShadowNode =
            std::dynamic_pointer_cast<const LayoutableShadowNode>(newShadowNode);

          if (layoutableOldShadowNode->getLayoutMetrics() != layoutableNewShadowNode->getLayoutMetrics()) {
            ABI32_0_0RCTUpdateLayoutMetricsMountItem *mountItem =
              [[ABI32_0_0RCTUpdateLayoutMetricsMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                  oldLayoutMetrics:layoutableOldShadowNode->getLayoutMetrics()
                                                  newLayoutMetrics:layoutableNewShadowNode->getLayoutMetrics()];
            [mountItems addObject:mountItem];
          }
        }

        break;
      }
    }
  }

  ABI32_0_0RCTExecuteOnMainQueue(^{
    [self _performMountItems:mountItems rootTag:rootTag];
  });
}

- (void)_performMountItems:(NSArray<ABI32_0_0RCTMountItemProtocol> *)mountItems
                   rootTag:(ReactABI32_0_0Tag)rootTag
{
  ABI32_0_0RCTAssertMainQueue();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:rootTag];

  for (id<ABI32_0_0RCTMountItemProtocol> mountItem in mountItems) {
    [mountItem executeWithRegistry:_componentViewRegistry];
  }

  [self.delegate mountingManager:self didMountComponentsWithRootTag:rootTag];
}

- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName
{
  ABI32_0_0RCTExecuteOnMainQueue(^{
    [self->_componentViewRegistry preliminaryCreateComponentViewWithName:componentName];
  });
}

@end
