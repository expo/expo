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

import com.android.SdkConstants;
import com.android.annotations.NonNull;
import com.android.annotations.Nullable;
import com.android.manifmerger.IMergerLog.FileAndLine;
import com.android.manifmerger.IMergerLog.Severity;
import com.android.utils.SdkUtils;
import com.android.utils.XmlUtils;
import com.android.xml.AndroidXPathFactory;
import java.io.File;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 * Merges a library manifest into a main application manifest. <p/> To use, create with {@link
 * ManifestMerger#ManifestMerger(IMergerLog, ICallback)} then call {@link
 * ManifestMerger#process(File, File, File[], Map, String)}. <p/>
 * <pre> Merge operations:
 * - root manifest: attributes ignored, warn if defined.
 * - application:
 *      G- {@code @attributes}: most attributes are ignored in libs
 *          except: application:name if defined, it must match.
 *          except: application:agentBackup if defined, it must match.
 *          (these represent class names and we don't want a lib to assume their app or backup
 *           classes are being used when that will never be the case.)
 *      C- activity / activity-alias / service / receiver / provider
 *          => Merge as-is. Error if exists in the destination (same {@code @name})
 *             unless the definitions are exactly the same.
 *             New elements are always merged at the end of the application element.
 *          => Indicate if there's a dup.
 *      D- uses-library
 *          => Merge. OK if already exists same {@code @name}.
 *          => Merge {@code @required}: true>false.
 *      C- meta-data
 *          => Merge as-is. Error if exists in the destination (same {@code @name})
 *             unless the definitions are exactly the same.
 *             New elements are always merged at the end of the application element.
 *          => Indicate if there's a dup.
 * A- instrumentation:
 *      => Do not merge. ignore the ones from libs.
 * C- permission / permission-group / permission-tree:
 *      => Merge as-is. Error if exists in the destination (same {@code @name})
 *         unless the definitions are exactly the same.
 * C- uses-permission:
 *      => Add. OK if already defined.
 * E- uses-sdk:
 *      {@code @minSdkVersion}: error if dest&lt;lib. Never automatically change dest minsdk.
 *                              Codenames are accepted if we can resolve their API level.
 *      {@code @targetSdkVersion}: warning if dest&lt;lib.
 *                                 Never automatically change dest targetsdk.
 *      {@code @maxSdkVersion}: obsolete, ignored. Not used in comparisons and not merged.
 * D- uses-feature with {@code @name}:
 *      => Merge with same {@code @name}
 *      => Merge {@code @required}: true>false.
 *      - Do not merge any {@code @glEsVersion} attribute at this point.
 * F- uses-feature with {@code @glEsVersion}:
 *      => Error if defined in lib+dest with dest&lt;lib. Never automatically change dest.
 * B- uses-configuration:
 *      => There can be many. Error if source defines one that is not an exact match in dest.
 *      (e.g. right now app must manually define something that matches exactly each lib)
 * B- supports-screens / compatible-screens:
 *      => Do not merge.
 *      => Error (warn?) if defined in lib and not strictly the same as in dest.
 * B- supports-gl-texture:
 *      => Do not merge. Can have more than one.
 *      => Error (warn?) if defined in lib and not present as-is in dest.
 *
 * Strategies:
 * A = Ignore, do not merge (no-op).
 * B = Do not merge but if defined in both must match equally.
 * C = Must not exist in dest or be exactly the same (key is the {@code @name} attribute).
 * D = Add new or merge with same key {@code @name}, adjust {@code @required} true>false.
 * E, F, G = Custom strategies; see above.
 *
 * What happens when merging libraries with conflicting information?
 * Say for example a main manifest has a minSdkVersion of 3, whereas libraries have
 * a minSdkVersion of 4 and 11. We could have 2 point of views:
 * - Play it safe: If we have a library with a minSdkVersion of 11, it means this
 *   library code knows it can't work reliably on a lower API level. So the safest end
 *   result would be a merged manifest with the highest minSdkVersion of all libraries.
 * - Trust the main manifest: When an app declares a given minSdkVersion, it also expects
 *   to run a given range of devices. If we change the final minSdkVersion, the app won't
 *   be available on as many devices as the developer might expect. And as a counterpoint
 *   to issue 1, the app may be careful and not call the library without checking the
 *   necessary features or APIs are available before hand.
 * Both points of views are conflicting. The solution taken here is to be conservative
 * and generate an error rather than merge and change a value that might be surprising.
 * On the other hand this can be problematic and force a developer to keep the main
 * manifest in sync with the libraries ones, in essence reducing the usefulness of the
 * automated merge to pure trivial cases. The idea is to just start this way and enhance
 * or revisit the mechanism later.
 * </pre>
 */
public class ManifestMerger {

  /** Namespace for Android attributes in an AndroidManifest.xml */
  private static final String NS_URI = SdkConstants.NS_RESOURCES;
  /** Prefix for the Android namespace to use in XPath expressions. */
  private static final String NS_PREFIX = AndroidXPathFactory.DEFAULT_NS_PREFIX;
  /** Namespace used in XML files for Android Tooling attributes */
  private static final String TOOLS_URI = SdkConstants.TOOLS_URI;
  /** The name of the tool:merge attribute, to either override or ignore merges. */
  private static final String MERGE_ATTR = "merge";                           //$NON-NLS-1$
  /**
   * tool:merge="override" means to ignore what comes from libraries and only keep the version from
   * the main manifest. No conflict can be generated.
   */
  private static final String MERGE_OVERRIDE = "override";                        //$NON-NLS-1$
  /**
   * tool:merge="remove" means to remove a node and prevent merging -- not only is the node from the
   * libraries not merged, but the element is removed from the main manifest.
   */
  private static final String MERGE_REMOVE = "remove";                          //$NON-NLS-1$
  /**
   * Sets of element/attribute that need to be treated as class names. The attribute name must be
   * the local name for the Android namespace. For example "application/name" maps to
   * &lt;application android:name=...&gt;.
   */
  private static final String[] sClassAttributes = {
      "application/name",
      "application/backupAgent",
      "activity/name",
      "activity/parentActivityName",
      "activity-alias/name",
      "activity-alias/targetActivity",
      "receiver/name",
      "service/name",
      "provider/name",
      "instrumentation/name"
  };
  /** Logger object. Never null. */
  private final IMergerLog mLog;
  /** An optional callback that the merger can use to query the calling SDK. */
  private final ICallback mCallback;
  private XPath mXPath;
  private Document mMainDoc;
  /** Option to extract the package prefixes from the merged manifest. */
  private boolean mExtractPackagePrefix;
  /** Whether the merger should insert comments pointing to the merge source files */
  private boolean mInsertSourceMarkers;

  /**
   * Creates a new {@link ManifestMerger}.
   *
   * @param log A non-null merger log to capture all warnings, errors and their location.
   * @param callback An optional callback that the merger can use to query the calling SDK.
   */
  public ManifestMerger(@NonNull IMergerLog log, @Nullable ICallback callback) {
    mLog = log;
    mCallback = callback;
  }

  /** Inserts source markers in the given document */
  private static void insertSourceMarkers(@NonNull Document mainDoc) {
    Element root = mainDoc.getDocumentElement();
    if (root != null) {
      File file = MergerXmlUtils.getFileFor(root);
      if (file != null) {
        insertSourceMarker(mainDoc, root, file, false);
      }

      insertSourceMarkers(root, file);
    }
  }

  private static File insertSourceMarkers(@NonNull Node node, @Nullable File currentFile) {
    for (int i = 0; i < node.getChildNodes().getLength(); i++) {
      Node child = node.getChildNodes().item(i);
      short nodeType = child.getNodeType();
      if (nodeType == Node.ELEMENT_NODE
          || nodeType == Node.COMMENT_NODE
          || nodeType == Node.DOCUMENT_NODE
          || nodeType == Node.CDATA_SECTION_NODE) {
        File file = MergerXmlUtils.getFileFor(child);
        if (file != null && !file.equals(currentFile)) {
          i += insertSourceMarker(node, child, file, false);
          currentFile = file;
        }

        currentFile = insertSourceMarkers(child, currentFile);
      }
    }

    Node lastElement = node.getLastChild();
    while (lastElement != null && lastElement.getNodeType() == Node.TEXT_NODE) {
      lastElement = lastElement.getPreviousSibling();
    }
    if (lastElement != null && lastElement.getNodeType() == Node.ELEMENT_NODE) {
      File parentFile = MergerXmlUtils.getFileFor(node);
      File lastFile = MergerXmlUtils.getFileFor(lastElement);
      if (lastFile != null && parentFile != null && !parentFile.equals(lastFile)) {
        insertSourceMarker(node, lastElement, parentFile, true);
        currentFile = parentFile;
      }
    }

    return currentFile;
  }

  private static int insertSourceMarker(@NonNull Node parent, @NonNull Node node,
      @NonNull File file, boolean after) {
    int insertCount = 0;
    Document doc = parent.getNodeType() ==
        Node.DOCUMENT_NODE ? (Document) parent : parent.getOwnerDocument();

    String comment;
    try {
      comment = SdkUtils.createPathComment(file, true);
    } catch (MalformedURLException e) {
      return insertCount;
    }

    Node prev = node.getPreviousSibling();
    String newline;
    if (prev != null && prev.getNodeType() == Node.TEXT_NODE) {
      // Duplicate indentation from previous line. Once we switch the merger
      // over to using the XmlPrettyPrinter, we won't need this.
      newline = prev.getNodeValue();
      int index = newline.lastIndexOf('\n');
      if (index != -1) {
        newline = newline.substring(index);
      }
    } else {
      newline = "\n";
    }

    if (after) {
      node = node.getNextSibling();
    }

    parent.insertBefore(doc.createComment(comment), node);
    insertCount++;

    // Can't add text nodes at the document level in Xerces, even though
    // it will happily parse these
    if (parent.getNodeType() != Node.DOCUMENT_NODE) {
      parent.insertBefore(doc.createTextNode(newline), node);
      insertCount++;
    }

    return insertCount;
  }

  /**
   * Sets whether the manifest merger should extract package prefixes. <p/> When true, the merged
   * document is revisited and class names attributes are shortened when possible, e.g. the package
   * prefix is removed from the class name if it matches.
   *
   * @param extract If true, extract package prefixes.
   * @return this, for constructor chaining
   */
  public ManifestMerger setExtractPackagePrefix(boolean extract) {
    mExtractPackagePrefix = extract;
    return this;
  }

  // --------

  /**
   * Performs the merge operation. <p/> This does NOT stop on errors, in an attempt to accumulate as
   * much info as possible to return to the user. Unless it failed to read the main manifest, a
   * result file will be created. However if process() returns false, the file should not be used
   * except for debugging purposes.
   *
   * @param outputFile The output path to generate. Can be the same as the main path.
   * @param mainFile The main manifest paths to read. What we merge into.
   * @param libraryFiles The library manifest paths to read. Must not be null.
   * @param injectAttributes A map of attributes to inject in the form [pseudo-xpath] => value. The
   * key is "/manifest/elements...|attribute-ns-uri attribute-local-name", for example
   * "/manifest/uses-sdk|http://schemas.android.com/apk/res/android minSdkVersion". (note the space
   * separator between the attribute URI and its local name.) The elements will be created if they
   * don't exists. Existing attributes will be modified. The replacement is done on the main
   * document <em>before</em> merging.
   * @param packageOverride an optional package override. This only affects the package attribute,
   * all components (activities, receivers, etc...) are not affected by this.
   * @return True if the merge was completed, false otherwise.
   */
  public boolean process(
      File outputFile,
      File mainFile,
      File[] libraryFiles,
      Map<String, String> injectAttributes,
      String packageOverride) {
    Document mainDoc = MergerXmlUtils.parseDocument(mainFile, mLog, this);
    if (mainDoc == null) {
      mLog.error(Severity.ERROR, new FileAndLine(mainFile.getAbsolutePath(), 0),
          "Failed to read manifest file.");
      return false;
    }

    boolean success = process(mainDoc, libraryFiles, injectAttributes, packageOverride);

    if (!MergerXmlUtils.printXmlFile(mainDoc, outputFile, mLog)) {
      mLog.error(Severity.ERROR, new FileAndLine(outputFile.getAbsolutePath(), 0),
          "Failed to write manifest file.");
      success = false;
    }

    return success;
  }

  /**
   * Performs the merge operation in-place in the given DOM. <p/> This does NOT stop on errors, in
   * an attempt to accumulate as much info as possible to return to the user. <p/> The method might
   * modify the input XML document in-place for its own processing.
   *
   * @param mainDoc The document to merge into. Will be modified in-place.
   * @param libraryFiles The library manifest paths to read. Must not be null. These will be
   * modified in-place.
   * @param injectAttributes A map of attributes to inject in the form [pseudo-xpath] => value. The
   * key is "/manifest/elements...|attribute-ns-uri attribute-local-name", for example
   * "/manifest/uses-sdk|http://schemas.android.com/apk/res/android minSdkVersion". (note the space
   * separator between the attribute URI and its local name.) The elements will be created if they
   * don't exists. Existing attributes will be modified. The replacement is done on the main
   * document <em>before</em> merging.
   * @param packageOverride an optional package override. This only affects the package attribute,
   * all components (activities, receivers, etc...) are not affected by this.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  public boolean process(
      Document mainDoc,
      File[] libraryFiles,
      Map<String, String> injectAttributes,
      String packageOverride) {

    boolean success = true;
    mMainDoc = mainDoc;
    MergerXmlUtils.decorateDocument(mainDoc, IMergerLog.MAIN_MANIFEST);
    MergerXmlUtils.injectAttributes(mainDoc, injectAttributes, mLog);

    String prefix = XmlUtils.lookupNamespacePrefix(mainDoc, SdkConstants.NS_RESOURCES);
    mXPath = AndroidXPathFactory.newXPath(prefix);

    expandFqcns(mainDoc);
    for (File libFile : libraryFiles) {
      Document libDoc = MergerXmlUtils.parseDocument(libFile, mLog, this);
      if (libDoc == null || !mergeLibDoc(cleanupToolsAttributes(libDoc))) {
        success = false;
      }
    }

    if (packageOverride != null) {
      MergerXmlUtils.injectAttributes(mainDoc,
          Collections.singletonMap("/manifest| package", packageOverride),
          mLog);
    }

    cleanupToolsAttributes(mainDoc);

    if (mExtractPackagePrefix) {
      extractFqcns(mainDoc);
    }

    if (mInsertSourceMarkers) {
      insertSourceMarkers(mainDoc);
    }

    mXPath = null;
    mMainDoc = null;
    return success;
  }

  /**
   * Performs the merge operation in-place in the given DOM. <p/> This does NOT stop on errors, in
   * an attempt to accumulate as much info as possible to return to the user. <p/> The method might
   * modify the input XML documents in-place for its own processing.
   *
   * @param mainDoc The document to merge into. Will be modified in-place.
   * @param libraryDocs The library manifest documents to merge in. Must not be null. These will be
   * modified in-place.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  public boolean process(@NonNull Document mainDoc, @NonNull Document... libraryDocs) {

    boolean success = true;
    mMainDoc = mainDoc;
    MergerXmlUtils.decorateDocument(mainDoc, IMergerLog.MAIN_MANIFEST);

    String prefix = XmlUtils.lookupNamespacePrefix(mainDoc, SdkConstants.NS_RESOURCES);
    mXPath = AndroidXPathFactory.newXPath(prefix);

    expandFqcns(mainDoc);
    for (Document libDoc : libraryDocs) {
      MergerXmlUtils.decorateDocument(libDoc, IMergerLog.LIBRARY);
      if (!mergeLibDoc(cleanupToolsAttributes(libDoc))) {
        success = false;
      }
    }

    cleanupToolsAttributes(mainDoc);

    if (mExtractPackagePrefix) {
      extractFqcns(mainDoc);
    }

    if (mInsertSourceMarkers) {
      insertSourceMarkers(mainDoc);
    }

    mXPath = null;
    mMainDoc = null;
    return success;
  }

  /**
   * Merges the given library manifest into the destination manifest. See {@link ManifestMerger} for
   * merge details.
   *
   * @param libDoc The library document to merge from. Must not be null.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean mergeLibDoc(Document libDoc) {

    boolean err = false;

    expandFqcns(libDoc);

    // Strategy G (check <application> is compatible)
    err |= !checkApplication(libDoc);

    // Strategy B
    err |= !doNotMergeCheckEqual("/manifest/uses-configuration", libDoc);     //$NON-NLS-1$
    err |= !doNotMergeCheckEqual("/manifest/supports-screens", libDoc);     //$NON-NLS-1$
    err |= !doNotMergeCheckEqual("/manifest/compatible-screens", libDoc);     //$NON-NLS-1$
    err |= !doNotMergeCheckEqual("/manifest/supports-gl-texture", libDoc);     //$NON-NLS-1$

    boolean skipApplication = hasOverrideOrRemoveTag(
        findFirstElement(mMainDoc, "/manifest/application"));  //$NON-NLS-1$

    // Strategy C
    if (!skipApplication) {
      err |= !mergeNewOrEqual(
          "/manifest/application/activity",                           //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
      err |= !mergeNewOrEqual(
          "/manifest/application/activity-alias",                     //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
      err |= !mergeNewOrEqual(
          "/manifest/application/service",                            //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
      err |= !mergeNewOrEqual(
          "/manifest/application/receiver",                           //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
      err |= !mergeNewOrEqual(
          "/manifest/application/provider",                           //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
    }
    err |= !mergeNewOrEqual(
        "/manifest/permission",                                         //$NON-NLS-1$
        "name",                                                         //$NON-NLS-1$
        libDoc,
        false);
    err |= !mergeNewOrEqual(
        "/manifest/permission-group",                                   //$NON-NLS-1$
        "name",                                                         //$NON-NLS-1$
        libDoc,
        false);
    err |= !mergeNewOrEqual(
        "/manifest/permission-tree",                                    //$NON-NLS-1$
        "name",                                                         //$NON-NLS-1$
        libDoc,
        false);
    err |= !mergeNewOrEqual(
        "/manifest/uses-permission",                                    //$NON-NLS-1$
        "name",                                                         //$NON-NLS-1$
        libDoc,
        false);

    // Strategy D
    if (!skipApplication) {
      err |= !mergeAdjustRequired(
          "/manifest/application/uses-library",                       //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          "required",                                                 //$NON-NLS-1$
          libDoc,
          null /*alternateKeyAttr*/);
      err |= !mergeNewOrEqual(
          "/manifest/application/meta-data",                          //$NON-NLS-1$
          "name",                                                     //$NON-NLS-1$
          libDoc,
          true);
    }
    err |= !mergeAdjustRequired(
        "/manifest/uses-feature",                                       //$NON-NLS-1$
        "name",                                                         //$NON-NLS-1$
        "required",                                                     //$NON-NLS-1$
        libDoc,
        "glEsVersion" /*alternateKeyAttr*/);

    // Strategy E
    err |= !checkSdkVersion(libDoc);

    // Strategy F
    err |= !checkGlEsVersion(libDoc);

    return !err;
  }

  /**
   * Expand all possible class names attributes in the given document. <p/> Some manifest attributes
   * represent class names. These can be specified as fully qualified class names or use a short
   * notation consisting of just the terminal class simple name or a dot followed by a partial class
   * name. Unfortunately this makes textual comparison of the attributes impossible. To simplify
   * this, we can modify the document to fully expand all these class names. The list of elements
   * and attributes to process is listed by {@link #sClassAttributes} and the expansion simply
   * consists of appending the manifest' package if defined.
   *
   * @param doc The document in which to expand potential FQCNs.
   */
  private void expandFqcns(Document doc) {
    // Find the package attribute of the manifest.
    String pkg = null;
    Element manifest = findFirstElement(doc, "/manifest");
    if (manifest != null) {
      pkg = manifest.getAttribute("package");
    }

    if (pkg == null || pkg.length() == 0) {
      // We can't adjust FQCNs if we don't know the root package name.
      // It's not a proper manifest if this is missing anyway.
      assert manifest != null;
      mLog.error(Severity.WARNING,
          xmlFileAndLine(manifest),
          "Missing 'package' attribute in manifest.");
      return;
    }

    for (String elementAttr : sClassAttributes) {
      String[] names = elementAttr.split("/");
      if (names.length != 2) {
        continue;
      }
      String elemName = names[0];
      String attrName = names[1];
      NodeList elements = doc.getElementsByTagName(elemName);
      for (int i = 0; i < elements.getLength(); i++) {
        Node elem = elements.item(i);
        if (elem instanceof Element) {
          Attr attr = ((Element) elem).getAttributeNodeNS(NS_URI, attrName);
          if (attr != null) {
            String value = attr.getNodeValue();

            // We know it's a shortened FQCN if it starts with a dot
            // or does not contain any dot.
            if (value != null && value.length() > 0 &&
                (value.indexOf('.') == -1 || value.charAt(0) == '.')) {
              if (value.charAt(0) == '.') {
                value = pkg + value;
              } else {
                value = pkg + '.' + value;
              }
              attr.setNodeValue(value);
            }
          }
        }
      }
    }
  }

  /**
   * Extracts the fully qualified class names from the manifest and uses the prefix notation
   * relative to the manifest package. This basically reverses the effects of {@link
   * #expandFqcns(Document)}, though of course it may also remove prefixes which were inlined in the
   * original documents.
   *
   * @param doc the document in which to extract the FQCNs.
   */
  private void extractFqcns(Document doc) {
    // Find the package attribute of the manifest.
    String pkg = null;
    Element manifest = findFirstElement(doc, "/manifest");
    if (manifest != null) {
      pkg = manifest.getAttribute("package");
    }

    if (pkg == null || pkg.length() == 0) {
      return;
    }

    int pkgLength = pkg.length();
    for (String elementAttr : sClassAttributes) {
      String[] names = elementAttr.split("/");
      if (names.length != 2) {
        continue;
      }
      String elemName = names[0];
      String attrName = names[1];
      NodeList elements = doc.getElementsByTagName(elemName);
      for (int i = 0; i < elements.getLength(); i++) {
        Node elem = elements.item(i);
        if (elem instanceof Element) {
          Attr attr = ((Element) elem).getAttributeNodeNS(NS_URI, attrName);
          if (attr != null) {
            String value = attr.getNodeValue();

            // We know it's a shortened FQCN if it starts with a dot
            // or does not contain any dot.
            if (value != null && value.length() > pkgLength &&
                value.startsWith(pkg) && value.charAt(pkgLength) == '.') {
              value = value.substring(pkgLength);
              attr.setNodeValue(value);
            }
          }
        }
      }
    }
  }

  /**
   * Checks (but does not merge) the application attributes using the following rules:
   * <pre>
   * - {@code @name}: Ignore if empty. Warning if its expanded FQCN doesn't match the main doc.
   * - {@code @backupAgent}:  Ignore if empty. Warning if its expanded FQCN doesn't match main doc.
   * - All other attributes are ignored.
   * </pre>
   * The name and backupAgent represent classes and the merger will warn since if a lib has these
   * defined they will never be used anyway.
   *
   * @param libDoc The library document to merge from. Must not be null.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean checkApplication(Document libDoc) {

    Element mainApp = findFirstElement(mMainDoc, "/manifest/application");  //$NON-NLS-1$
    Element libApp = findFirstElement(libDoc, "/manifest/application");  //$NON-NLS-1$

    // A manifest does not necessarily define an application.
    // If the lib has none, there's nothing to check for.
    if (libApp == null) {
      return true;
    }
    if (hasOverrideOrRemoveTag(mainApp)) {
      // Don't check the <application> element since it is tagged with override or remove.
      return true;
    }

    for (String attrName : new String[] {"name", "backupAgent"}) {
      String libValue = getAttributeValue(libApp, attrName);
      if (libValue == null || libValue.length() == 0) {
        // Nothing to do if the attribute is not defined in the lib.
        continue;
      }
      // The main doc does not have to have an application node.
      String mainValue = mainApp == null ? "" : getAttributeValue(mainApp, attrName);
      if (!libValue.equals(mainValue)) {
        assert mainApp != null;
        mLog.conflict(Severity.WARNING,
            xmlFileAndLine(mainApp),
            xmlFileAndLine(libApp),
            mainApp == null ?
                "Library has <application android:%1$s='%3$s'> but main manifest has no application element."
                :
                    "Main manifest has <application android:%1$s='%2$s'> but library uses %1$s='%3$s'.",
            attrName,
            mainValue,
            libValue);
      }
    }

    return true;
  }

  /**
   * Do not merge anything. Instead it checks that the requested elements from the given library are
   * all present and equal in the destination and prints a warning if it's not the case. <p/> For
   * example if a library supports a given screen configuration, print a warning if the main
   * manifest doesn't indicate the app supports the same configuration. We should not merge it since
   * we don't want to silently give the impression an app supports a configuration just because it
   * uses a library which does. On the other hand we don't want to silently ignore this fact. <p/>
   * TODO there should be a way to silence this warning. The current behavior is certainly arbitrary
   * and needs to be tweaked somehow.
   *
   * @param path The XPath of the elements to merge from the library. Must not be null.
   * @param libDoc The library document to merge from. Must not be null.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean doNotMergeCheckEqual(String path, Document libDoc) {

    for (Element src : findElements(libDoc, path)) {

      boolean found = false;

      for (Element dest : findElements(mMainDoc, path)) {
        if (hasOverrideOrRemoveTag(dest)) {
          continue;
        }
        if (compareElements(dest, src, false, null /*diff*/, null /*keyAttr*/)) {
          found = true;
          break;
        }
      }

      if (!found) {
        mLog.conflict(Severity.WARNING,
            xmlFileAndLine(mMainDoc),
            xmlFileAndLine(src),
            "%1$s defined in library, missing from main manifest:\n%2$s",
            path,
            MergerXmlUtils.dump(src, false /*nextSiblings*/));
      }
    }

    return true;
  }

  /**
   * Merges the requested elements from the library in the main document. The key attribute name is
   * used to identify the same elements. Merged elements must either not exist in the destination or
   * be identical. <p/> When merging, append to the end of the application element. Also merges any
   * preceding whitespace and up to one comment just prior to the merged element.
   *
   * @param path The XPath of the elements to merge from the library. Must not be null.
   * @param keyAttr The Android-namespace attribute used as key to identify similar elements. E.g.
   * "name" for "android:name"
   * @param libDoc The library document to merge from. Must not be null.
   * @param warnDups When true, will print a warning when a library definition is already present in
   * the destination and is equal.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean mergeNewOrEqual(
      String path,
      String keyAttr,
      Document libDoc,
      boolean warnDups) {

    // The parent of XPath /p1/p2/p3 is /p1/p2. To find it, delete the last "/segment"
    int pos = path.lastIndexOf('/');
    assert pos > 1;
    String parentPath = path.substring(0, pos);
    Element parent = findFirstElement(mMainDoc, parentPath);
    assert parent != null;
    if (parent == null) {
      mLog.error(Severity.ERROR,
          xmlFileAndLine(mMainDoc),
          "Could not find element %1$s.",
          parentPath);
      return false;
    }

    boolean success = true;

    nextSource:
    for (Element src : findElements(libDoc, path)) {
      String name = getAttributeValue(src, keyAttr);
      if (name.length() == 0) {
        mLog.error(Severity.ERROR,
            xmlFileAndLine(src),
            "Undefined '%1$s' attribute in %2$s.",
            keyAttr, path);
        success = false;
        continue;
      }

      // Look for the same item in the destination
      List<Element> dests = findElements(mMainDoc, path, keyAttr, name);
      if (dests.size() > 1) {
        // This should not be happening. We'll just use the first one found in this case.
        mLog.error(Severity.WARNING,
            xmlFileAndLine(dests.get(0)),
            "Manifest has more than one %1$s[@%2$s=%3$s] element.",
            path, keyAttr, name);
      }
      boolean doMerge = true;
      for (Element dest : dests) {
        // Don't try to merge this element since it has tools:merge=override|remove.
        if (hasOverrideOrRemoveTag(dest)) {
          doMerge = false;
          continue;
        }
        // If there's already a similar node in the destination, check it's identical.
        StringBuilder diff = new StringBuilder();
        if (compareElements(dest, src, false, diff, keyAttr)) {
          // Same element. Skip.
          if (warnDups) {
            mLog.conflict(Severity.INFO,
                xmlFileAndLine(dest),
                xmlFileAndLine(src),
                "Skipping identical %1$s[@%2$s=%3$s] element.",
                path, keyAttr, name);
          }
          continue nextSource;
        } else {
          // Print the diff we got from the comparison.
          mLog.conflict(Severity.ERROR,
              xmlFileAndLine(dest),
              xmlFileAndLine(src),
              "Trying to merge incompatible %1$s[@%2$s=%3$s] element:\n%4$s",
              path, keyAttr, name, diff.toString());
          success = false;
          continue nextSource;
        }
      }

      if (doMerge) {
        // Ready to merge element src. Select which previous siblings to merge.
        Node start = selectPreviousSiblings(src);

        insertAtEndOf(parent, start, src);
      }
    }

    return success;
  }

  /**
   * Returns the value of the given "android:attribute" in the given element.
   *
   * @param element The non-null element where to extract the attribute.
   * @param attrName The local name of the attribute. It must use the {@link #NS_URI} but no prefix
   * should be specified here.
   * @return The value of the attribute or a non-null empty string if not found.
   */
  private String getAttributeValue(Element element, String attrName) {
    Attr attr = element.getAttributeNodeNS(NS_URI, attrName);
    String value = attr == null ? "" : attr.getNodeValue();  //$NON-NLS-1$
    return value;
  }

  /**
   * Merge elements as identified by their key name attribute. The element must have an option
   * boolean "required" attribute which can be either "true" or "false". Default is true if the
   * attribute is missing. When merging, a "false" is superseded by a "true" (explicit or implicit).
   * <p/> When merging, this does NOT merge any other attributes than {@code keyAttr} and {@code
   * requiredAttr}.
   *
   * @param path The XPath of the elements to merge from the library. Must not be null.
   * @param keyAttr The Android-namespace attribute used as key to identify similar elements. E.g.
   * "name" for "android:name"
   * @param requiredAttr The name of the Android-namespace boolean attribute that must be merged.
   * Typically should be "required".
   * @param libDoc The library document to merge from. Must not be null.
   * @param alternateKeyAttr When non-null, this is an alternate valid key attribute. If the default
   * key attribute is missing, we won't output a warning if the alternate one is present.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean mergeAdjustRequired(
      String path,
      String keyAttr,
      String requiredAttr,
      Document libDoc,
      @Nullable String alternateKeyAttr) {

    // The parent of XPath /p1/p2/p3 is /p1/p2. To find it, delete the last "/segment"
    int pos = path.lastIndexOf('/');
    assert pos > 1;
    String parentPath = path.substring(0, pos);
    Element parent = findFirstElement(mMainDoc, parentPath);
    assert parent != null;
    if (parent == null) {
      mLog.error(Severity.ERROR,
          xmlFileAndLine(mMainDoc),
          "Could not find element %1$s.",
          parentPath);
      return false;
    }

    boolean success = true;

    for (Element src : findElements(libDoc, path)) {
      Attr attr = src.getAttributeNodeNS(NS_URI, keyAttr);
      String name = attr == null ? "" : attr.getNodeValue().trim();  //$NON-NLS-1$
      if (name.length() == 0) {
        if (alternateKeyAttr != null) {
          attr = src.getAttributeNodeNS(NS_URI, alternateKeyAttr);
          String s = attr == null ? "" : attr.getNodeValue().trim(); //$NON-NLS-1$
          if (s.length() != 0) {
            // This element lacks the keyAttr but has the alternateKeyAttr. Skip it.
            continue;
          }
        }

        mLog.error(Severity.ERROR,
            xmlFileAndLine(src),
            "Undefined '%1$s' attribute in %2$s.",
            keyAttr, path);
        success = false;
        continue;
      }

      // Look for the same item in the destination
      List<Element> dests = findElements(mMainDoc, path, keyAttr, name);
      if (dests.size() > 1) {
        // This should not be happening. We'll just use the first one found in this case.
        mLog.error(Severity.WARNING,
            xmlFileAndLine(dests.get(0)),
            "Manifest has more than one %1$s[@%2$s=%3$s] element.",
            path, keyAttr, name);
      }
      if (dests.size() > 0) {

        attr = src.getAttributeNodeNS(NS_URI, requiredAttr);
        String value = attr == null ? "true" : attr.getNodeValue();    //$NON-NLS-1$
        if (value == null || !(value.equals("true") || value.equals("false"))) {
          mLog.error(Severity.WARNING,
              xmlFileAndLine(src),
              "Invalid attribute '%1$s' in %2$s[@%3$s=%4$s] element:\nExpected 'true' or 'false' but found '%5$s'.",
              requiredAttr, path, keyAttr, name, value);
          continue;
        }
        boolean boolE = Boolean.parseBoolean(value);

        for (Element dest : dests) {
          // Don't try to merge this element since it has tools:merge=override|remove.
          if (hasOverrideOrRemoveTag(dest)) {
            continue;
          }

          // Compare the required attributes.
          attr = dest.getAttributeNodeNS(NS_URI, requiredAttr);
          value = attr == null ? "true" : attr.getNodeValue();    //$NON-NLS-1$
          if (value == null || !(value.equals("true") || value.equals("false"))) {
            mLog.error(Severity.WARNING,
                xmlFileAndLine(dest),
                "Invalid attribute '%1$s' in %2$s[@%3$s=%4$s] element:\nExpected 'true' or 'false' but found '%5$s'.",
                requiredAttr, path, keyAttr, name, value);
            continue;
          }
          boolean boolD = Boolean.parseBoolean(value);

          if (!boolD && boolE) {
            // Required attributes differ: destination is false and source was true
            // so we need to change the destination to true.

            // If attribute was already in the destination, change it in place
            if (attr != null) {
              attr.setNodeValue("true");                        //$NON-NLS-1$
            } else {
              // Otherwise, do nothing. The destination doesn't have the
              // required=true attribute, and true is the default value.
              // Consequently not setting is the right thing to do.

              // -- code snippet for reference --
              // If we wanted to create a new attribute, we'd use the code
              // below. There's a simpler call to d.setAttributeNS(ns, name, value)
              // but experience shows that it would create a new prefix out of the
              // blue instead of looking it up.
              //
              // Attr a=d.getOwnerDocument().createAttributeNS(NS_URI, requiredAttr);
              // String prefix = d.lookupPrefix(NS_URI);
              // if (prefix != null) {
              //     a.setPrefix(prefix);
              // }
              // a.setValue("true");  //$NON-NLS-1$
              // d.setAttributeNodeNS(attr);
            }
          }
        }
      } else {
        // Destination doesn't exist. We simply merge the source element.
        // Select which previous siblings to merge.
        Node start = selectPreviousSiblings(src);

        Node node = insertAtEndOf(parent, start, src);

        NamedNodeMap attrs = node.getAttributes();
        if (attrs != null) {
          for (int i = 0; i < attrs.getLength(); i++) {
            Node a = attrs.item(i);
            if (a.getNodeType() == Node.ATTRIBUTE_NODE) {
              boolean keep = NS_URI.equals(a.getNamespaceURI());
              if (keep) {
                name = a.getLocalName();
                keep = keyAttr.equals(name) || requiredAttr.equals(name);
              }
              if (!keep) {
                attrs.removeNamedItemNS(NS_URI, name);
                // Restart the loop from index 0 since there's no
                // guarantee on the order of the nodes in the "map".
                // This makes it O(n+2n) at most, where n is [2..3] in
                // a typical case.
                i = -1;
              }
            }
          }
        }
      }
    }

    return success;
  }

  // -----

  /**
   * Checks (but does not merge) uses-feature glEsVersion attribute using the following rules:
   * <pre>
   * - Error if defined in lib+dest with dest&lt;lib.
   * - Never automatically change dest.
   * - Default implied value is 1.0 (0x00010000).
   * </pre>
   *
   * @param libDoc The library document to merge from. Must not be null.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean checkGlEsVersion(Document libDoc) {

    String parentPath = "/manifest";                                    //$NON-NLS-1$
    Element parent = findFirstElement(mMainDoc, parentPath);
    assert parent != null;
    if (parent == null) {
      mLog.error(Severity.ERROR,
          xmlFileAndLine(mMainDoc),
          "Could not find element %1$s.",
          parentPath);
      return false;
    }

    // Find the max glEsVersion on the destination side
    String path = "/manifest/uses-feature";                             //$NON-NLS-1$
    String keyAttr = "glEsVersion";                                     //$NON-NLS-1$
    long destGlEsVersion = 0x00010000L; // default minimum is 1.0
    Element destNode = null;
    boolean result = true;
    for (Element dest : findElements(mMainDoc, path)) {
      Attr attr = dest.getAttributeNodeNS(NS_URI, keyAttr);
      String value = attr == null ? "" : attr.getNodeValue().trim();   //$NON-NLS-1$
      if (value.length() != 0) {
        try {
          // Note that the value can be an hex number such as 0x00020001 so we
          // need Integer.decode instead of Integer.parseInt.
          // Note: Integer.decode cannot handle "ffffffff", see JDK issue 6624867
          // so we just treat the version as a long and test like this, ignoring
          // the fact that a value of 0xFFFF/.0xFFFF is probably invalid anyway
          // in the context of glEsVersion.
          long version = Long.decode(value);
          if (version >= destGlEsVersion) {
            destGlEsVersion = version;
            destNode = dest;
          } else if (version < 0x00010000) {
            mLog.error(Severity.WARNING,
                xmlFileAndLine(dest),
                "Ignoring <uses-feature android:glEsVersion='%1$s'> because it's smaller than 1.0.",
                value);
          }
        } catch (NumberFormatException e) {
          // Note: NumberFormatException.toString() has no interesting information
          // so we don't output it.
          mLog.error(Severity.ERROR,
              xmlFileAndLine(dest),
              "Failed to parse <uses-feature android:glEsVersion='%1$s'>: must be an integer in the form 0x00020001.",
              value);
          result = false;
        }
      }
    }

    // If we found at least one valid with no error, use that, otherwise bail out.
    if (!result && destNode == null) {
      return false;
    }

    // Now find the max glEsVersion on the source side.

    long srcGlEsVersion = 0x00010000L; // default minimum is 1.0
    Element srcNode = null;
    result = true;
    for (Element src : findElements(libDoc, path)) {
      Attr attr = src.getAttributeNodeNS(NS_URI, keyAttr);
      String value = attr == null ? "" : attr.getNodeValue().trim();   //$NON-NLS-1$
      if (value.length() != 0) {
        try {
          // See comment on Long.decode above.
          long version = Long.decode(value);
          if (version >= srcGlEsVersion) {
            srcGlEsVersion = version;
            srcNode = src;
          } else if (version < 0x00010000) {
            mLog.error(Severity.WARNING,
                xmlFileAndLine(src),
                "Ignoring <uses-feature android:glEsVersion='%1$s'> because it's smaller than 1.0.",
                value);
          }
        } catch (NumberFormatException e) {
          // Note: NumberFormatException.toString() has no interesting information
          // so we don't output it.
          mLog.error(Severity.ERROR,
              xmlFileAndLine(src),
              "Failed to parse <uses-feature android:glEsVersion='%1$s'>: must be an integer in the form 0x00020001.",
              value);
          result = false;
        }
      }
    }

    if (srcNode != null && destGlEsVersion < srcGlEsVersion) {
      mLog.conflict(Severity.WARNING,
          xmlFileAndLine(destNode == null ? mMainDoc : destNode),
          xmlFileAndLine(srcNode),
          "Main manifest has <uses-feature android:glEsVersion='0x%1$08x'> but library uses glEsVersion='0x%2$08x'%3$s",
          destGlEsVersion,
          srcGlEsVersion,
          destNode != null ? "" :   //$NON-NLS-1$
              "\nNote: main manifest lacks a <uses-feature android:glEsVersion> declaration, and thus defaults to glEsVersion=0x00010000."
      );
      result = false;
    }

    return result;
  }

  /**
   * Checks (but does not merge) uses-sdk attributes using the following rules:
   * <pre>
   * - {@code @minSdkVersion}: error if dest&lt;lib. Never automatically change dest minsdk.
   * - {@code @targetSdkVersion}: warning if dest&lt;lib. Never automatically change destination.
   * - {@code @maxSdkVersion}: obsolete, ignored. Not used in comparisons and not merged.
   * - The API level can be a codename if we have a callback that can convert it to an integer.
   * </pre>
   *
   * @param libDoc The library document to merge from. Must not be null.
   * @return True on success, false if any error occurred (printed to the {@link IMergerLog}).
   */
  private boolean checkSdkVersion(Document libDoc) {

    boolean result = true;

    Element destUsesSdk = findFirstElement(mMainDoc, "/manifest/uses-sdk");  //$NON-NLS-1$

    if (hasOverrideOrRemoveTag(destUsesSdk)) {
      // Don't try to check this element since it has tools:merge=override|remove.
      return true;
    }

    Element srcUsesSdk = findFirstElement(libDoc, "/manifest/uses-sdk");  //$NON-NLS-1$

    AtomicInteger destValue = new AtomicInteger(1);
    AtomicInteger srcValue = new AtomicInteger(1);
    AtomicBoolean destImplied = new AtomicBoolean(true);
    AtomicBoolean srcImplied = new AtomicBoolean(true);

    // Check minSdkVersion
    int destMinSdk = 1;
    result = extractSdkVersionAttribute(
        libDoc,
        destUsesSdk, srcUsesSdk,
        "min",  //$NON-NLS-1$
        destValue, srcValue,
        destImplied, srcImplied);

    if (result) {
      // Make it an error for an application to use a library with a greater
      // minSdkVersion. This means the library code may crash unexpectedly.
      // TODO it would be nice to be able to work around this in case the
      // user think s/he knows what s/he's doing.
      // We could define a simple XML comment flag: <!-- @NoMinSdkVersionMergeError -->

      destMinSdk = destValue.get();

      if (destMinSdk < srcValue.get()) {
        mLog.conflict(Severity.ERROR,
            xmlFileAndLine(destUsesSdk == null ? mMainDoc : destUsesSdk),
            xmlFileAndLine(srcUsesSdk == null ? libDoc : srcUsesSdk),
            "Main manifest has <uses-sdk android:minSdkVersion='%1$d'> but library uses minSdkVersion='%2$d'%3$s",
            destMinSdk,
            srcValue.get(),
            !destImplied.get() ? "" :   //$NON-NLS-1$
                "\nNote: main manifest lacks a <uses-sdk android:minSdkVersion> declaration, which defaults to value 1."
        );
        result = false;
      }
    }

    // Check targetSdkVersion.

    // Note that destValue/srcValue purposely defaults to whatever minSdkVersion was last read
    // since that's their definition when missing.
    destImplied.set(true);
    srcImplied.set(true);

    boolean result2 = extractSdkVersionAttribute(
        libDoc,
        destUsesSdk, srcUsesSdk,
        "target",  //$NON-NLS-1$
        destValue, srcValue,
        destImplied, srcImplied);

    result &= result2;
    if (result2) {
      // Make it a warning for an application to use a library with a greater
      // targetSdkVersion.

      int destTargetSdk = destImplied.get() ? destMinSdk : destValue.get();

      if (destTargetSdk < srcValue.get()) {
        mLog.conflict(Severity.WARNING,
            xmlFileAndLine(destUsesSdk == null ? mMainDoc : destUsesSdk),
            xmlFileAndLine(srcUsesSdk == null ? libDoc : srcUsesSdk),
            "Main manifest has <uses-sdk android:targetSdkVersion='%1$d'> but library uses targetSdkVersion='%2$d'%3$s",
            destTargetSdk,
            srcValue.get(),
            !destImplied.get() ? "" :   //$NON-NLS-1$
                "\nNote: main manifest lacks a <uses-sdk android:targetSdkVersion> declaration, which defaults to value minSdkVersion or 1."
        );
        result = false;
      }
    }

    return result;
  }

  /**
   * Implementation detail for {@link #checkSdkVersion(Document)}. Note that the various atomic
   * out-variables must be preset to their default before the call. <p/> destValue/srcValue will be
   * filled with the integer value of the field, if present and a correct number, in which case
   * destImplied/destImplied are also set to true. Otherwise the values and the implied variables
   * are left untouched.
   */
  private boolean extractSdkVersionAttribute(
      Document libDoc,
      Element destUsesSdk,
      Element srcUsesSdk,
      String attr,
      AtomicInteger destValue,
      AtomicInteger srcValue,
      AtomicBoolean destImplied,
      AtomicBoolean srcImplied) {
    String s = destUsesSdk == null ? ""                                      //$NON-NLS-1$
        : destUsesSdk.getAttributeNS(NS_URI, attr + "SdkVersion");  //$NON-NLS-1$

    boolean result = true;
    assert s != null;
    s = s.trim();
    try {
      if (s.length() > 0) {
        destValue.set(Integer.parseInt(s));
        destImplied.set(false);
      }
    } catch (NumberFormatException e) {
      boolean error = true;
      if (mCallback != null) {
        // Versions can contain codenames such as "JellyBean".
        // We'll accept it only if have a callback that can give us the API level for it.
        int apiLevel = mCallback.queryCodenameApiLevel(s);
        if (apiLevel > ICallback.UNKNOWN_CODENAME) {
          destValue.set(apiLevel);
          destImplied.set(false);
          error = false;
        }
      }
      if (error) {
        // Note: NumberFormatException.toString() has no interesting information
        // so we don't output it.
        mLog.error(Severity.ERROR,
            xmlFileAndLine(destUsesSdk == null ? mMainDoc : destUsesSdk),
            "Failed to parse <uses-sdk %1$sSdkVersion='%2$s'>: must be an integer number or codename.",
            attr,
            s);
        result = false;
      }
    }

    s = srcUsesSdk == null ? ""                                      //$NON-NLS-1$
        : srcUsesSdk.getAttributeNS(NS_URI, attr + "SdkVersion");  //$NON-NLS-1$
    assert s != null;
    s = s.trim();
    try {
      if (s.length() > 0) {
        srcValue.set(Integer.parseInt(s));
        srcImplied.set(false);
      }
    } catch (NumberFormatException e) {
      boolean error = true;
      if (mCallback != null) {
        // Versions can contain codenames such as "JellyBean".
        // We'll accept it only if have a callback that can give us the API level for it.
        int apiLevel = mCallback.queryCodenameApiLevel(s);
        if (apiLevel > ICallback.UNKNOWN_CODENAME) {
          srcValue.set(apiLevel);
          srcImplied.set(false);
          error = false;
        }
      }
      if (error) {
        mLog.error(Severity.ERROR,
            xmlFileAndLine(srcUsesSdk == null ? libDoc : srcUsesSdk),
            "Failed to parse <uses-sdk %1$sSdkVersion='%2$s'>: must be an integer number or codename.",
            attr,
            s);
        result = false;
      }
    }

    return result;
  }

  /**
   * Given an element E, select which previous siblings we want to merge. We want to include any
   * whitespace up to the closing of the previous element. We also want to include up preceding
   * comment nodes and their preceding whitespace. <p/> This may returns either {@code end} or a
   * previous sibling. Never returns null.
   */
  @NonNull
  private Node selectPreviousSiblings(Node end) {

    Node start = end;
    Node prev = start.getPreviousSibling();
    while (prev != null) {
      short t = prev.getNodeType();
      if (t == Node.TEXT_NODE) {
        String text = prev.getNodeValue();
        if (text == null || text.trim().length() != 0) {
          // Not whitespace, we don't want it.
          break;
        }
      } else if (t == Node.COMMENT_NODE) {
        // It's a comment. We'll take it.
      } else {
        // Not a comment node nor a whitespace text. We don't want it.
        break;
      }
      start = prev;
      prev = start.getPreviousSibling();
    }

    return start;
  }

  /**
   * Inserts all siblings from {@code start} to {@code end} at the end of the given destination
   * element. <p/> Implementation detail: this clones the source nodes into the destination.
   *
   * @param dest The destination at the end of which to insert. Cannot be null.
   * @param start The first element to insert. Must not be null.
   * @param end The last element to insert (included). Must not be null. Must be a direct "next
   * sibling" of the start node. Can be equal to the start node to insert just that one node.
   * @return The copy of the {@code end} node in the destination document or null if no such copy
   * was created and added to the destination.
   */
  private Node insertAtEndOf(Element dest, Node start, Node end) {
    // Check whether we'll need to adjust URI prefixes
    String destPrefix = XmlUtils.lookupNamespacePrefix(mMainDoc, NS_URI);
    String srcPrefix = XmlUtils.lookupNamespacePrefix(start.getOwnerDocument(), NS_URI);
    boolean needPrefixChange = destPrefix != null && !destPrefix.equals(srcPrefix);

    // First let's figure out the insertion point.
    // We want the end of the last 'content' element of the
    // destination element and basically we want to insert right
    // before the last whitespace of the destination element.
    Node target = dest.getLastChild();
    while (target != null) {
      if (target.getNodeType() == Node.TEXT_NODE) {
        String text = target.getNodeValue();
        if (text == null || text.trim().length() != 0) {
          // Not whitespace, insert after.
          break;
        }
      } else {
        // Not text. Insert after
        break;
      }
      target = target.getPreviousSibling();
    }
    if (target != null) {
      target = target.getNextSibling();
    }

    // Destination and start..end must not be part of the same document
    // because we try to import below. If they were, it would mess the
    // structure.
    assert dest.getOwnerDocument() == mMainDoc;
    assert dest.getOwnerDocument() != start.getOwnerDocument();
    assert start.getOwnerDocument() == end.getOwnerDocument();

    while (start != null) {
      Node node = mMainDoc.importNode(start, true /*deep*/);
      if (needPrefixChange) {
        changePrefix(node, srcPrefix, destPrefix);
      }

      if (mInsertSourceMarkers) {
        // Duplicate source node attribute
        File file = MergerXmlUtils.getFileFor(start);
        if (file != null) {
          MergerXmlUtils.setFileFor(node, file);
        }
      }

      dest.insertBefore(node, target);

      if (start == end) {
        return node;
      }
      start = start.getNextSibling();
    }
    return null;
  }

  /**
   * Changes the namespace prefix of all nodes, recursively.
   *
   * @param node The node to process, as well as all it's descendants. Can be null.
   * @param srcPrefix The prefix to match.
   * @param destPrefix The new prefix to replace with.
   */
  private void changePrefix(Node node, String srcPrefix, String destPrefix) {
    for (; node != null; node = node.getNextSibling()) {
      if (srcPrefix.equals(node.getPrefix())) {
        node.setPrefix(destPrefix);
      }
      Node child = node.getFirstChild();
      if (child != null) {
        changePrefix(child, srcPrefix, destPrefix);
      }
    }
  }

  /**
   * Compares two {@link Element}s recursively. They must be identical with the same structure.
   * Order should not matter. Whitespace and comments are ignored.
   *
   * @param expected The first element to compare.
   * @param actual The second element to compare with.
   * @param nextSiblings If true, will also compare the following siblings. If false, it will just
   * compare the given node.
   * @param diff An optional {@link StringBuilder} where to accumulate a diff output.
   * @param keyAttr An optional key attribute to always add to elements when dumping a diff.
   * @return True if {@code e1} and {@code e2} are equal.
   */
  private boolean compareElements(
      @NonNull Node expected,
      @NonNull Node actual,
      boolean nextSiblings,
      @Nullable StringBuilder diff,
      @Nullable String keyAttr) {
    Map<String, String> nsPrefixE = new HashMap<String, String>();
    Map<String, String> nsPrefixA = new HashMap<String, String>();
    String sE = MergerXmlUtils.printElement(expected, nsPrefixE, "");           //$NON-NLS-1$
    String sA = MergerXmlUtils.printElement(actual, nsPrefixA, "");           //$NON-NLS-1$
    if (sE.equals(sA)) {
      return true;
    } else {
      if (diff != null) {
        MergerXmlUtils.printXmlDiff(diff, sE, sA, nsPrefixE, nsPrefixA, NS_URI + ':' + keyAttr);
      }
      return false;
    }
  }

  /**
   * Finds the first element matching the given XPath expression in the given document.
   *
   * @param doc The document where to find the expression.
   * @param path The XPath expression. It must yield an {@link Element} node type.
   * @return The {@link Element} found or null.
   */
  @Nullable
  private Element findFirstElement(
      @NonNull Document doc,
      @NonNull String path) {
    Node result;
    try {
      result = (Node) mXPath.evaluate(path, doc, XPathConstants.NODE);
      if (result instanceof Element) {
        return (Element) result;
      }

      if (result != null) {
        mLog.error(Severity.ERROR,
            xmlFileAndLine(doc),
            "Unexpected Node type %s when evaluating %s",   //$NON-NLS-1$
            result.getClass().getName(), path);
      }
    } catch (XPathExpressionException e) {
      mLog.error(Severity.ERROR,
          xmlFileAndLine(doc),
          "XPath error on expr %s: %s",                       //$NON-NLS-1$
          path, e.toString());
    }
    return null;
  }

  /**
   * Finds zero or more elements matching the given XPath expression in the given document.
   *
   * @param doc The document where to find the expression.
   * @param path The XPath expression. Only {@link Element}s nodes will be returned.
   * @return A list of {@link Element} found, possibly empty but never null.
   */
  private List<Element> findElements(
      @NonNull Document doc,
      @NonNull String path) {
    return findElements(doc, path, null, null);
  }

  /**
   * Finds zero or more elements matching the given XPath expression in the given document. <p/>
   * Furthermore, the elements must have an attribute matching the given attribute name and value if
   * provided. (If you don't need to match an attribute, use the other version.) <p/> Note that if
   * you provide {@code attrName} as non-null then the {@code attrValue} must be non-null too. In
   * this case the XPath expression will be modified to add the check by naively appending a
   * "[name='value']" filter.
   *
   * @param doc The document where to find the expression.
   * @param path The XPath expression. Only {@link Element}s nodes will be returned.
   * @param attrName The name of the optional attribute to match. Can be null.
   * @param attrValue The value of the optional attribute to match. Can be null if {@code attrName}
   * is null, otherwise must be non-null.
   * @return A list of {@link Element} found, possibly empty but never null.
   * @see #findElements(Document, String)
   */
  private List<Element> findElements(
      @NonNull Document doc,
      @NonNull String path,
      @Nullable String attrName,
      @Nullable String attrValue) {
    List<Element> elements = new ArrayList<Element>();

    if (attrName != null) {
      assert attrValue != null;
      // Generate expression /manifest/application/activity[@android:name='my.fqcn']
      path = String.format("%1$s[@%2$s:%3$s='%4$s']",                     //$NON-NLS-1$
          path, NS_PREFIX, attrName, attrValue);
    }

    try {
      NodeList results = (NodeList) mXPath.evaluate(path, doc, XPathConstants.NODESET);
      if (results != null && results.getLength() > 0) {
        for (int i = 0; i < results.getLength(); i++) {
          Node n = results.item(i);
          assert n instanceof Element;
          if (n instanceof Element) {
            elements.add((Element) n);
          } else {
            mLog.error(Severity.ERROR,
                xmlFileAndLine(doc),
                "Unexpected Node type %s when evaluating %s",   //$NON-NLS-1$
                n.getClass().getName(), path);
          }
        }
      }
    } catch (XPathExpressionException e) {
      mLog.error(Severity.ERROR,
          xmlFileAndLine(doc),
          "XPath error on expr %s: %s",                       //$NON-NLS-1$
          path, e.toString());
    }

    return elements;
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
  private FileAndLine xmlFileAndLine(@NonNull Node node) {
    return MergerXmlUtils.xmlFileAndLine(node);
  }

  /**
   * Checks whether the given element has a tools:merge=override or tools:merge=remove attribute.
   *
   * @param node The node to check.
   * @return True if the element has a tools:merge=override or tools:merge=remove attribute.
   */
  private boolean hasOverrideOrRemoveTag(@Nullable Node node) {
    if (node == null || node.getNodeType() != Node.ELEMENT_NODE) {
      return false;
    }
    NamedNodeMap attrs = node.getAttributes();
    Node merge = attrs.getNamedItemNS(TOOLS_URI, MERGE_ATTR);
    String value = merge == null ? null : merge.getNodeValue();
    return MERGE_OVERRIDE.equals(value) || MERGE_REMOVE.equals(value);
  }

  /**
   * Cleans up all tools attributes from the given node hierarchy. <p/> If an element is marked with
   * tools:merge=override, this attribute is removed. If an element is marked with
   * tools:merge=remove, the <em>whole</em> element is removed.
   *
   * @param root The root node to parse and edit, recursively.
   */
  private void cleanupToolsAttributes(@Nullable Node root) {
    if (root == null) {
      return;
    }
    NamedNodeMap attrs = root.getAttributes();
    if (attrs != null) {
      for (int i = attrs.getLength() - 1; i >= 0; i--) {
        Node attr = attrs.item(i);
        if (SdkConstants.XMLNS_URI.equals(attr.getNamespaceURI()) &&
            TOOLS_URI.equals(attr.getNodeValue())) {
          attrs.removeNamedItem(attr.getNodeName());
        } else if (TOOLS_URI.equals(attr.getNamespaceURI()) &&
            MERGE_ATTR.equals(attr.getLocalName())) {
          attrs.removeNamedItem(attr.getNodeName());
        }
      }
      assert attrs.getNamedItemNS(TOOLS_URI, MERGE_ATTR) == null;
    }

    for (Node child = root.getFirstChild(); child != null; ) {
      if (child.getNodeType() != Node.ELEMENT_NODE) {
        child = child.getNextSibling();
        continue;
      }
      attrs = child.getAttributes();
      Node merge = attrs == null ? null : attrs.getNamedItemNS(TOOLS_URI, MERGE_ATTR);
      String value = merge == null ? null : merge.getNodeValue();
      Node sibling = child.getNextSibling();
      if (MERGE_REMOVE.equals(value)) {
        // Note: save the previous sibling since removing the child will clear its siblings.
        Node prev = child.getPreviousSibling();
        root.removeChild(child);
        // If there's some whitespace just before that element, clean it up too.
        while (prev != null && prev.getNodeType() == Node.TEXT_NODE) {
          if (prev.getNodeValue().trim().length() == 0) {
            Node prevPrev = prev.getPreviousSibling();
            root.removeChild(prev);
            prev = prevPrev;
          } else {
            break;
          }
        }
      } else {
        cleanupToolsAttributes(child);
      }
      child = sibling;
    }
  }

  /**
   * @see #cleanupToolsAttributes(Node)
   */
  private Document cleanupToolsAttributes(@NonNull Document doc) {
    cleanupToolsAttributes(doc.getFirstChild());
    return doc;
  }

  /**
   * Returns whether this manifest merger will insert source markers into the merged source
   *
   * @return whether this manifest merger will insert source markers into the merged source
   */
  public boolean isInsertSourceMarkers() {
    return mInsertSourceMarkers;
  }

  /**
   * Sets whether this manifest merger will insert source markers into the merged source
   *
   * @param insertSourceMarkers if true, insert source markers
   */
  public void setInsertSourceMarkers(boolean insertSourceMarkers) {
    mInsertSourceMarkers = insertSourceMarkers;
  }
}
