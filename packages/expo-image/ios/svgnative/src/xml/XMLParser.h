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

#include <memory>

namespace SVGNative
{
namespace xml
{
    struct Attribute
    {
        Attribute(bool aFound, const char* aValue)
            : found{aFound}
            , value{aValue}
        {}
        bool found{false};
        const char* value{};
    };

    class XMLNode {
    public:

        virtual const char* GetName() const = 0;
        virtual const char* GetValue() const = 0;

        // Both functions will never get called more than once per XMLNode!
        // Deriving parsers may optimize for this scenario in the implementation.
        // Hence those functions are not const.
        virtual std::unique_ptr<XMLNode> GetFirstNode() = 0;
        virtual std::unique_ptr<XMLNode> GetNextSibling() = 0;

        virtual Attribute GetAttribute(const char*, const char* nsPrefix = nullptr) const = 0;

        virtual ~XMLNode() {}
    };

    class XMLDocument {
    public:
        static std::unique_ptr<XMLDocument> CreateXMLDocument(const char* documentString);
        virtual std::unique_ptr<XMLNode> GetFirstNode() = 0;

        virtual ~XMLDocument() {}
    };
} // namespace xml

} // namespace SVGNative
