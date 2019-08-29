/*
 * Copyright (C) 2011 The Android Open Source Project
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
import com.android.annotations.Nullable;
import com.android.annotations.VisibleForTesting;
import com.android.manifmerger.IMergerLog.FileAndLine;
import com.android.manifmerger.IMergerLog.Severity;
import com.android.utils.ILogger;
import com.android.utils.XmlUtils;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.Reader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.xml.sax.ErrorHandler;
import org.xml.sax.InputSource;
import org.xml.sax.SAXParseException;

/**
 * A few XML handling utilities.
 */
class MergerXmlUtils {

  private static final String DATA_ORIGIN_FILE = "manif.merger.file";         //$NON-NLS-1$
  private static final String DATA_FILE_NAME = "manif.merger.filename";     //$NON-NLS-1$
  private static final String DATA_LINE_NUMBER = "manif.merger.line#";        //$NON-NLS-1$

  /**
   * Parses the given XML file as a DOM document. The parser does not validate the DTD nor any kind
   * of schema. It is namespace aware. <p/> This adds a user tag with the original {@link File} to
   * the returned document. You can retrieve this file later by using {@link
   * #extractXmlFilename(Node)}.
   *
   * @param xmlFile The XML {@link File} to parse. Must not be null.
   * @param log An {@link ILogger} for reporting errors. Must not be null.
   * @param merger The {@link ManifestMerger} this document is intended for
   * @return A new DOM {@link Document}, or null.
   */
  @Nullable
  static Document parseDocument(@NonNull final File xmlFile, @NonNull final IMergerLog log,
      @NonNull ManifestMerger merger) {
    try {
      DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
      Reader reader = XmlUtils.getUtfReader(xmlFile);
      InputSource is = new InputSource(reader);
      factory.setNamespaceAware(true);
      factory.setValidating(false);
      DocumentBuilder builder = factory.newDocumentBuilder();

      // We don't want the default handler which prints errors to stderr.
      builder.setErrorHandler(new ErrorHandler() {
        @Override
        public void warning(SAXParseException e) {
          log.error(Severity.WARNING,
              new FileAndLine(xmlFile.getAbsolutePath(), 0),
              "Warning when parsing: %1$s",
              e.toString());
        }

        @Override
        public void fatalError(SAXParseException e) {
          log.error(Severity.ERROR,
              new FileAndLine(xmlFile.getAbsolutePath(), 0),
              "Fatal error when parsing: %1$s",
              xmlFile.getName(), e.toString());
        }

        @Override
        public void error(SAXParseException e) {
          log.error(Severity.ERROR,
              new FileAndLine(xmlFile.getAbsolutePath(), 0),
              "Error when parsing: %1$s",
              e.toString());
        }
      });

      Document doc = builder.parse(is);
      doc.setUserData(DATA_ORIGIN_FILE, xmlFile, null /*handler*/);
      findLineNumbers(doc, 1);

      if (merger.isInsertSourceMarkers()) {
        setSource(doc, xmlFile);
      }

      return doc;
    } catch (FileNotFoundException e) {
      log.error(Severity.ERROR,
          new FileAndLine(xmlFile.getAbsolutePath(), 0),
          "XML file not found");
    } catch (Exception e) {
      log.error(Severity.ERROR,
          new FileAndLine(xmlFile.getAbsolutePath(), 0),
          "Failed to parse XML file: %1$s",
          e.toString());
    }

    return null;
  }

  /**
   * Parses the given XML string as a DOM document. The parser does not validate the DTD nor any
   * kind of schema. It is namespace aware.
   *
   * @param xml The XML string to parse. Must not be null.
   * @param log An {@link ILogger} for reporting errors. Must not be null.
   * @return A new DOM {@link Document}, or null.
   */
  @VisibleForTesting
  @Nullable
  static Document parseDocument(@NonNull String xml,
      @NonNull IMergerLog log,
      @NonNull FileAndLine errorContext) {
    try {
      Document doc = XmlUtils.parseDocument(xml, true);
      findLineNumbers(doc, 1);
      if (errorContext.getFileName() != null) {
        setSource(doc, new File(errorContext.getFileName()));
      }
      return doc;
    } catch (Exception e) {
      log.error(Severity.ERROR, errorContext, "Failed to parse XML string");
    }

    return null;
  }

