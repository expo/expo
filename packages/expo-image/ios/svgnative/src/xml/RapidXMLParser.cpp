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

#include "xml/XMLParser.h"

#include <boost/property_tree/detail/xml_parser_read_rapidxml.hpp>

namespace SVGNative
{
namespace xml
{
    class RapidXMLNode final : public XMLNode {
    public:
        RapidXMLNode(const boost::property_tree::detail::rapidxml::xml_node<>* node)
            : mNode{node}
        {}

        const char* GetName() const override
        {
            if (!mNode)
                return nullptr;
            return mNode->name();
        }

        const char* GetValue() const override
        {
            if (!mNode)
                return nullptr;
            return mNode->value();
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            if (!mNode)
                return nullptr;
            if (const auto firstChild = mNode->first_node())
            {
                auto newNode = new RapidXMLNode{firstChild};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }
        std::unique_ptr<XMLNode> GetNextSibling() override
        {
            if (!mNode)
                return nullptr;
            if (const auto nextSibling = mNode->next_sibling())
            {
                auto newNode = new RapidXMLNode{nextSibling};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }

        Attribute GetAttribute(const char* attrName, const char* nsPrefix) const override
        {
            if (!mNode)
                return {false, nullptr};

            if (const auto attr = mNode->first_attribute(attrName))
                return {true, attr->value()};
            if (nsPrefix)
            {
                std::string newAttrName = nsPrefix;
                newAttrName.append(":");
                newAttrName.append(attrName);
                if (const auto attr = mNode->first_attribute(newAttrName.c_str()))
                    return {true, attr->value()};
            }
            return {false, nullptr};
        }
    private:
        const boost::property_tree::detail::rapidxml::xml_node<>* mNode;
    };

    class RapidXMLDocument final : public XMLDocument {
    public:
        static std::unique_ptr<XMLDocument> CreateXMLDocument(const char* documentString)
        {
            auto newDocument = new RapidXMLDocument(documentString);
            return std::unique_ptr<XMLDocument>(newDocument);
        }

        RapidXMLDocument(const char* documentString)
        {
            mDocument.parse<0>((char*)documentString);
        }

        ~RapidXMLDocument()
        {
            mDocument.clear();
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            if (const auto firstNode = mDocument.first_node())
            {
                auto newNode = new RapidXMLNode{firstNode};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }
    private:
        boost::property_tree::detail::rapidxml::xml_document<> mDocument;
    };

    std::unique_ptr<XMLDocument> XMLDocument::CreateXMLDocument(const char* documentString)
    {
        return RapidXMLDocument::CreateXMLDocument(documentString);
    }
} // namespace xml
} // namespace SVGNative
