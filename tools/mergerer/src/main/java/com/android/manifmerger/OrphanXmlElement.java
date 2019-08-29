/*
 * Copyright (C) 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.android.manifmerger;

import com.android.SdkConstants;
import com.android.annotations.NonNull;
import com.android.annotations.Nullable;
import com.android.ide.common.blame.SourceFile;
import com.android.ide.common.blame.SourcePosition;
import com.android.utils.XmlUtils;
import com.google.common.base.Preconditions;
import com.google.common.base.Strings;
import org.w3c.dom.Element;

import static com.android.manifmerger.ManifestModel.NodeTypes;

/**
 * An xml element that does not belong to a {@link com.android.manifmerger.XmlDocument}
 */
public class OrphanXmlElement extends XmlNode {

  @NonNull
  private final Element mXml;

  @NonNull
  private final NodeTypes mType;

  public OrphanXmlElement(@NonNull Element xml) {

    mXml = Preconditions.checkNotNull(xml);
    NodeTypes nodeType;
    String elementName = mXml.getNodeName();
    // this is bit more complicated than it should be. Look first if there is a namespace
    // prefix in the name, most elements don't. If they do, however, strip it off if it is the
    // android prefix, but if it's custom namespace prefix, classify the node as CUSTOM.
    int indexOfColon = elementName.indexOf(':');
    if (indexOfColon != -1) {
      String androidPrefix = XmlUtils.lookupNamespacePrefix(xml, SdkConstants.ANDROID_URI);
      if (androidPrefix.equals(elementName.substring(0, indexOfColon))) {
        nodeType = NodeTypes.fromXmlSimpleName(elementName.substring(indexOfColon + 1));
      } else {
        nodeType = NodeTypes.CUSTOM;
      }
    } else {
      nodeType = NodeTypes.fromXmlSimpleName(elementName);
    }
    mType = nodeType;
  }

  /**
   * Returns true if this xml element's {@link NodeTypes} is the passed one.
   */
  public boolean isA(NodeTypes type) {
    return this.mType == type;
  }

  @NonNull
  @Override
  public Element getXml() {
    return mXml;
  }

  @Override
  public NodeKey getId() {
    return new NodeKey(Strings.isNullOrEmpty(getKey())
        ? getName().toString()
        : getName().toString() + "#" + getKey());
  }

  @Override
  public NodeName getName() {
    return XmlNode.unwrapName(mXml);
  }

  /**
   * Returns this xml element {@link NodeTypes}
   */
  @NonNull
  public NodeTypes getType() {
    return mType;
  }

  /**
   * Returns the unique key for this xml element within the xml file or null if there can be only
   * one element of this type.
   */
  @Nullable
  public String getKey() {
    return mType.getNodeKeyResolver().getKey(mXml);
  }

  @NonNull
  @Override
  public SourcePosition getPosition() {
    return SourcePosition.UNKNOWN;
  }

  @Override
  @NonNull
  public SourceFile getSourceFile() {
    return SourceFile.UNKNOWN;
  }
}