  /**
   * Decorates the document with the specified file name, which can be retrieved later by calling
   * {@link #extractLineNumber(Node)}. <p/> It also tries to add line number information, with the
   * caveat that the current implementation is a gross approximation. <p/> There is no need to call
   * this after calling one of the {@code parseDocument()} methods since they already decorated
   * their own document.
   *
   * @param doc The document to decorate.
   * @param fileName The name to retrieve later for that document.
   */
  static void decorateDocument(@NonNull Document doc, @NonNull String fileName) {
    doc.setUserData(DATA_FILE_NAME, fileName, null /*handler*/);
    findLineNumbers(doc, 1);
  }

  /**
   * Returns a new {@link FileAndLine} structure that identifies the base filename & line number
   * from which the XML node was parsed. <p/> When the line number is unknown (e.g. if a {@link
   * Document} instance is given) then line number 0 will be used.
   *
   * @param node The node or document where the error occurs. Must not be null.
   * @return A new non-null {@link FileAndLine} combining the file name and line number.
   */
  @NonNull
  static FileAndLine xmlFileAndLine(@NonNull Node node) {
    String name = extractXmlFilename(node);
    int line = extractLineNumber(node); // 0 in case of error or unknown
    return new FileAndLine(name, line);
  }

  /**
   * Extracts the origin {@link File} that {@link #parseDocument(File, IMergerLog, ManifestMerger)}
   * added to the XML document or the string added by
   *
   * @param xmlNode Any node from a document returned by {@link #parseDocument(File, IMergerLog,
   * ManifestMerger)}.
   * @return The {@link File} object used to create the document or null.
   */
  @Nullable
  static String extractXmlFilename(@Nullable Node xmlNode) {
    if (xmlNode != null && xmlNode.getNodeType() != Node.DOCUMENT_NODE) {
      xmlNode = xmlNode.getOwnerDocument();
    }
    if (xmlNode != null) {
      Object data = xmlNode.getUserData(DATA_ORIGIN_FILE);
      if (data instanceof File) {
        return ((File) data).getPath();
      }
      data = xmlNode.getUserData(DATA_FILE_NAME);
      if (data instanceof String) {
        return (String) data;
      }
    }

    return null;
  }

  public static void setSource(@NonNull Node node, @NonNull File source) {
    //noinspection ConstantConditions
    for (; node != null; node = node.getNextSibling()) {
      short nodeType = node.getNodeType();
      if (nodeType == Node.ELEMENT_NODE
          || nodeType == Node.COMMENT_NODE
          || nodeType == Node.DOCUMENT_NODE
          || nodeType == Node.CDATA_SECTION_NODE) {
        node.setUserData(DATA_ORIGIN_FILE, source, null);
      }
      Node child = node.getFirstChild();
      setSource(child, source);
    }
  }

  /**
   * This is a CRUDE INEXACT HACK to decorate the DOM with some kind of line number information for
   * elements. It's inexact because by the time we get the DOM we already have lost all the
   * information about whitespace between attributes. <p/> Also we don't even try to deal with \n vs
   * \r vs \r\n insanity. This only counts the \n occurring in text nodes to determine line
   * advances, which is clearly flawed. <p/> However it's good enough for testing, and we'll replace
   * it by a PositionXmlParser once it's moved into com.android.util.
   */
  private static int findLineNumbers(Node node, int line) {
    for (; node != null; node = node.getNextSibling()) {
      node.setUserData(DATA_LINE_NUMBER, Integer.valueOf(line), null /*handler*/);

      if (node.getNodeType() == Node.TEXT_NODE) {
        String text = node.getNodeValue();
        if (text.length() > 0) {
          for (int pos = 0; (pos = text.indexOf('\n', pos)) != -1; pos++) {
            ++line;
          }
        }
      }

      Node child = node.getFirstChild();
      if (child != null) {
        line = findLineNumbers(child, line);
      }
    }
    return line;
  }

