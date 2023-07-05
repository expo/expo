/*
Copyright 2016 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#include "SVGDocument.h"
#include "SVGRenderer.h"

#define _USE_MATH_DEFINES
#include <cmath>
#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

namespace SVGNative
{

void RotatePoint(float& x, float& y, float angle);
void RotatePoint(float& /*x*/, float& /*y*/, float /*angle*/) { SVG_ASSERT(false); }

void AddArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float angle,
    float endX, float endY, float startAngle, float endAngle, float& endControlX, float& endControlY);
void AddArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float /*angle*/,
    float endX, float endY, float startAngle, float endAngle, float& endControlX, float& endControlY)
{
    // trigonometry
    float t = tan((endAngle - startAngle) / 4);
    float hx = radiusX * t * 4 / 3;
    float hy = radiusY * t * 4 / 3;

    // calculate control points
    float startCPX = startX + hx * sin(startAngle);
    float startCPY = startY - hy * cos(startAngle);

    startCPX = 2 * startX - startCPX;
    startCPY = 2 * startY - startCPY;

    float endCPX = endX + hx * sin(endAngle);
    float endCPY = endY - hy * cos(endAngle);

    // !!! don't forget to rotate points back to the original reference frame

    // add curve
    path.CurveTo(startCPX, startCPY, endCPX, endCPY, endX, endY);

    endControlX = endCPX;
    endControlY = endCPY;

    SVG_PARSE_TRACE("AddArcToCurve startAngle=" << (startAngle * 180 / M_PI) << " endAngle=" << (endAngle * 180 / M_PI));
    SVG_PARSE_TRACE("AddArcToCurve startCP=("
        << startCPX << "," << startCPY << ") endCP=(" << endCPX << "," << endCPY << ") EndPoint=(" << endX
        << "," << endY << ")");
}

void ArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float angle, bool sweep,
    float endX, float endY, float startAngle, float endAngle, float centerX, float centerY, float& endControlX,
    float& endControlY);
void ArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float angle, bool sweep,
    float endX, float endY, float startAngle, float endAngle, float centerX, float centerY, float& endControlX,
    float& endControlY)
{
    float angleDiff = endAngle - startAngle;
    if (std::abs(angleDiff) > M_PI * 120.0f / 180.0f)
    {
        // too wide so we need to break it up into multiple curves
        float endAngleNext = endAngle;
        float endXNext = endX;
        float endYNext = endY;

        endAngle = startAngle + (M_PI * 120.0f / 180.0f) * ((sweep && (endAngle > startAngle)) ? 1 : -1);
        endX = centerX + radiusX * cos(endAngle);
        endY = centerY + radiusY * sin(endAngle);

        AddArcToCurve(
            path, startX, startY, radiusX, radiusY, angle, endX, endY, startAngle, endAngle, endControlX, endControlY);
        ArcToCurve(path, endX, endY, radiusX, radiusY, angle, sweep, endXNext, endYNext, endAngle, endAngleNext,
            centerX, centerY, endControlX, endControlY);
    }
    else
    {
        AddArcToCurve(
            path, startX, startY, radiusX, radiusY, angle, endX, endY, startAngle, endAngle, endControlX, endControlY);
    }
}

void ArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float angle, bool large,
    bool sweep, float endX, float endY, float& endControlX, float& endControlY);
