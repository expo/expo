// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma once 

#include "pch.h"
#include "winrt/ReactNativeWebView.h"

using namespace winrt::ReactNativeWebView;

namespace winrt::ReactNativeWebView::implementation {
    namespace ReactWebViewHelpers {
        std::string TrimString(const std::string& str) {
            std::string trimmedString = str;

            // Trim from start
            trimmedString.erase(0, trimmedString.find_first_not_of(" \t\n\r\f\v"));

            // Trim from end
            trimmedString.erase(trimmedString.find_last_not_of(" \t\n\r\f\v") + 1);

            return trimmedString;
        }
        
        std::vector<std::string> SplitString(
            const std::string& str,
            const std::string& delim) {
            std::vector<std::string> tokens;
            auto startPos = 0;
            auto endPos = str.find(delim);

            while (endPos != std::string::npos) {
                auto token = str.substr(startPos, endPos - startPos);
                tokens.push_back(TrimString(token));

                startPos = endPos + delim.length();
                endPos = str.find(delim, startPos);
            }

            auto lastToken = str.substr(startPos);
            tokens.push_back(TrimString(lastToken));

            return tokens;
        }

        std::map<std::string, std::string> ParseSetCookieHeader(
            const std::string& setCookieHeader) {
            std::map<std::string, std::string> cookie;

            // Split the header into individual cookie strings
            auto cookieStrings = SplitString(setCookieHeader, ";");

            // Extract the cookie name and value from the first string
            auto nameValuePair = SplitString(cookieStrings[0], "=");
            cookie["Name"] = TrimString(nameValuePair[0]);
            cookie["Value"] = TrimString(nameValuePair[1]);

            // Extract the attributes from the remaining strings
            for (std::size_t i = 1; i < cookieStrings.size(); ++i) {
                auto attributeValuePair = SplitString(cookieStrings[i], "=");
                auto attributeName = attributeValuePair[0];
                auto attributeValue =
                    attributeValuePair.size() > 1 ? attributeValuePair[1] : "";
                cookie[attributeName] = TrimString(attributeValue);
            }

            return cookie;
        }
    }
} // namespace winrt::ReactNativeWebView::implementation