  /**
   * Extracts the line number that {@link #findLineNumbers} added to the XML nodes.
   *
   * @param xmlNode Any node from a document returned by {@link #parseDocument(File, IMergerLog,
   * ManifestMerger)}.
   * @return The line number if found or 0.
   */
  static int extractLineNumber(@Nullable Node xmlNode) {
    if (xmlNode != null) {
      Object data = xmlNode.getUserData(DATA_LINE_NUMBER);
      if (data instanceof Integer) {
        return ((Integer) data).intValue();
      }
    }

    return 0;
  }

  /**
   * Outputs the given XML {@link Document} to the file {@code outFile}.
   *
   * TODO right now reformats the document. Needs to output as-is, respecting white-space.
   *
   * @param doc The document to output. Must not be null.
   * @param outFile The {@link File} where to write the document.
   * @param log A log in case of error.
   * @return True if the file was written, false in case of error.
   */
  static boolean printXmlFile(
      @NonNull Document doc,
      @NonNull File outFile,
      @NonNull IMergerLog log) {
    // Quick thing based on comments from http://stackoverflow.com/questions/139076
    try {
      Transformer tf = TransformerFactory.newInstance().newTransformer();
      tf.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");         //$NON-NLS-1$
      tf.setOutputProperty(OutputKeys.ENCODING, "UTF-8");                   //$NON-NLS-1$
      tf.setOutputProperty(OutputKeys.INDENT, "yes");                       //$NON-NLS-1$
      tf.setOutputProperty("{http://xml.apache.org/xslt}indent-amount",     //$NON-NLS-1$
          "4");                                            //$NON-NLS-1$
      tf.transform(new DOMSource(doc), new StreamResult(outFile));
      return true;
    } catch (TransformerException e) {
      log.error(Severity.ERROR,
          new FileAndLine(outFile.getName(), 0),
          "Failed to write XML file: %1$s",
          e.toString());
      return false;
    }
  }

  /**
   * Outputs the given XML {@link Document} as a string.
   *
   * TODO right now reformats the document. Needs to output as-is, respecting white-space.
   *
   * @param doc The document to output. Must not be null.
   * @param log A log in case of error.
   * @return A string representation of the XML. Null in case of error.
   */
  static String printXmlString(
      @NonNull Document doc,
      @NonNull IMergerLog log) {
    try {
      Transformer tf = TransformerFactory.newInstance().newTransformer();
      tf.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");        //$NON-NLS-1$
      tf.setOutputProperty(OutputKeys.ENCODING, "UTF-8");                  //$NON-NLS-1$
      tf.setOutputProperty(OutputKeys.INDENT, "yes");                      //$NON-NLS-1$
      tf.setOutputProperty("{http://xml.apache.org/xslt}indent-amount",    //$NON-NLS-1$
          "4");                                           //$NON-NLS-1$
      StringWriter sw = new StringWriter();
      tf.transform(new DOMSource(doc), new StreamResult(sw));
      return sw.toString();
    } catch (TransformerException e) {
      log.error(Severity.ERROR,
          new FileAndLine(extractXmlFilename(doc), 0),
          "Failed to write XML file: %1$s",
          e.toString());
      return null;
    }
  }

  /**
   * Dumps the structure of the DOM to a simple text string.
   *
   * @param node The first node to dump (recursively). Can be null.
   * @param nextSiblings If true, will also dump the following siblings. If false, it will just
   * process the given node.
   * @return A string representation of the Node structure, useful for debugging.
   */
  @NonNull
  static String dump(@Nullable Node node, boolean nextSiblings) {
    return dump(node, 0 /*offset*/, nextSiblings, true /*deep*/, null /*keyAttr*/);
  }

