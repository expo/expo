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

#include "XMLParser.h"

#include <libxml/tree.h>
#include <libxml/parser.h>

namespace SVGNative
{
namespace xml
{
    class LibXMLNode final : public XMLNode {
    public:
        LibXMLNode(xmlNode* node)
            : mNode{node}
        {}

        const char* GetName() const override
        {
            if (!mNode)
                return nullptr;
            return (const char*)(mNode->name);
        }

        const char* GetValue() const override
        {
            if (!mNode)
                return nullptr;
            return (const char*)(mNode->content);
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            if (!mNode)
                return nullptr;
            auto children = mNode->children;
            while (children && children->type != XML_ELEMENT_NODE)
                children = children->next;
            if (children)
            {
                auto newNode = new LibXMLNode{children};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }

        std::unique_ptr<XMLNode> GetNextSibling() override
        {
            if (!mNode)
                return nullptr;
            
            auto nextSibling = mNode->next;
            while (nextSibling && nextSibling->type != XML_ELEMENT_NODE)
                nextSibling = nextSibling->next;

            if (nextSibling)
            {
                auto newNode = new LibXMLNode{nextSibling};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }

        Attribute GetAttribute(const char* attrName, const char*) const override
        {
            if (!mNode)
                return {false, nullptr};

            auto attr = xmlHasProp(mNode, (const xmlChar*)attrName);
            if (attr)
                return {true, (const char*)xmlGetProp(mNode, (const xmlChar*)(attrName))};

            return {false, nullptr};
        }
    private:
        xmlNode* mNode{};
    };

    class LibXMLDocument final : public XMLDocument {
    public:
        static std::unique_ptr<XMLDocument> CreateXMLDocument(const char* documentString)
        {
            auto newDocument = new LibXMLDocument(documentString);
            return std::unique_ptr<XMLDocument>(newDocument);
        }

        LibXMLDocument(const char* documentString)
        {
            mDocument = xmlReadDoc((const xmlChar*)documentString, nullptr, nullptr, XML_PARSE_RECOVER);
        }

        ~LibXMLDocument()
        {
            xmlFreeDoc(mDocument);
            xmlCleanupParser();
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            if (!mDocument)
                return nullptr;
            if (auto firstNode = xmlDocGetRootElement(mDocument))
            {
                auto newNode = new LibXMLNode{firstNode};
                return std::unique_ptr<XMLNode>(newNode);
            }
            return nullptr;
        }
    private:
        xmlDocPtr mDocument{};
    };

    std::unique_ptr<XMLDocument> XMLDocument::CreateXMLDocument(const char* documentString)
    {
        return LibXMLDocument::CreateXMLDocument(documentString);
    }
} // namespace xml
} // namespace SVGNative
