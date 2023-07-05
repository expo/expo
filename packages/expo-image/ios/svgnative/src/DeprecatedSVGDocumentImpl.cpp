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

#ifdef STYLE_SUPPORT
#include "SVGDocumentImpl.h"
#include "svgnative/SVGDocument.h"
#include "xml/XMLParser.h"

using namespace SVGNative::xml;

namespace SVGNative
{
void SVGDocumentImpl::AddCustomCSS(const StyleSheet::CssDocument* cssDocument) { mOverrideStyle = cssDocument; }

void SVGDocumentImpl::ClearCustomCSS()
{
    const auto elements = mCustomCSSInfo.getElements();
    for (const auto& element : elements)
        mCustomCSSInfo.removeElement(element.getSelector());
    mOverrideStyle = nullptr;
}

void SVGDocumentImpl::ParseStyle(const XMLNode* child)
{
    SVG_ASSERT(mCSSInfo.getElements().size() == 0); // otherwise we need to merge with existing mCSSInfo

    // StyleSheet Library expects one definition per line, so we need to
    // format the string accordingly.
    std::string styleSheet = std::string(child->GetValue());

    SVG_CSS_TRACE("ParseStyle INPUT:\n" << styleSheet);

    // strip out all line breaks
    boost::replace_all(styleSheet, "\r\n", " ");
    boost::replace_all(styleSheet, "\r", " ");
    boost::replace_all(styleSheet, "\n", " ");
    // trim whitespace from head & tail of string
    boost::trim(styleSheet);
    // put each definition on its own line
    boost::replace_all(styleSheet, "} ", "}\n");

    SVG_CSS_TRACE("ParseStyle CLEANED:\n" << styleSheet);

    std::string output;

    boost::tokenizer<boost::char_separator<char>> cssLines(styleSheet, boost::char_separator<char>("\n"));
    for (boost::tokenizer<boost::char_separator<char>>::iterator it = cssLines.begin(); it != cssLines.end(); ++it)
    {
        std::string cssLine{*it};
        boost::trim(cssLine);

        if (cssLine.find(",") == std::string::npos)
        {
            output.append(cssLine);
            output.append("\n");
        }
        else
        {
            auto dataStart = cssLine.find("{");
            std::string cssData(cssLine.substr(dataStart, cssLine.find("}") - dataStart + 1));

            std::string cssClasses(cssLine.substr(0, dataStart));

            boost::tokenizer<boost::char_separator<char>> cssClassTokens(cssClasses, boost::char_separator<char>(","));
            for (boost::tokenizer<boost::char_separator<char>>::iterator itc = cssClassTokens.begin(); itc != cssClassTokens.end(); ++itc)
            {
                output.append(*itc);
                output.append(" ");
                output.append(cssData);
                output.append("\n");
            }
        }
    }

    SVG_CSS_TRACE("ParseStyle OUTPUT:\n" << output);

    // parse style sheet
    mCSSInfo = StyleSheet::CssDocument::parse(output);
}

void SVGDocumentImpl::ApplyCSSStyle(
    const std::set<std::string>& classNames, GraphicStyleImpl& graphicStyle, FillStyleImpl& fillStyle, StrokeStyleImpl& strokeStyle)
{
    if (!mOverrideStyle)
        return;

    for (const auto& className : classNames)
    {
        auto selector = StyleSheet::CssSelector::CssClassSelector(className);
        if (!mOverrideStyle->hasSelector(selector))
            continue;

        auto cssElement = mOverrideStyle->getElement(selector);
        auto properties = cssElement.getProperties();
        ParseGraphicsProperties(graphicStyle, properties);
        ParseFillProperties(fillStyle, properties);
        ParseStrokeProperties(strokeStyle, properties);
    }
}

void SVGDocumentImpl::ParseStyleAttr(const XMLNode* node, std::vector<PropertySet>& propertySets, std::set<std::string>& classNames)
{
    auto attr = node->GetAttribute("style");
    if (attr.found)
    {
        auto cssDoc = StyleSheet::CssDocument::parse(attr.value);
        auto cssElements = cssDoc.getElements();
        if (!cssElements.empty())
        {
            propertySets.push_back(cssElements.front().getProperties());
        }
    }
    // Warning: The inheritance order is incorrect but required by current clients at this point.
    // The code is going to get removed once clients do no longer use "<style>" or
    // override styles.
    attr = node->GetAttribute("class");
    if (attr.found)
    {
        boost::char_separator<char> sep("\n\r\t ");
        std::string cssString = attr.value;
        boost::tokenizer<boost::char_separator<char>> tok(cssString, sep);
        for (boost::tokenizer<boost::char_separator<char>>::iterator it = tok.begin(); it != tok.end(); ++it)
        {
            classNames.insert(*it);
            auto selector = StyleSheet::CssSelector::CssClassSelector(*it);
            auto cssElement = mCSSInfo.getElement(selector);
            propertySets.push_back(cssElement.getProperties());
        }
    }
}

} // namespace SVGNative
#endif