  /**
   * Dumps the structure of the DOM to a simple text string. Each line is terminated with a \n
   * separator.
   *
   * @param node The first node to dump. Can be null.
   * @param offsetIndex The offset to add at the begining of each line. Each offset is converted
   * into 2 space characters.
   * @param nextSiblings If true, will also dump the following siblings. If false, it will just
   * process the given node.
   * @param deep If true, this will recurse into children.
   * @param keyAttr An optional attribute *local* name to insert when writing an element. For
   * example when writing an Activity, it helps to always insert "name" attribute.
   * @return A string representation of the Node structure, useful for debugging.
   */
  @NonNull
  static String dump(
      @Nullable Node node,
      int offsetIndex,
      boolean nextSiblings,
      boolean deep,
      @Nullable String keyAttr) {
    StringBuilder sb = new StringBuilder();

    String offset = "";                 //$NON-NLS-1$
    for (int i = 0; i < offsetIndex; i++) {
      offset += "  ";                 //$NON-NLS-1$
    }

    if (node == null) {
      sb.append(offset).append("(end reached)\n");
    } else {
      for (; node != null; node = node.getNextSibling()) {
        String type = null;
        short t = node.getNodeType();
        switch (t) {
          case Node.ELEMENT_NODE:
            String attr = "";
            if (keyAttr != null) {
              for (Node a : sortedAttributeList(node.getAttributes())) {
                if (a != null && keyAttr.equals(a.getLocalName())) {
                  attr = String.format(" %1$s=%2$s",
                      a.getNodeName(), a.getNodeValue());
                  break;
                }
              }
            }
            sb.append(String.format("%1$s<%2$s%3$s>\n",
                offset, node.getNodeName(), attr));
            break;
          case Node.COMMENT_NODE:
            sb.append(String.format("%1$s<!-- %2$s -->\n",
                offset, node.getNodeValue()));
            break;
          case Node.TEXT_NODE:
            String txt = node.getNodeValue().trim();
            if (txt.length() == 0) {
              // Keep this for debugging. TODO make it a flag
              // to dump whitespace on debugging. Otherwise ignore it.
              // txt = "[whitespace]";
              break;
            }
            sb.append(String.format("%1$s%2$s\n", offset, txt));
            break;
          case Node.ATTRIBUTE_NODE:
            sb.append(String.format("%1$s    @%2$s = %3$s\n",
                offset, node.getNodeName(), node.getNodeValue()));
            break;
          case Node.CDATA_SECTION_NODE:
            type = "cdata";                 //$NON-NLS-1$
            break;
          case Node.DOCUMENT_NODE:
            type = "document";              //$NON-NLS-1$
            break;
          case Node.PROCESSING_INSTRUCTION_NODE:
            type = "PI";                    //$NON-NLS-1$
            break;
          default:
            type = Integer.toString(t);
        }

        if (type != null) {
          sb.append(String.format("%1$s[%2$s] <%3$s> %4$s\n",
              offset, type, node.getNodeName(), node.getNodeValue()));
        }

        if (deep) {
          for (Attr attr : sortedAttributeList(node.getAttributes())) {
            sb.append(String.format("%1$s    @%2$s = %3$s\n",
                offset, attr.getNodeName(), attr.getNodeValue()));
          }

          Node child = node.getFirstChild();
          if (child != null) {
            sb.append(dump(child, offsetIndex + 1, true, true, keyAttr));
          }
        }

        if (!nextSiblings) {
          break;
        }
      }
    }
    return sb.toString();
  }