void ArcToCurve(SVGNative::Path& path, float startX, float startY, float radiusX, float radiusY, float angle, bool large,
    bool sweep, float endX, float endY, float& endControlX, float& endControlY)
{
    // https://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes

    SVG_ASSERT(angle == 0); // untested

    if (radiusX == 0 || radiusY == 0)
    {
        // this is actually a line
        path.LineTo(endX, endY);
        return;
    }

    SVG_ASSERT(radiusX == radiusY); // untested

    SVG_ASSERT(radiusX != 0 && radiusY != 0);

    SVG_PARSE_TRACE("ArcToCurve ----------------------------------------------");
    SVG_PARSE_TRACE("parsePathString ArcToCurve: rx="
                          << radiusX << " ry=" << radiusY << " large=" << large << " sweep=" << sweep << " previous=("
                          << startX << "," << startY << ")"
                          << " next=(" << endX << "," << endY << ")");

    angle = M_PI / 180 * angle; // all radians all the time

    if (radiusX != radiusY)
        SVG_PARSE_TRACE("parsePathString ELLIPTICAL: " << angle);

    // handle rotation here and when we plot points to the path.CurveTo !!!
    //	RotatePoint(startX, startY, angle);
    //	RotatePoint(endX, endY, angle);

    // Calculate the whatchamacallit.
    float hx = (startX - endX) / 2;
    float hy = (startY - endY) / 2;

    // correct out of range radii F.6.6
    float validateRadii = (hx * hx) / (radiusX * radiusX) + (hy * hy) / (radiusY * radiusY);
    if (validateRadii > 1)
    {
        radiusX = radiusX * sqrt(validateRadii);
        radiusY = radiusY * sqrt(validateRadii);
    }

    SVG_PARSE_TRACE("ArcToCurve final radii: rx=" << radiusX << " ry=" << radiusY);

    // start calculating
    // F.6.5.2
    float radiusX2(radiusX * radiusX);
    float radiusY2(radiusY * radiusY);
    float HX2(hx * hx);
    float HY2(hy * hy);

    float k = (radiusX2 * radiusY2 - radiusX2 * HY2 - radiusY2 * HX2) / (radiusX2 * HY2 + radiusY2 * HX2);
    k = sqrt(std::abs(k)) * (large == sweep ? -1 : 1);

    float centerX = k * (radiusX * hy / radiusY);
    float centerY = k * (-radiusY * hx / radiusX);

    // F.6.5.3 - center of ellipse
    centerX += (startX + endX) / 2;
    centerY += (startY + endY) / 2;

    SVG_PARSE_TRACE("parsePathString ArcToCurve: center(" << centerX << "," << centerY << ")");
    SVG_PARSE_TRACE("parsePathString ArcToCurve: radius("
                              << sqrt((centerX - startX) * (centerX - startX) + (centerY - startY) * (centerY - startY))
                              << "," << sqrt((centerX - endX) * (centerX - endX) + (centerY - endY) * (centerY - endY))
                              << ")");

    // calculate angles
    // F.6.5.4 to F.6.5.6
    float aS = (startY - centerY) / radiusY;
    float aE = (endY - centerY) / radiusY;

    // preventing out of range errors with asin due to floating point errors
    aS = std::min(aS, 1.0f);
    aS = std::max(aS, -1.0f);

    aE = std::min(aE, 1.0f);
    aE = std::max(aE, -1.0f);

    SVG_ASSERT_MSG(aS >= -1 && aS <= 1, "aS: " << aS);
    SVG_ASSERT_MSG(aE >= -1 && aE <= 1, "aE: " << aE);

    // get the angle
    float startAngle = asin(aS);
    float endAngle = asin(aE);

    if (startX < centerX)
        startAngle = M_PI - startAngle;

    if (endX < centerX)
        endAngle = M_PI - endAngle;

    if (startAngle < 0)
        startAngle = M_PI * 2 + startAngle;

    if (endAngle < 0)
        endAngle = M_PI * 2 + endAngle;

    SVG_PARSE_TRACE(
        "parsePathString ArcToCurve: angles(" << (startAngle * 180 / M_PI) << "," << (endAngle * 180 / M_PI) << ")");

    if (sweep && startAngle > endAngle)
    {
        startAngle = startAngle - M_PI * 2.0f;
    }
    if (!sweep && endAngle > startAngle)
    {
        endAngle = endAngle - M_PI * 2.0f;
    }

    SVG_PARSE_TRACE(
        "parsePathString ArcToCurve: anglesF(" << (startAngle * 180.0f / M_PI) << "," << (endAngle * 180.0f / M_PI) << ")");

    ArcToCurve(path, startX, startY, radiusX, radiusY, angle, sweep, endX, endY, startAngle, endAngle, centerX, centerY,
        endControlX, endControlY);
}

}
