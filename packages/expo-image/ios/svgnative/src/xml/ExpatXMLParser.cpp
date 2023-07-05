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
#include "Config.h"

#include <expat.h>
#include <map>
#include <stack>
#include <string>
#include <string.h>

namespace SVGNative
{
namespace xml
{
    class ExpatXMLNode final : public XMLNode {
    public:
        ExpatXMLNode()
        {}

        const char* GetName() const override
        {
            return mName.c_str();
        }

        const char* GetValue() const override
        {
            // Not implemented.
            return nullptr;
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            return std::move(mChild);
        }

        std::unique_ptr<XMLNode> GetNextSibling() override
        {
            return std::move(mSibling);
        }

        Attribute GetAttribute(const char* attrName, const char* xmlNSPrefix) const override
        {
            auto it = mAttributes.find(attrName);
            if (it != mAttributes.end())
                return {true, it->second.c_str()};
            if (xmlNSPrefix)
            {
                std::string newAttrName{xmlNSPrefix};
                newAttrName.append(":");
                newAttrName.append(attrName);
                it = mAttributes.find(newAttrName);
                if (it != mAttributes.end())
                    return {true, it->second.c_str()};
            }
            return {false, {}};
        }

    private:
        friend class ExpatXMLDocument;

        std::string mName;
        std::map<std::string, std::string> mAttributes;
        std::unique_ptr<ExpatXMLNode> mChild;
        std::unique_ptr<ExpatXMLNode> mSibling;
    };

    class ExpatXMLDocument final : public XMLDocument {
    public:
        static std::unique_ptr<XMLDocument> CreateXMLDocument(const char* documentString)
        {
            auto newDocument = new ExpatXMLDocument(documentString);
            return std::unique_ptr<XMLDocument>(newDocument);
        }

        ~ExpatXMLDocument()
        {
        }

        std::unique_ptr<XMLNode> GetFirstNode() override
        {
            return std::move(mRootNode);
        }
    
    private:
        ExpatXMLDocument(const char* documentString)
        {
            XML_Parser parser = XML_ParserCreate(nullptr);
            XML_SetUserData(parser, this);
            XML_SetElementHandler(parser, this->StartElement, this->EndElement);
            int done{0};
            if (XML_Parse(parser, documentString, (int)strlen(documentString), done) == XML_STATUS_ERROR || done)
            {
                mXMLNodeStack = {};
                mRootNode.reset();
            }
            mPreviousSilbingXMLNode = nullptr;
            SVG_ASSERT_MSG(mXMLNodeStack.empty(), "element stack not empty");
            XML_ParserFree(parser);
        }

        static void XMLCALL StartElement(void* userData, const XML_Char* name, const XML_Char** attrs)
        {
            auto node = new ExpatXMLNode{};
            node->mName = name;
            auto& attributes = node->mAttributes;
            while (*attrs)
            {
                auto attrName = *attrs++;
                if (!*attrs)
                    break;
                auto attrValue = *attrs++;
                auto it = attributes.find(attrName);
                if (it == attributes.end())
                    attributes.insert({attrName, attrValue});
            }

            auto document = static_cast<ExpatXMLDocument*>(userData);
            if (document->mXMLNodeStack.empty())
                document->mRootNode = std::unique_ptr<ExpatXMLNode>(node);
            else
            {
                if (document->mStartNodeCalled)
                    document->mXMLNodeStack.top()->mChild = std::unique_ptr<ExpatXMLNode>(node);
                else
                    document->mPreviousSilbingXMLNode->mSibling = std::unique_ptr<ExpatXMLNode>(node);
            }
            document->mXMLNodeStack.push(node);
            document->mStartNodeCalled = true;
        }

        static void XMLCALL EndElement(void* userData, const XML_Char* /*name*/)
        {
            auto document = static_cast<ExpatXMLDocument*>(userData);
            document->mPreviousSilbingXMLNode = document->mXMLNodeStack.top();
            document->mXMLNodeStack.pop();
            document->mStartNodeCalled = false;
        }

    private:
        bool mStartNodeCalled{false};

        // These members have no ownership of the pointers.
        std::stack<ExpatXMLNode*> mXMLNodeStack;
        ExpatXMLNode* mPreviousSilbingXMLNode{};

        std::unique_ptr<ExpatXMLNode> mRootNode;
    };

    std::unique_ptr<XMLDocument> XMLDocument::CreateXMLDocument(const char* documentString)
    {
        return ExpatXMLDocument::CreateXMLDocument(documentString);
    }
} // namespace xml
} // namespace SVGNative
