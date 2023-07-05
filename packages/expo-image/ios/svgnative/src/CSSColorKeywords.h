/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

#pragma once

#include "SVGRenderer.h"
#include <array>

namespace SVGNative
{

struct CSSColorInfo
{
    constexpr CSSColorInfo(const char* aColorName, size_t aLength, Color aColor)
        : colorName{aColorName}
        , length{aLength}
        , color{std::move(aColor)}
    {
    }
    const char* colorName{};
    size_t length{};
    Color color{};
};

// Generated in web browser with following code. ele must be an element embedded in a loaded document.
// var string = '';
// [/*list of all color names*/].forEach(name => {
//     ele.style.fill = name;
//     let rgb = (window.getComputedStyle(ele).fill).match(/\d+/g);
//     string += String('	CSSColorInfo{"' + name + '"').padEnd(25) + ', ' + String(name.length).padEnd(2) + ' , {{'
//         + rgb.map(item => { return String(rgb[0] + '.0f / 255.0f').padStart(13)}).join(', ')
//         + ', 1.0f}}},\n';
// });
constexpr std::array<CSSColorInfo, 148> gCSSNamedColors = {{
    CSSColorInfo{"aliceblue"            , 9  , {{240.0f / 255.0f, 248.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"antiquewhite"         , 12 , {{250.0f / 255.0f, 235.0f / 255.0f, 215.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"aqua"                 , 4  , {{  0.0f / 255.0f, 255.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"aquamarine"           , 10 , {{127.0f / 255.0f, 255.0f / 255.0f, 212.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"azure"                , 5  , {{240.0f / 255.0f, 255.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"beige"                , 5  , {{245.0f / 255.0f, 245.0f / 255.0f, 220.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"bisque"               , 6  , {{255.0f / 255.0f, 228.0f / 255.0f, 196.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"black"                , 5  , {{  0.0f / 255.0f,   0.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"blanchedalmond"       , 14 , {{255.0f / 255.0f, 235.0f / 255.0f, 205.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"blue"                 , 4  , {{  0.0f / 255.0f,   0.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"blueviolet"           , 10 , {{138.0f / 255.0f,  43.0f / 255.0f, 226.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"brown"                , 5  , {{165.0f / 255.0f,  42.0f / 255.0f,  42.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"burlywood"            , 9  , {{222.0f / 255.0f, 184.0f / 255.0f, 135.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"cadetblue"            , 9  , {{ 95.0f / 255.0f, 158.0f / 255.0f, 160.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"chartreuse"           , 10 , {{127.0f / 255.0f, 255.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"chocolate"            , 9  , {{210.0f / 255.0f, 105.0f / 255.0f,  30.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"coral"                , 5  , {{255.0f / 255.0f, 127.0f / 255.0f,  80.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"cornflowerblue"       , 14 , {{100.0f / 255.0f, 149.0f / 255.0f, 237.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"cornsilk"             , 8  , {{255.0f / 255.0f, 248.0f / 255.0f, 220.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"crimson"              , 7  , {{220.0f / 255.0f,  20.0f / 255.0f,  60.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"cyan"                 , 4  , {{  0.0f / 255.0f, 255.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkblue"             , 8  , {{  0.0f / 255.0f,   0.0f / 255.0f, 139.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkcyan"             , 8  , {{  0.0f / 255.0f, 139.0f / 255.0f, 139.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkgoldenrod"        , 13 , {{184.0f / 255.0f, 134.0f / 255.0f,  11.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkgray"             , 8  , {{169.0f / 255.0f, 169.0f / 255.0f, 169.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkgreen"            , 9  , {{  0.0f / 255.0f, 100.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkgrey"             , 8  , {{169.0f / 255.0f, 169.0f / 255.0f, 169.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkkhaki"            , 9  , {{189.0f / 255.0f, 183.0f / 255.0f, 107.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkmagenta"          , 11 , {{139.0f / 255.0f,   0.0f / 255.0f, 139.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkolivegreen"       , 14 , {{ 85.0f / 255.0f, 107.0f / 255.0f,  47.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkorange"           , 10 , {{255.0f / 255.0f, 140.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkorchid"           , 10 , {{153.0f / 255.0f,  50.0f / 255.0f, 204.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkred"              , 7  , {{139.0f / 255.0f,   0.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darksalmon"           , 10 , {{233.0f / 255.0f, 150.0f / 255.0f, 122.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkseagreen"         , 12 , {{143.0f / 255.0f, 188.0f / 255.0f, 143.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkslateblue"        , 13 , {{ 72.0f / 255.0f,  61.0f / 255.0f, 139.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkslategray"        , 13 , {{ 47.0f / 255.0f,  79.0f / 255.0f,  79.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkslategrey"        , 13 , {{ 47.0f / 255.0f,  79.0f / 255.0f,  79.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkturquoise"        , 13 , {{  0.0f / 255.0f, 206.0f / 255.0f, 209.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkviolet"           , 10 , {{148.0f / 255.0f,   0.0f / 255.0f, 211.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"deeppink"             , 8  , {{255.0f / 255.0f,  20.0f / 255.0f, 147.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"deepskyblue"          , 11 , {{  0.0f / 255.0f, 191.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"dimgray"              , 7  , {{105.0f / 255.0f, 105.0f / 255.0f, 105.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"dimgrey"              , 7  , {{105.0f / 255.0f, 105.0f / 255.0f, 105.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"dodgerblue"           , 10 , {{ 30.0f / 255.0f, 144.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"firebrick"            , 9  , {{178.0f / 255.0f,  34.0f / 255.0f,  34.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"floralwhite"          , 11 , {{255.0f / 255.0f, 250.0f / 255.0f, 240.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"forestgreen"          , 11 , {{ 34.0f / 255.0f, 139.0f / 255.0f,  34.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"fuchsia"              , 7  , {{255.0f / 255.0f,   0.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"gainsboro"            , 9  , {{220.0f / 255.0f, 220.0f / 255.0f, 220.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"ghostwhite"           , 10 , {{248.0f / 255.0f, 248.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"gold"                 , 4  , {{255.0f / 255.0f, 215.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"goldenrod"            , 9  , {{218.0f / 255.0f, 165.0f / 255.0f,  32.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"gray"                 , 4  , {{128.0f / 255.0f, 128.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"green"                , 5  , {{  0.0f / 255.0f, 128.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"greenyellow"          , 11 , {{173.0f / 255.0f, 255.0f / 255.0f,  47.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"grey"                 , 4  , {{128.0f / 255.0f, 128.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"honeydew"             , 8  , {{240.0f / 255.0f, 255.0f / 255.0f, 240.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"hotpink"              , 7  , {{255.0f / 255.0f, 105.0f / 255.0f, 180.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"indianred"            , 9  , {{205.0f / 255.0f,  92.0f / 255.0f,  92.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"indigo"               , 6  , {{ 75.0f / 255.0f,   0.0f / 255.0f, 130.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"ivory"                , 5  , {{255.0f / 255.0f, 255.0f / 255.0f, 240.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"khaki"                , 5  , {{240.0f / 255.0f, 230.0f / 255.0f, 140.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lavender"             , 8  , {{230.0f / 255.0f, 230.0f / 255.0f, 250.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lavenderblush"        , 13 , {{255.0f / 255.0f, 240.0f / 255.0f, 245.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lawngreen"            , 9  , {{124.0f / 255.0f, 252.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lemonchiffon"         , 12 , {{255.0f / 255.0f, 250.0f / 255.0f, 205.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"darkslateblue"        , 13 , {{ 72.0f / 255.0f,  61.0f / 255.0f, 139.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightcoral"           , 10 , {{240.0f / 255.0f, 128.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightcyan"            , 9  , {{224.0f / 255.0f, 255.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightgoldenrodyellow" , 20 , {{250.0f / 255.0f, 250.0f / 255.0f, 210.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightgray"            , 9  , {{211.0f / 255.0f, 211.0f / 255.0f, 211.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightgreen"           , 10 , {{144.0f / 255.0f, 238.0f / 255.0f, 144.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightgrey"            , 9  , {{211.0f / 255.0f, 211.0f / 255.0f, 211.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightpink"            , 9  , {{255.0f / 255.0f, 182.0f / 255.0f, 193.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightsalmon"          , 11 , {{255.0f / 255.0f, 160.0f / 255.0f, 122.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightseagreen"        , 13 , {{ 32.0f / 255.0f, 178.0f / 255.0f, 170.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightskyblue"         , 12 , {{135.0f / 255.0f, 206.0f / 255.0f, 250.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightslategray"       , 14 , {{119.0f / 255.0f, 136.0f / 255.0f, 153.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightslategrey"       , 14 , {{119.0f / 255.0f, 136.0f / 255.0f, 153.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightsteelblue"       , 14 , {{176.0f / 255.0f, 196.0f / 255.0f, 222.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lightyellow"          , 11 , {{255.0f / 255.0f, 255.0f / 255.0f, 224.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"lime"                 , 4  , {{  0.0f / 255.0f, 255.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"limegreen"            , 9  , {{ 50.0f / 255.0f, 205.0f / 255.0f,  50.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"linen"                , 5  , {{250.0f / 255.0f, 240.0f / 255.0f, 230.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"magenta"              , 7  , {{255.0f / 255.0f,   0.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"maroon"               , 6  , {{128.0f / 255.0f,   0.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumaquamarine"     , 16 , {{102.0f / 255.0f, 205.0f / 255.0f, 170.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumblue"           , 10 , {{  0.0f / 255.0f,   0.0f / 255.0f, 205.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumorchid"         , 12 , {{186.0f / 255.0f,  85.0f / 255.0f, 211.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumpurple"         , 12 , {{147.0f / 255.0f, 112.0f / 255.0f, 219.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumseagreen"       , 14 , {{ 60.0f / 255.0f, 179.0f / 255.0f, 113.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumslateblue"      , 15 , {{123.0f / 255.0f, 104.0f / 255.0f, 238.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumspringgreen"    , 17 , {{  0.0f / 255.0f, 250.0f / 255.0f, 154.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumturquoise"      , 15 , {{ 72.0f / 255.0f, 209.0f / 255.0f, 204.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mediumvioletred"      , 15 , {{199.0f / 255.0f,  21.0f / 255.0f, 133.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"midnightblue"         , 12 , {{ 25.0f / 255.0f,  25.0f / 255.0f, 112.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mintcream"            , 9  , {{245.0f / 255.0f, 255.0f / 255.0f, 250.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"mistyrose"            , 9  , {{255.0f / 255.0f, 228.0f / 255.0f, 225.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"moccasin"             , 8  , {{255.0f / 255.0f, 228.0f / 255.0f, 181.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"navajowhite"          , 11 , {{255.0f / 255.0f, 222.0f / 255.0f, 173.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"navy"                 , 4  , {{  0.0f / 255.0f,   0.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"oldlace"              , 7  , {{253.0f / 255.0f, 245.0f / 255.0f, 230.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"olive"                , 5  , {{128.0f / 255.0f, 128.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"olivedrab"            , 9  , {{107.0f / 255.0f, 142.0f / 255.0f,  35.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"orange"               , 6  , {{255.0f / 255.0f, 165.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"orangered"            , 9  , {{255.0f / 255.0f,  69.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"orchid"               , 6  , {{218.0f / 255.0f, 112.0f / 255.0f, 214.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"palegoldenrod"        , 13 , {{238.0f / 255.0f, 232.0f / 255.0f, 170.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"palegreen"            , 9  , {{152.0f / 255.0f, 251.0f / 255.0f, 152.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"paleturquoise"        , 13 , {{175.0f / 255.0f, 238.0f / 255.0f, 238.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"palevioletred"        , 13 , {{219.0f / 255.0f, 112.0f / 255.0f, 147.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"papayawhip"           , 10 , {{255.0f / 255.0f, 239.0f / 255.0f, 213.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"peachpuff"            , 9  , {{255.0f / 255.0f, 218.0f / 255.0f, 185.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"peru"                 , 4  , {{205.0f / 255.0f, 133.0f / 255.0f,  63.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"pink"                 , 4  , {{255.0f / 255.0f, 192.0f / 255.0f, 203.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"plum"                 , 4  , {{221.0f / 255.0f, 160.0f / 255.0f, 221.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"powderblue"           , 10 , {{176.0f / 255.0f, 224.0f / 255.0f, 230.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"purple"               , 6  , {{128.0f / 255.0f,   0.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"rebeccapurple"        , 13 , {{102.0f / 255.0f,  51.0f / 255.0f, 153.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"red"                  , 3  , {{255.0f / 255.0f,   0.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"rosybrown"            , 9  , {{188.0f / 255.0f, 143.0f / 255.0f, 143.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"royalblue"            , 9  , {{ 65.0f / 255.0f, 105.0f / 255.0f, 225.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"saddlebrown"          , 11 , {{139.0f / 255.0f,  69.0f / 255.0f,  19.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"salmon"               , 6  , {{250.0f / 255.0f, 128.0f / 255.0f, 114.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"sandybrown"           , 10 , {{244.0f / 255.0f, 164.0f / 255.0f,  96.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"seagreen"             , 8  , {{ 46.0f / 255.0f, 139.0f / 255.0f,  87.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"seashell"             , 8  , {{255.0f / 255.0f, 245.0f / 255.0f, 238.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"sienna"               , 6  , {{160.0f / 255.0f,  82.0f / 255.0f,  45.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"silver"               , 6  , {{192.0f / 255.0f, 192.0f / 255.0f, 192.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"skyblue"              , 7  , {{135.0f / 255.0f, 206.0f / 255.0f, 235.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"slateblue"            , 9  , {{106.0f / 255.0f,  90.0f / 255.0f, 205.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"slategray"            , 9  , {{112.0f / 255.0f, 128.0f / 255.0f, 144.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"slategrey"            , 9  , {{112.0f / 255.0f, 128.0f / 255.0f, 144.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"snow"                 , 4  , {{255.0f / 255.0f, 250.0f / 255.0f, 250.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"springgreen"          , 11 , {{  0.0f / 255.0f, 255.0f / 255.0f, 127.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"steelblue"            , 9  , {{ 70.0f / 255.0f, 130.0f / 255.0f, 180.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"tan"                  , 3  , {{210.0f / 255.0f, 180.0f / 255.0f, 140.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"teal"                 , 4  , {{  0.0f / 255.0f, 128.0f / 255.0f, 128.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"thistle"              , 7  , {{216.0f / 255.0f, 191.0f / 255.0f, 216.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"tomato"               , 6  , {{255.0f / 255.0f,  99.0f / 255.0f,  71.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"turquoise"            , 9  , {{ 64.0f / 255.0f, 224.0f / 255.0f, 208.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"violet"               , 6  , {{238.0f / 255.0f, 130.0f / 255.0f, 238.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"wheat"                , 5  , {{245.0f / 255.0f, 222.0f / 255.0f, 179.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"white"                , 5  , {{255.0f / 255.0f, 255.0f / 255.0f, 255.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"whitesmoke"           , 10 , {{245.0f / 255.0f, 245.0f / 255.0f, 245.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"yellow"               , 6  , {{255.0f / 255.0f, 255.0f / 255.0f,   0.0f / 255.0f, 1.0f}}},
    CSSColorInfo{"yellowgreen"          , 11 , {{154.0f / 255.0f, 205.0f / 255.0f,  50.0f / 255.0f, 1.0f}}}
}};

}
