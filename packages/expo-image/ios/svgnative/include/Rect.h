/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#pragma once
#ifdef __cplusplus

#include "Config.h"

//#include <array>
#include <boost/variant.hpp>
#include <limits>
#include <map>
#include <memory>
#include <string>
#include <tuple>
#include <vector>

namespace SVGNative
{
class Interval;

using IntervalPair = std::tuple<Interval, Interval>;

/**
 * Represents a rectangle.
 *
 * The following points hold true for a Rectangle:
 * 1. A rectangle is simply defined by a pair of two Intervals. The set
 * of a rectangle $R$ defined by two Intervals $A$ and $B$ is the set
 * of all points $(x, y)$ such that $x$ is a member of Interval $A$'s
 * set while $y$ is a member of Interval $B$'s set.
 * 2. A rectangle is empty if its set is of length zero.
 * 3. A rectangle $A$ contains a rectangle $B$ if all points of rectangle
 * $B$'s set are also members of the set of rectangle $A$.
 * 4. The intersection of two rectangles $A$ and $B$ is a rectangle whose
 * set contains the elements that are common in the point set of $A$ and
 * that of $B$.
 * 5. The join of two rectangles $A$ and $B$ is a rectangle with the smallest
 * possible point set such that it has all points of $A$ as well as those of
 * set $B$ and is complete, meaning that for any two points in the set, all
 * the points lying between will also be a part of the set. By smallest we mean
 * that no other proper subset of that set should satisfy this requirement.
 */
class Rect
{
  public:
    Rect() = default;
    Rect(float aX, float aY, float aWidth, float aHeight);
    /**
     * Returns if the rectangle is empty
     */
    bool IsEmpty() const;
    /**
     * Returns the two intervals defining the rectangle
     * Returns true if Rect contains the other Rect within it
     */
    bool Contains(Rect other) const;
    /**
     * Computes the intersection of Rect with the other Rect, meaning a rectangle encompassing area
     * that is common in both.
     */
    Rect operator&(Rect other) const;
    /**
     * Returns true if two rectangles are the same
     */
    bool operator==(Rect other) const;
    /**
     * Computes the join of two rectangles, meaning a bigger rectangle that contains both of those.
     */
    Rect operator|(Rect other) const;
    float Area() const { return width * height; }
    float MaxDiffVertex(Rect other) const;
    float Left() const { return x; }
    float Right() const { return x + width; }
    float Top() const { return y; }
    float Bottom() const { return y + height; }

    float x = std::numeric_limits<float>::quiet_NaN();
    float y = std::numeric_limits<float>::quiet_NaN();
    float width = std::numeric_limits<float>::quiet_NaN();
    float height = std::numeric_limits<float>::quiet_NaN();

  private:
    IntervalPair Intervals() const;
};

} // namespace SVGNative

#endif // __cplusplus