  /**
   * Returns a sorted list of attributes. The list is never null and does not contain null items.
   *
   * @param attrMap A Node map as returned by {@link Node#getAttributes()}. Can be null, in which
   * case an empty list is returned.
   * @return A non-null, possible empty, list of all nodes that are actual {@link Attr}, sorted by
   * increasing attribute name.
   */
  @NonNull
  static List<Attr> sortedAttributeList(@Nullable NamedNodeMap attrMap) {
    List<Attr> list = new ArrayList<Attr>();

    if (attrMap != null) {
      for (int i = 0; i < attrMap.getLength(); i++) {
        Node attr = attrMap.item(i);
        if (attr instanceof Attr) {
          list.add((Attr) attr);
        }
      }
    }

    if (list.size() > 1) {
      // Sort it by attribute name
      Collections.sort(list, getAttrComparator());
    }

    return list;
  }

  /**
   * Returns a comparator for {@link Attr}, alphabetically sorted by name. The "name" attribute is
   * special and always sorted to the front.
   */
  @NonNull
  static Comparator<? super Attr> getAttrComparator() {
    return new Comparator<Attr>() {
      @Override
      public int compare(Attr a1, Attr a2) {
        String s1 = a1 == null ? "" : a1.getNodeName();         //$NON-NLS-1$
        String s2 = a2 == null ? "" : a2.getNodeName();         //$NON-NLS-1$

        boolean name1 = s1.equals("name");                      //$NON-NLS-1$
        boolean name2 = s2.equals("name");                      //$NON-NLS-1$

        if (name1 && name2) {
          return 0;
        } else if (name1) {
          return -1;  // name is always first
        } else if (name2) {
          return 1;  // name is always first
        } else {
          return s1.compareTo(s2);
        }
      }
    };
  }

  /**
   * Inject attributes into an existing document. <p/> The map keys are
   * "/manifest/elements...|attribute-ns-uri attribute-local-name", for example
   * "/manifest/uses-sdk|http://schemas.android.com/apk/res/android minSdkVersion". (note the space
   * separator between the attribute URI and its local name.) The elements will be created if they
   * don't exists. Existing attributes will be modified. The replacement is done on the main
   * document <em>before</em> merging. The value can be null to remove an existing attribute.
   *
   * @param doc The document to modify in-place.
   * @param attributeMap A map of attributes to inject in the form [pseudo-xpath] => value.
   * @param log A log in case of error.
   */
  static void injectAttributes(
      @Nullable Document doc,
      @Nullable Map<String, String> attributeMap,
      @NonNull IMergerLog log) {
    if (doc == null || attributeMap == null || attributeMap.isEmpty()) {
      return;
    }

    //                                        1=path  2=URI    3=local name
    final Pattern keyRx = Pattern.compile("^/([^\\|]+)\\|([^ ]*) +(.+)$");      //$NON-NLS-1$
    final FileAndLine docInfo = xmlFileAndLine(doc);

    nextAttribute:
    for (Entry<String, String> entry : attributeMap.entrySet()) {
      String key = entry.getKey();
      String value = entry.getValue();
      if (key == null || key.isEmpty()) {
        continue;
      }

      Matcher m = keyRx.matcher(key);
      if (!m.matches()) {
        log.error(Severity.WARNING, docInfo, "Invalid injected attribute key: %s", key);
        continue;
      }
      String path = m.group(1);
      String attrNsUri = m.group(2);
      String attrName = m.group(3);

      String[] segment = path.split(Pattern.quote("/"));                      //$NON-NLS-1$

      // Get the path elements. Create them as needed if they don't exist.
      Node element = doc;
      nextSegment:
      for (int i = 0; i < segment.length; i++) {
        // Find a child with the segment's name
        String name = segment[i];
        for (Node child = element.getFirstChild();
            child != null;
            child = child.getNextSibling()) {
          if (child.getNodeType() == Node.ELEMENT_NODE &&
              child.getNamespaceURI() == null &&
              child.getNodeName().equals(name)) {
            // Found it. Continue to the next inner segment.
            element = child;
            continue nextSegment;
          }
        }
        // No such element. Create it.
        if (value == null) {
          // If value is null, we want to remove, not create and if can't find the
          // element, then we're done: there's no such attribute to remove.
          break nextAttribute;
        }

        Element child = doc.createElement(name);
        element = element.insertBefore(child, element.getFirstChild());
      }

      if (element == null) {
        log.error(Severity.WARNING, docInfo, "Invalid injected attribute path: %s", path);
        return;
      }

      NamedNodeMap attrs = element.getAttributes();
      if (attrs != null) {

        if (attrNsUri != null && attrNsUri.isEmpty()) {
          attrNsUri = null;
        }
        Node attr = attrs.getNamedItemNS(attrNsUri, attrName);

        if (value == null) {
          // We want to remove the attribute from the attribute map.
          if (attr != null) {
            attrs.removeNamedItemNS(attrNsUri, attrName);
          }
        } else {
          // We want to add or replace the attribute.
          if (attr == null) {
            attr = doc.createAttributeNS(attrNsUri, attrName);
            if (attrNsUri != null) {
              attr.setPrefix(XmlUtils.lookupNamespacePrefix(element, attrNsUri));
            }
            attrs.setNamedItemNS(attr);
          }
          attr.setNodeValue(value);
        }
      }
    }
  }

