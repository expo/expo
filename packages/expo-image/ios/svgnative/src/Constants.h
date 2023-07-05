/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#pragma once

namespace SVGNative
{
// Attributes
constexpr const char* kIdAttr{"id"};
constexpr const char* kXAttr{"x"};
constexpr const char* kYAttr{"y"};
constexpr const char* kWidthAttr{"width"};
constexpr const char* kHeightAttr{"height"};
constexpr const char* kRxAttr{"rx"};
constexpr const char* kRyAttr{"ry"};
constexpr const char* kRAttr{"r"};
constexpr const char* kDAttr{"d"};
constexpr const char* kCxAttr{"cx"};
constexpr const char* kCyAttr{"cy"};
constexpr const char* kFxAttr{"fx"};
constexpr const char* kFyAttr{"fy"};
constexpr const char* kX1Attr{"x1"};
constexpr const char* kY1Attr{"y1"};
constexpr const char* kX2Attr{"x2"};
constexpr const char* kY2Attr{"y2"};
constexpr const char* kPointsAttr{"points"};
constexpr const char* kHrefAttr{"href"};
constexpr const char* kTransformAttr{"transform"};
constexpr const char* kGradientTransformAttr{"gradientTransform"};
constexpr const char* kViewBoxAttr{"viewBox"};
constexpr const char* kSpreadMethodAttr{"spreadMethod"};
constexpr const char* kOffsetAttr{"offset"};
#if DEBUG
constexpr const char* kDataNameAttr{"data-name"};
#endif

// Properties
constexpr const char* kColorProp{"color"};
constexpr const char* kClipRuleProp{"clip-rule"};
constexpr const char* kFillProp{"fill"};
constexpr const char* kFillRuleProp{"fill-rule"};
constexpr const char* kFillOpacityProp{"fill-opacity"};
constexpr const char* kStrokeProp{"stroke"};
constexpr const char* kStrokeDasharrayProp{"stroke-dasharray"};
constexpr const char* kStrokeDashoffsetProp{"stroke-dashoffset"};
constexpr const char* kStrokeLinecapProp{"stroke-linecap"};
constexpr const char* kStrokeLinejoinProp{"stroke-linejoin"};
constexpr const char* kStrokeMiterlimitProp{"stroke-miterlimit"};
constexpr const char* kStrokeOpacityProp{"stroke-opacity"};
constexpr const char* kStrokeWidthProp{"stroke-width"};
constexpr const char* kVisibilityProp{"visibility"};
constexpr const char* kClipPathProp{"clip-path"};
constexpr const char* kDisplayProp{"display"};
constexpr const char* kOpacityProp{"opacity"};
constexpr const char* kStopOpacityProp{"stop-opacity"};
constexpr const char* kStopColorProp{"stop-color"};
constexpr const char* kPreserveAspectRatioAttr{"preserveAspectRatio"};

// Elements
constexpr const char* kLineElem{"line"};
constexpr const char* kRectElem{"rect"};
constexpr const char* kPathElem{"path"};
constexpr const char* kPolygonElem{"polygon"};
constexpr const char* kPolylineElem{"polyline"};
constexpr const char* kEllipseElem{"ellipse"};
constexpr const char* kCircleElem{"circle"};
constexpr const char* kGElem{"g"};
constexpr const char* kClipPathElem{"clipPath"};
constexpr const char* kSymbolElem{"symbol"};
constexpr const char* kStyleElem{"style"};
constexpr const char* kLinearGradientElem{"linearGradient"};
constexpr const char* kRadialGradientElem{"radialGradient"};
constexpr const char* kDefsElem{"defs"};
constexpr const char* kUseElem{"use"};
constexpr const char* kImageElem{"image"};
constexpr const char* kStopElem{"stop"};
constexpr const char* kSvgElem{"svg"};

// Values
constexpr const char* kDataUrlPngVal{"data:image/png;base64,"};
constexpr const char* kDataUrlJpgVal{"data:image/jpg;base64,"};
constexpr const char* kDataUrlJpegVal{"data:image/jpeg;base64,"};
constexpr const char* kSliceVal{"slice"};
constexpr const char* kXMinYMinVal{"xMinYMin"};
constexpr const char* kXMidYMinVal{"xMidYMin"};
constexpr const char* kXMaxYMinVal{"xMaxYMin"};
constexpr const char* kXMinYMidVal{"xMinYMid"};
constexpr const char* kXMaxYMidVal{"xMaxYMid"};
constexpr const char* kXMinYMaxVal{"xMinYMax"};
constexpr const char* kXMidYMaxVal{"xMidYMax"};
constexpr const char* kXMaxYMaxVal{"xMaxYMax"};
constexpr const char* kEvenoddVal{"evenodd"};
constexpr const char* kNonzeroVal{"nonzero"};
constexpr const char* kHiddenVal{"hidden"};
constexpr const char* kCollapseVal{"collapse"};
constexpr const char* kVisibleVal{"visible"};
constexpr const char* kRoundVal{"round"};
constexpr const char* kSquareVal{"square"};
constexpr const char* kBevelVal{"bevel"};
constexpr const char* kUrlVal{"url(#"};
constexpr const char* kNoneVal{"none"};
constexpr const char* kPadVal{"pad"};
constexpr const char* kReflectVal{"reflect"};
constexpr const char* kRepeatVal{"repeat"};

// Others
constexpr const char* kXlinkNS{"xlink"};

} // namespace SVGNative
