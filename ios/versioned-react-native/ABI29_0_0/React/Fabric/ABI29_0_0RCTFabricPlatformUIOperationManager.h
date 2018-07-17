/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <memory>

#include <ABI29_0_0fabric/ABI29_0_0IFabricPlatformUIOperationManager.h>

@class ABI29_0_0RCTFabricPlatformUIOperationManager;

namespace facebook {
namespace ReactABI29_0_0 {

/**
 * Connector class (from C++ to ObjC++) to allow FabricUIManager to invoke native UI operations/updates.
 * UIKit-related impl doesn't live here, but this class gets passed to the FabricUIManager C++ impl directly.
 */
class ABI29_0_0RCTFabricPlatformUIOperationManagerConnector : public IFabricPlatformUIOperationManager {
public:
  ABI29_0_0RCTFabricPlatformUIOperationManagerConnector();
  ~ABI29_0_0RCTFabricPlatformUIOperationManagerConnector();

  void performUIOperation();

private:
  void *self_;
  ABI29_0_0RCTFabricPlatformUIOperationManager *manager_;
};

} // namespace ReactABI29_0_0
} // namespace facebook

/**
 * Actual ObjC++ implementation of the UI operations.
 */
@interface ABI29_0_0RCTFabricPlatformUIOperationManager : NSObject

- (void)performUIOperation;

@end
