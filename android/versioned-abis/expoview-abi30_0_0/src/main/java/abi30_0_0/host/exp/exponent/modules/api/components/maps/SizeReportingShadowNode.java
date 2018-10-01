/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import abi30_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi30_0_0.com.facebook.react.uimanager.UIViewOperationQueue;

import java.util.HashMap;
import java.util.Map;

// Custom LayoutShadowNode implementation used in conjunction with the AirMapManager
// which sends the width/height of the view after layout occurs.
public class SizeReportingShadowNode extends LayoutShadowNode {

  @Override
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
    super.onCollectExtraUpdates(uiViewOperationQueue);

    Map<String, Float> data = new HashMap<>();
    data.put("width", getLayoutWidth());
    data.put("height", getLayoutHeight());

    uiViewOperationQueue.enqueueUpdateExtraData(getReactTag(), data);
  }
}
