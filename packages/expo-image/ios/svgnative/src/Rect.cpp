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

#include "Rect.h"
#include "Interval.h"

#include <cmath>
#include <stdexcept>
#include <tuple>

namespace SVGNative
{
    Rect::Rect(float aX, float aY, float aWidth, float aHeight)
    {
        if (aWidth < 0 || aHeight < 0)
        {
            throw std::invalid_argument("Height or Width of a rectangle can't be negative!");
        }
        x = aX;
        y = aY;
        width = aWidth;
        height = aHeight;
    }
    bool Rect::IsEmpty() const
    {
        IntervalPair rectIntervals = Intervals();
        return std::get<0>(rectIntervals).IsEmpty() || std::get<1>(rectIntervals).IsEmpty();
    }
    bool Rect::Contains(Rect other) const
    {
        IntervalPair thisIntervals = Intervals();
        IntervalPair otherIntervals = other.Intervals();
        return std::get<0>(thisIntervals).Contains(std::get<0>(otherIntervals)) &&
            std::get<1>(thisIntervals).Contains(std::get<1>(otherIntervals));
    }
    bool Rect::operator==(Rect other) const
    {
        return x == other.x && y == other.y && width == other.width && height == other.height;
    }
    Rect Rect::operator&(Rect other) const
    {
        IntervalPair intervalsA = Intervals();
        IntervalPair intervalsB = other.Intervals();
        Interval resultX = std::get<0>(intervalsA) & std::get<0>(intervalsB);
        Interval resultY = std::get<1>(intervalsA) & std::get<1>(intervalsB);
        if (resultX.IsEmpty() || resultY.IsEmpty())
            return Rect{0, 0, 0, 0};
        return Rect(resultX.Min(), resultY.Min(), resultX.Max() - resultX.Min(), resultY.Max() - resultY.Min());
    }
    Rect Rect::operator|(Rect other) const
    {
        IntervalPair intervalsA = Intervals();
        IntervalPair intervalsB = other.Intervals();
        Interval resultX = std::get<0>(intervalsA) | std::get<0>(intervalsB);
        Interval resultY = std::get<1>(intervalsA) | std::get<1>(intervalsB);
        if (resultX.IsEmpty() || resultY.IsEmpty())
            return Rect{0, 0, 0, 0};
        return Rect(resultX.Min(), resultY.Min(), resultX.Max() - resultX.Min(), resultY.Max() - resultY.Min());
    }
    float Rect::MaxDiffVertex(Rect other) const
    {
        float topLeftDiff = std::sqrt(std::pow(Left() - other.Left(), 2) + std::pow(Top() - other.Top(), 2));
        float topRightDiff = std::sqrt(std::pow(Right() - other.Right(), 2) + std::pow(Top() - other.Top(), 2));
        float bottomLeftDiff = std::sqrt(std::pow(Left() - other.Left(), 2) + std::pow(Bottom() - other.Bottom(), 2));
        float bottomRightDiff = std::sqrt(std::pow(Right() - other.Right(), 2) + std::pow(Bottom() - other.Bottom(), 2));
	float max1 = std::max(topLeftDiff, topRightDiff);
	float max2 = std::max(bottomLeftDiff, bottomRightDiff);
	return std::max(max1,max2);
    }

    IntervalPair Rect::Intervals() const { return IntervalPair(Interval(x, x + width), Interval(y, y + height)); }
}
