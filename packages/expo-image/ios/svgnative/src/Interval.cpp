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

#include "Interval.h"
#include <algorithm>

namespace SVGNative {
    Interval::Interval(float u, float v)
    {
        if (u <= v)
        {
            mA = u;
            mB = v;
        }
        else
        {
            mA = v;
            mB = u;
        }
    }

    Interval Interval::operator&(Interval other) const
    {
        // return an empty interval if either of the Intervals is empty
        if ((!*this) || (!other))
            return Interval();

        float u = (std::max)(this->Min(), other.Min());
        float v = (std::min)(this->Max(), other.Max());
        return (u <= v) ? Interval(u, v) : Interval();
    }
    Interval Interval::operator|(Interval other) const
    {
        if (this->IsEmpty() && !other.IsEmpty())
            return other;
        else if(!this->IsEmpty() && other.IsEmpty())
            return *this;
        else if(this->IsEmpty() && other.IsEmpty())
            return Interval();
        else
            return Interval((std::min)(this->Min(), other.Min()), (std::max)(this->Max(), other.Max()));
    }
    bool Interval::Contains(Interval other) const
    {
        if (other.IsEmpty())
            return true;
        else if(this->IsEmpty())
            return false;
        else
            return this->Min() <= other.Min() && this->Max() >= other.Max();
    }
}
