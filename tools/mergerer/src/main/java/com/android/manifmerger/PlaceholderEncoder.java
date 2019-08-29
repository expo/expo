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

import com.android.annotations.NonNull;
import java.util.regex.Matcher;

/**
 * encode all non resolved placeholders key names.
 */
public class PlaceholderEncoder {

  /**
   * Visits a document's entire tree and check each attribute for a placeholder existence. If one is
   * found, encode its name so tools like aapt will not object invalid characters and such. <p>
   *
   * @param xmlDocument the xml document to visit
   */
  public void visit(@NonNull XmlDocument xmlDocument) {

    visit(xmlDocument.getRootNode());
  }

  private void visit(@NonNull XmlElement xmlElement) {

    for (XmlAttribute xmlAttribute : xmlElement.getAttributes()) {
      Matcher matcher = PlaceholderHandler.PATTERN.matcher(xmlAttribute.getValue());
      if (matcher.matches()) {
        String encodedValue = "dollar_openBracket_" + matcher.group(2) + "_closeBracket";
        xmlAttribute.getXml().setValue(encodedValue);
      }
    }
    for (XmlElement childElement : xmlElement.getMergeableElements()) {
      visit(childElement);
    }
  }
}
