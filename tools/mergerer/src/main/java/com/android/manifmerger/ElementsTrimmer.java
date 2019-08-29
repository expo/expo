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
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import org.w3c.dom.Attr;

import static com.android.SdkConstants.ANDROID_URI;

/**
 * Trims the document from unwanted, repeated elements.
 */
public class ElementsTrimmer {

  /**
   * Trims unwanted, duplicated elements from the merged document. <p> Current trimmed elements are
   * : <p> <ul> <li>uses-features with glEsVersion key</li> <ul> <li>The highest 1.x version element
   * will be kept regardless of 'required' flag value</li> <li>If the above element is present and
   * has a 'false' required flag, there can be at most one element of a lesser version with
   * 'required' attribute set to true.</li> <li>The highest 2.x or superior element will be kept
   * regardless of 'required' flag value </li> <li>If the above element is present and has a 'false'
   * required flag, there can be at most one element of a lesser version (but higher than 2.0) with
   * a 'required' attribute set to true.</li> </ul> </ul>
   *
   * @param xmlDocument the xml document to trim.
   * @param mergingReport the report to log errors and actions.
   */
  public static void trim(
      @NonNull XmlDocument xmlDocument,
      @NonNull MergingReport.Builder mergingReport) {

    // I sort the glEsVersion declaration by value.
    NavigableMap<Integer, XmlElement> glEsVersionDeclarations = new TreeMap<Integer, XmlElement>();

    for (XmlElement childElement : xmlDocument.getRootNode().getMergeableElements()) {
      if (childElement.getType().equals(ManifestModel.NodeTypes.USES_FEATURE)) {
        Integer value = getGlEsVersion(childElement);
        if (value != null) {
          glEsVersionDeclarations.put(value, childElement);
        }
      }
    }

    // now eliminate all unwanted declarations, revert the sorted map, so we get the
    // higher elements first.
    glEsVersionDeclarations = glEsVersionDeclarations.descendingMap();
    boolean doneWithAboveTwoTrue = false;
    boolean doneWithAboveTwoFalse = false;
    boolean doneWithBelowTwoTrue = false;
    boolean doneWithBelowTwoFalse = false;
    for (Map.Entry<Integer, XmlElement> glEsVersionDeclaration :
        glEsVersionDeclarations.entrySet()) {

      boolean removeElement;

      Attr requiredAttribute = glEsVersionDeclaration.getValue().getXml().getAttributeNodeNS(
          ANDROID_URI, AndroidManifest.ATTRIBUTE_REQUIRED);

      boolean isRequired = requiredAttribute == null ||
          Boolean.parseBoolean(requiredAttribute.getValue());

      if (glEsVersionDeclaration.getKey() < 0x20000) {
        // version one.
        removeElement = (doneWithBelowTwoFalse && doneWithBelowTwoTrue)
            || (isRequired && doneWithBelowTwoTrue)
            || (!isRequired && doneWithBelowTwoFalse);

        if (!removeElement) {
          doneWithBelowTwoFalse = true;
          doneWithBelowTwoTrue = isRequired;
        }
      } else {
        // version two or above.
        removeElement = (doneWithAboveTwoFalse && doneWithAboveTwoTrue)
            || (isRequired && doneWithAboveTwoTrue)
            || (!isRequired && doneWithAboveTwoFalse);

        if (!removeElement) {
          doneWithAboveTwoFalse = true;
          doneWithAboveTwoTrue = isRequired;
        }
      }
      if (removeElement) {
        // if the node only contains glEsVersion, then remove the entire node,
        // if it also contains android:name, just remove the glEsVersion attribute
        if (glEsVersionDeclaration.getValue().getXml().getAttributeNodeNS(ANDROID_URI,
            SdkConstants.ATTR_NAME) != null) {
          glEsVersionDeclaration.getValue().getXml().removeAttributeNS(ANDROID_URI,
              AndroidManifest.ATTRIBUTE_GLESVERSION);
          mergingReport.getActionRecorder().recordAttributeAction(
              glEsVersionDeclaration.getValue().getAttribute(XmlNode.fromXmlName(
                  "android:" + AndroidManifest.ATTRIBUTE_GLESVERSION)).get(),
              Actions.ActionType.REJECTED,
              null /* attributeOperationType */);
        } else {
          xmlDocument.getRootNode().getXml().removeChild(
              glEsVersionDeclaration.getValue().getXml());
          mergingReport.getActionRecorder().recordNodeAction(
              glEsVersionDeclaration.getValue(),
              Actions.ActionType.REJECTED);
        }
      }
    }
  }

  private static Integer getGlEsVersion(XmlElement xmlElement) {
    Attr glEsVersion = xmlElement.getXml()
        .getAttributeNodeNS(ANDROID_URI, AndroidManifest.ATTRIBUTE_GLESVERSION);
    if (glEsVersion == null) {
      return null;
    }
    return getHexValue(glEsVersion);
  }

  private static Integer getHexValue(Attr attribute) {
    return Integer.decode(attribute.getValue());
  }
}