  // -------

  /**
   * Flatten the element to a string. This "pretty prints" the XML tree starting from the given node
   * and all its children and attributes. <p/> The output is designed to be printed using {@link
   * #printXmlDiff}.
   *
   * @param node The root node to print.
   * @param nsPrefix A map that is filled with all the URI=>prefix found. The internal string only
   * contains the expanded URIs but this is rather verbose so when printing the diff these will be
   * replaced by the prefixes collected here.
   * @param prefix A "space" prefix added at the beginning of each line for indentation purposes.
   * The diff printer later relies on this to find out the structure.
   */
  @NonNull
  static String printElement(
      @NonNull Node node,
      @NonNull Map<String, String> nsPrefix,
      @NonNull String prefix) {
    StringBuilder sb = new StringBuilder();
    sb.append(prefix).append('<');
    String uri = node.getNamespaceURI();
    if (uri != null) {
      sb.append(uri).append(':');
      nsPrefix.put(uri, node.getPrefix());
    }
    sb.append(node.getLocalName());
    printAttributes(sb, node, nsPrefix, prefix);
    sb.append(">\n");                                                           //$NON-NLS-1$
    printChildren(sb, node.getFirstChild(), true, nsPrefix, prefix + "    ");   //$NON-NLS-1$

    sb.append(prefix).append("</");                                             //$NON-NLS-1$
    if (uri != null) {
      sb.append(uri).append(':');
    }
    sb.append(node.getLocalName());
    sb.append(">\n");                                                           //$NON-NLS-1$

    return sb.toString();
  }

  /**
   * Flatten several children elements to a string. This is an implementation detail for {@link
   * #printElement(Node, Map, String)}. <p/> If {@code nextSiblings} is false, the string conversion
   * takes only the given child element and stops there. <p/> If {@code nextSiblings} is true, the
   * string conversion also takes _all_ the siblings after the given element. The idea is the caller
   * can call this with the first child of a parent and get a string showing all the children at the
   * same time. They are sorted to avoid the ordering issue.
   */
  @NonNull
  private static StringBuilder printChildren(
      @NonNull StringBuilder sb,
      @NonNull Node child,
      boolean nextSiblings,
      @NonNull Map<String, String> nsPrefix,
      @NonNull String prefix) {
    ArrayList<String> children = new ArrayList<String>();

    boolean hasText = false;
    for (; child != null; child = child.getNextSibling()) {
      short t = child.getNodeType();
      if (nextSiblings && t == Node.TEXT_NODE) {
        // We don't typically have meaningful text nodes in an Android manifest.
        // If there are, just dump them as-is into the element representation.
        // We do trim whitespace and ignore all-whitespace or empty text nodes.
        String s = child.getNodeValue().trim();
        if (s.length() > 0) {
          sb.append(s);
          hasText = true;
        }
      } else if (t == Node.ELEMENT_NODE) {
        children.add(printElement(child, nsPrefix, prefix));
        if (!nextSiblings) {
          break;
        }
      }
    }

    if (hasText) {
      sb.append('\n');
    }

    if (!children.isEmpty()) {
      Collections.sort(children);
      for (String s : children) {
        sb.append(s);
      }
    }

    return sb;
  }

