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
import com.android.xml.AndroidManifest;
import com.google.common.base.Joiner;
import com.google.common.base.Optional;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableList;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.w3c.dom.Attr;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;

import static com.android.manifmerger.MergingReport.Record.Severity.ERROR;
import static com.android.manifmerger.MergingReport.Record.Severity.WARNING;
import static com.android.manifmerger.XmlNode.NodeKey;

/**
 * Validates a loaded {@link XmlDocument} and check for potential inconsistencies in the model due
 * to user error or omission.
 *
 * This is implemented as a separate class so it can be invoked by tools independently from the
 * merging process.
 *
 * This validator will check the state of the loaded xml document before any merging activity is
 * attempted. It verifies things like a "tools:replace="foo" attribute has a "android:foo" attribute
 * also declared on the same element (since we want to replace its value).
 */
public class PreValidator {

  private PreValidator() {
  }

  /**
   * Validates a loaded {@link com.android.manifmerger.XmlDocument} and return a status of the
   * merging model.
   *
   * Will return one the following status : <ul> <li>{@link com.android.manifmerger.MergingReport.Result#SUCCESS}
   * : the merging model is correct, merging should be attempted</li> <li>{@link
   * com.android.manifmerger.MergingReport.Result#WARNING} : the merging model contains non fatal
   * error, user should be notified, merging can be attempted</li> <li>{@link
   * com.android.manifmerger.MergingReport.Result#ERROR} : the merging model contains errors, user
   * must be notified, merging should not be attempted</li> </ul>
   *
   * A successful validation does not mean that the merging will be successful, it only means that
   * the {@link com.android.SdkConstants#TOOLS_URI} instructions are correct and consistent.
   *
   * @param mergingReport report to log warnings and errors.
   * @param xmlDocument the loaded xml part.
   * @return one the {@link com.android.manifmerger.MergingReport.Result} value.
   */
  @NonNull
  public static MergingReport.Result validate(
      @NonNull MergingReport.Builder mergingReport,
      @NonNull XmlDocument xmlDocument) {

    validateManifestAttribute(
        mergingReport, xmlDocument.getRootNode(), xmlDocument.getFileType());
    return validate(mergingReport, xmlDocument.getRootNode());
  }

  private static MergingReport.Result validate(MergingReport.Builder mergingReport,
      XmlElement xmlElement) {

    validateAttributeInstructions(mergingReport, xmlElement);

    validateAndroidAttributes(mergingReport, xmlElement);

    checkSelectorPresence(mergingReport, xmlElement);

    // create a temporary hash map of children indexed by key to ensure key uniqueness.
    Map<NodeKey, XmlElement> childrenKeys = new HashMap<NodeKey, XmlElement>();
    for (XmlElement childElement : xmlElement.getMergeableElements()) {

      // if this element is tagged with 'tools:node=removeAll', ensure it has no other
      // attributes.
      if (childElement.getOperationType() == NodeOperationType.REMOVE_ALL) {
        validateRemoveAllOperation(mergingReport, childElement);
      } else {
        if (checkKeyPresence(mergingReport, childElement)) {
          XmlElement twin = childrenKeys.get(childElement.getId());
          if (twin != null && !childElement.getType().areMultipleDeclarationAllowed()) {
            // we have 2 elements with the same identity, if they are equals,
            // issue a warning, if not, issue an error.
            String message = String.format(
                "Element %1$s at %2$s duplicated with element declared at %3$s",
                childElement.getId(),
                childElement.printPosition(),
                childrenKeys.get(childElement.getId()).printPosition());
            if (twin.compareTo(childElement).isPresent()) {
              childElement.addMessage(mergingReport, ERROR, message);
            } else {
              childElement.addMessage(mergingReport, WARNING, message);
            }
          }
          childrenKeys.put(childElement.getId(), childElement);
        }
        validate(mergingReport, childElement);
      }
    }
    return mergingReport.hasErrors()
        ? MergingReport.Result.ERROR : MergingReport.Result.SUCCESS;
  }

  /**
   * Validate an xml declaration with 'tools:node="removeAll" annotation. There should not be any
   * other attribute declaration on this element.
   */
  private static void validateRemoveAllOperation(MergingReport.Builder mergingReport,
      XmlElement element) {

    NamedNodeMap attributes = element.getXml().getAttributes();
    if (attributes.getLength() > 1) {
      List<String> extraAttributeNames = new ArrayList<String>();
      for (int i = 0; i < attributes.getLength(); i++) {
        Node item = attributes.item(i);
        if (!(SdkConstants.TOOLS_URI.equals(item.getNamespaceURI()) &&
            NodeOperationType.NODE_LOCAL_NAME.equals(item.getLocalName()))) {
          extraAttributeNames.add(item.getNodeName());
        }
      }
      String message = String.format(
          "Element %1$s at %2$s annotated with 'tools:node=\"removeAll\"' cannot "
              + "have other attributes : %3$s",
          element.getId(),
          element.printPosition(),
          Joiner.on(',').join(extraAttributeNames)
      );
      element.addMessage(mergingReport, ERROR, message);
    }
  }

