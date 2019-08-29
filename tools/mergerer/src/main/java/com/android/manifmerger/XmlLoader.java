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

import com.android.ide.common.blame.SourceFile;
import com.android.utils.PositionXmlParser;
import com.google.common.base.Optional;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import javax.xml.parsers.ParserConfigurationException;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import static com.android.manifmerger.ManifestMerger2.SystemProperty;
import static com.android.manifmerger.PlaceholderHandler.KeyBasedValueResolver;

/**
 * Responsible for loading XML files.
 */
public final class XmlLoader {

  private XmlLoader() {
  }

  /**
   * Loads an xml file without doing xml validation and return a {@link XmlDocument}
   *
   * @param displayName the xml file display name.
   * @param xmlFile the xml file.
   * @return the initialized {@link com.android.manifmerger.XmlDocument}
   */
  public static XmlDocument load(
      KeyResolver<String> selectors,
      KeyBasedValueResolver<SystemProperty> systemPropertyResolver,
      String displayName,
      File xmlFile,
      XmlDocument.Type type,
      Optional<String> mainManifestPackageName)
      throws IOException, SAXException, ParserConfigurationException {
    InputStream inputStream = new BufferedInputStream(new FileInputStream(xmlFile));

    Document domDocument = PositionXmlParser.parse(inputStream);
    return domDocument != null ? new XmlDocument(
        new SourceFile(xmlFile, displayName),
        selectors,
        systemPropertyResolver,
        domDocument.getDocumentElement(),
        type,
        mainManifestPackageName)
        : null;
  }

  /**
   * Loads a xml document from its {@link String} representation without doing xml validation and
   * return a {@link com.android.manifmerger.XmlDocument}
   *
   * @param sourceFile the source location to use for logging and record collection.
   * @param xml the persisted xml.
   * @return the initialized {@link com.android.manifmerger.XmlDocument}
   * @throws IOException this should never be thrown.
   * @throws SAXException if the xml is incorrect
   * @throws ParserConfigurationException if the xml engine cannot be configured.
   */
  public static XmlDocument load(
      KeyResolver<String> selectors,
      KeyBasedValueResolver<SystemProperty> systemPropertyResolver,
      SourceFile sourceFile,
      String xml,
      XmlDocument.Type type,
      Optional<String> mainManifestPackageName)
      throws IOException, SAXException, ParserConfigurationException {
    Document domDocument = PositionXmlParser.parse(xml);
    return domDocument != null
        ? new XmlDocument(
        sourceFile,
        selectors,
        systemPropertyResolver,
        domDocument.getDocumentElement(),
        type,
        mainManifestPackageName)
        : null;
  }
}