  /**
   * Flatten several attributes to a string using their alphabetical order. This is an
   * implementation detail for {@link #printElement(Node, Map, String)}.
   */
  @NonNull
  private static StringBuilder printAttributes(
      @NonNull StringBuilder sb,
      @NonNull Node node,
      @NonNull Map<String, String> nsPrefix,
      @NonNull String prefix) {
    ArrayList<String> attrs = new ArrayList<String>();

    NamedNodeMap attrMap = node.getAttributes();
    if (attrMap != null) {
      StringBuilder sb2 = new StringBuilder();
      for (int i = 0; i < attrMap.getLength(); i++) {
        Node attr = attrMap.item(i);
        if (attr instanceof Attr) {
          sb2.setLength(0);
          sb2.append('@');
          String uri = attr.getNamespaceURI();
          if (uri != null) {
            sb2.append(uri).append(':');
            nsPrefix.put(uri, attr.getPrefix());
          }
          sb2.append(attr.getLocalName());
          sb2.append("=\"").append(attr.getNodeValue()).append('\"');     //$NON-NLS-1$
          attrs.add(sb2.toString());
        }
      }
    }

    Collections.sort(attrs);

    for (String attr : attrs) {
      sb.append('\n');
      sb.append(prefix).append("    ").append(attr);                          //$NON-NLS-1$
    }
    return sb;
  }

  //------------