  private static void checkSelectorPresence(MergingReport.Builder mergingReport,
      XmlElement element) {

    Attr selectorAttribute =
        element.getXml().getAttributeNodeNS(SdkConstants.TOOLS_URI, Selector.SELECTOR_LOCAL_NAME);
    if (selectorAttribute != null && !element.supportsSelector()) {
      String message = String.format(
          "Unsupported tools:selector=\"%1$s\" found on node %2$s at %3$s",
          selectorAttribute.getValue(),
          element.getId(),
          element.printPosition());
      element.addMessage(mergingReport, ERROR, message);
    }
  }

  private static void validateManifestAttribute(
      MergingReport.Builder mergingReport, XmlElement manifest, XmlDocument.Type fileType) {
    Attr attributeNode = manifest.getXml().getAttributeNode(AndroidManifest.ATTRIBUTE_PACKAGE);
    // it's ok for an overlay to not have a package name, it's not ok for a main manifest
    // and it's a warning for a library.
    if (attributeNode == null && fileType != XmlDocument.Type.OVERLAY) {
      manifest.addMessage(mergingReport,
          fileType == XmlDocument.Type.MAIN ? ERROR : WARNING,
          String.format(
              "Missing 'package' declaration in manifest at %1$s",
              manifest.printPosition()));
    }
  }

  /**
   * Checks that an element which is supposed to have a key does have one.
   *
   * @param mergingReport report to log warnings and errors.
   * @param xmlElement xml element to check for key presence.
   * @return true if the element has a valid key or false it does not need one or it is invalid.
   */
  private static boolean checkKeyPresence(
      MergingReport.Builder mergingReport,
      XmlElement xmlElement) {
    ManifestModel.NodeKeyResolver nodeKeyResolver = xmlElement.getType().getNodeKeyResolver();
    ImmutableList<String> keyAttributesNames = nodeKeyResolver.getKeyAttributesNames();
    if (keyAttributesNames.isEmpty()) {
      return false;
    }
    if (Strings.isNullOrEmpty(xmlElement.getKey())) {
      // we should have a key but we don't.
      String message = keyAttributesNames.size() > 1
          ? String.format(
          "Missing one of the key attributes '%1$s' on element %2$s at %3$s",
          Joiner.on(',').join(keyAttributesNames),
          xmlElement.getId(),
          xmlElement.printPosition())
          : String.format(
              "Missing '%1$s' key attribute on element %2$s at %3$s",
              keyAttributesNames.get(0),
              xmlElement.getId(),
              xmlElement.printPosition());
      xmlElement.addMessage(mergingReport, ERROR, message);
      return false;
    }
    return true;
  }

  /**
   * Validate attributes part of the {@link com.android.SdkConstants#ANDROID_URI}
   *
   * @param mergingReport report to log warnings and errors.
   * @param xmlElement xml element to check its attributes.
   */
  private static void validateAndroidAttributes(MergingReport.Builder mergingReport,
      XmlElement xmlElement) {
    for (XmlAttribute xmlAttribute : xmlElement.getAttributes()) {
      AttributeModel model = xmlAttribute.getModel();
      if (model != null && model.getOnReadValidator() != null) {
        model.getOnReadValidator().validates(
            mergingReport, xmlAttribute, xmlAttribute.getValue());
      }
    }
  }

  /**
   * Validates attributes part of the {@link com.android.SdkConstants#TOOLS_URI}
   *
   * @param mergingReport report to log warnings and errors.
   * @param xmlElement xml element to check its attributes.
   */
  private static void validateAttributeInstructions(
      MergingReport.Builder mergingReport,
      XmlElement xmlElement) {

    for (Map.Entry<XmlNode.NodeName, AttributeOperationType> attributeOperationTypeEntry :
        xmlElement.getAttributeOperations()) {

      Optional<XmlAttribute> attribute = xmlElement
          .getAttribute(attributeOperationTypeEntry.getKey());
      switch (attributeOperationTypeEntry.getValue()) {
        case STRICT:
          break;
        case REMOVE:
          // check we are not provided a new value.
          if (attribute.isPresent()) {
            // Add one to startLine so the first line is displayed as 1.
            xmlElement.addMessage(mergingReport, ERROR, String.format(
                "tools:remove specified at line:%d for attribute %s, but "
                    + "attribute also declared at line:%d, "
                    + "do you want to use tools:replace instead ?",
                xmlElement.getPosition().getStartLine() + 1,
                attributeOperationTypeEntry.getKey(),
                attribute.get().getPosition().getStartLine() + 1
            ));
          }
          break;
        case REPLACE:
          // check we are provided a new value
          if (!attribute.isPresent()) {
            // Add one to startLine so the first line is displayed as 1.
            xmlElement.addMessage(mergingReport, ERROR, String.format(
                "tools:replace specified at line:%d for attribute %s, but "
                    + "no new value specified",
                xmlElement.getPosition().getStartLine() + 1,
                attributeOperationTypeEntry.getKey()
            ));
          }
          break;
        default:
          throw new IllegalStateException("Unhandled AttributeOperationType " +
              attributeOperationTypeEntry.getValue());
      }
    }
  }
}
