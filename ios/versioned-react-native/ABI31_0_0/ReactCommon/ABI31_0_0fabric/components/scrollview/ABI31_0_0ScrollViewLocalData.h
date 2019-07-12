/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0core/LocalData.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ScrollViewLocalData;

using SharedScrollViewLocalData = std::shared_ptr<const ScrollViewLocalData>;

/*
 * LocalData for <ScrollView> component.
 */
class ScrollViewLocalData:
  public LocalData {

public:
  ScrollViewLocalData(Rect contentBoundingRect);

  /*
   * Compound size of all nested (first level only) components;
   * is used for computing `contentSize`.
   */
  const Rect contentBoundingRect;

#pragma mark - Getters

  Size getContentSize() const;

#pragma mark - DebugStringConvertible

  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace ReactABI31_0_0
} // namespace facebook