  /**
   * Computes a quick diff between two strings generated by {@link #printElement(Node, Map,
   * String)}. <p/> This is a <em>not</em> designed to be a full contextual diff. It just stops at
   * the first difference found, printing up to 3 lines of diff and backtracking to add prior
   * contextual information to understand the structure of the element where the first diff line
   * occurred (by printing each parent found till the root one as well as printing the attribute
   * named by {@code keyAttr}).
   *
   * @param sb The string builder where to output is written.
   * @param expected The expected XML tree (as generated by {@link #printElement}.) For best result
   * this would be the "destination" XML we're merging into, e.g. the main manifest.
   * @param actual The actual XML tree (as generated by {@link #printElement}.) For best result this
   * would be the "source" XML we're merging from, e.g. a library manifest.
   * @param nsPrefixE The map of URI=>prefix for the expected XML tree.
   * @param nsPrefixA The map of URI=>prefix for the actual XML tree.
   * @param keyAttr An optional attribute *full* name (uri:local name) to always insert when writing
   * the contextual lines before a diff line. For example when writing an Activity, it helps to
   * always insert the "name" attribute since that's the key element to help the user identify which
   * node is being dumped.
   */
  static void printXmlDiff(
      StringBuilder sb,
      String expected,
      String actual,
      Map<String, String> nsPrefixE,
      Map<String, String> nsPrefixA,
      String keyAttr) {
    String[] aE = expected.split("\n");
    String[] aA = actual.split("\n");
    int lE = aE.length;
    int lA = aA.length;
    int lm = lE < lA ? lA : lE;
    boolean eofE = false;
    boolean eofA = false;
    boolean contextE = true;
    boolean contextA = true;
    int numDiff = 0;

    StringBuilder sE = new StringBuilder();
    StringBuilder sA = new StringBuilder();

    outerLoop:
    for (int i = 0, iE = 0, iA = 0; i < lm; i++) {
      if (iE < lE && iA < lA && aE[iE].equals(aA[iA])) {
        if (numDiff > 0) {
          // If we found a difference, stop now.
          break outerLoop;
        }
        iE++;
        iA++;
        continue;
      } else {
        // Try to print some context for each side based on previous lines's space prefix.
        if (contextE) {
          if (iE > 0) {
            String p = diffGetPrefix(aE[iE]);
            for (int kE = iE - 1; kE >= 0; kE--) {
              if (!aE[kE].startsWith(p)) {
                sE.insert(0, '\n').insert(0, diffReplaceNs(aE[kE], nsPrefixE)).insert(0, "  ");
                if (p.length() == 0) {
                  break;
                }
                p = diffGetPrefix(aE[kE]);
              } else if (aE[kE].contains(keyAttr) || kE == 0) {
                sE.insert(0, '\n').insert(0, diffReplaceNs(aE[kE], nsPrefixE)).insert(0, "  ");
              }
            }
          }
          contextE = false;
        }
        if (iE >= lE) {
          if (!eofE) {
            sE.append("--(end reached)\n");
            eofE = true;
          }
        } else {
          sE.append("--").append(diffReplaceNs(aE[iE++], nsPrefixE)).append('\n');
        }

        if (contextA) {
          if (iA > 0) {
            String p = diffGetPrefix(aA[iA]);
            for (int kA = iA - 1; kA >= 0; kA--) {
              if (!aA[kA].startsWith(p)) {
                sA.insert(0, '\n').insert(0, diffReplaceNs(aA[kA], nsPrefixA)).insert(0, "  ");
                p = diffGetPrefix(aA[kA]);
                if (p.length() == 0) {
                  break;
                }
              } else if (aA[kA].contains(keyAttr) || kA == 0) {
                sA.insert(0, '\n').insert(0, diffReplaceNs(aA[kA], nsPrefixA)).insert(0, "  ");
              }
            }
          }
          contextA = false;
        }
        if (iA >= lA) {
          if (!eofA) {
            sA.append("++(end reached)\n");
            eofA = true;
          }
        } else {
          sA.append("++").append(diffReplaceNs(aA[iA++], nsPrefixA)).append('\n');
        }

        // Dump up to 3 lines of difference
        numDiff++;
        if (numDiff == 3) {
          break outerLoop;
        }
      }
    }

    sb.append(sE);
    sb.append(sA);
  }

  /**
   * Returns all the whitespace at the beginning of a string. Implementation details for {@link
   * #printXmlDiff} used to find the "parent" element and include it in the context of the diff.
   */
  private static String diffGetPrefix(String str) {
    int pos = 0;
    int len = str.length();
    while (pos < len && str.charAt(pos) == ' ') {
      pos++;
    }
    return str.substring(0, pos);
  }

  /**
   * Simplifies a diff line by replacing NS URIs by their prefix. Implementation details for {@link
   * #printXmlDiff}.
   */
  private static String diffReplaceNs(String str, Map<String, String> nsPrefix) {
    for (Entry<String, String> entry : nsPrefix.entrySet()) {
      String uri = entry.getKey();
      String prefix = entry.getValue();
      if (prefix != null && str.contains(uri)) {
        str = str.replaceAll(Pattern.quote(uri), Matcher.quoteReplacement(prefix));
      }
    }
    return str;
  }

  /**
   * Returns the file associated with the given specific node, if any. Note that this will not
   * search upwards for parent nodes; it returns a file associated with this specific node, if any.
   */
  @Nullable
  public static File getFileFor(@NonNull Node node) {
    return (File) node.getUserData(DATA_ORIGIN_FILE);
  }

  /**
   * Sets the file associated with the given node, if any
   */
  public static void setFileFor(Node node, File file) {
    node.setUserData(MergerXmlUtils.DATA_ORIGIN_FILE, file, null);
  }
}
