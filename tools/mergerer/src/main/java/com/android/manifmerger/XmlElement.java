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
import com.android.ide.common.res2.MergingException;
import com.android.utils.ILogger;
import com.android.utils.SdkUtils;
import com.android.utils.XmlUtils;
import com.google.common.base.Joiner;
import com.google.common.base.Optional;
import com.google.common.base.Preconditions;
import com.google.common.base.Splitter;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.w3c.dom.Attr;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;

/**
 * Xml {@link org.w3c.dom.Element} which is mergeable.
 *
 * A mergeable element can contains 3 types of children : <ul> <li>a child element, which itself may
 * or may not be mergeable.</li> <li>xml attributes which are related to the element.</li> <li>tools
 * oriented attributes to trigger specific behaviors from the merging tool</li> </ul>
 *
 * The two main responsibilities of this class is to be capable of comparing itself against another
 * instance of the same type as well as providing XML element merging capabilities.
 */
public class XmlElement extends OrphanXmlElement {

  @NonNull private final XmlDocument mDocument;

  private final NodeOperationType mNodeOperationType;
  // list of non tools related attributes.
  private final ImmutableList<XmlAttribute> mAttributes;
  // map of all tools related attributes keyed by target attribute name
  private final Map<NodeName, AttributeOperationType> mAttributesOperationTypes;
  // list of mergeable children elements.
  private final ImmutableList<XmlElement> mMergeableChildren;
  // optional selector declared on this xml element.
  @Nullable private final Selector mSelector;
  // optional list of libraries that we should ignore the minSdk version
  @NonNull private final List<Selector> mOverrideUsesSdkLibrarySelectors;

  public XmlElement(@NonNull Element xml, @NonNull XmlDocument document) {
    super(xml);

    mDocument = Preconditions.checkNotNull(document);
    Selector selector = null;
    List<Selector> overrideUsesSdkLibrarySelectors = ImmutableList.of();

    ImmutableMap.Builder<NodeName, AttributeOperationType> attributeOperationTypeBuilder =
        ImmutableMap.builder();
    ImmutableList.Builder<XmlAttribute> attributesListBuilder = ImmutableList.builder();
    NamedNodeMap namedNodeMap = getXml().getAttributes();
    NodeOperationType lastNodeOperationType = null;
    for (int i = 0; i < namedNodeMap.getLength(); i++) {
      Node attribute = namedNodeMap.item(i);
      if (SdkConstants.TOOLS_URI.equals(attribute.getNamespaceURI())) {
        String instruction = attribute.getLocalName();
        if (instruction.equals(NodeOperationType.NODE_LOCAL_NAME)) {
          // should we flag an error when there are more than one operation type on a node ?
          lastNodeOperationType = NodeOperationType.valueOf(
              SdkUtils.camelCaseToConstantName(
                  attribute.getNodeValue()));
        } else if (instruction.equals(Selector.SELECTOR_LOCAL_NAME)) {
          selector = new Selector(attribute.getNodeValue());
        } else if (instruction.equals(NodeOperationType.OVERRIDE_USES_SDK)) {
          String nodeValue = attribute.getNodeValue();
          ImmutableList.Builder<Selector> builder = ImmutableList.builder();
          for (String selectorValue : Splitter.on(',').split(nodeValue)) {
            builder.add(new Selector(selectorValue.trim()));
          }
          overrideUsesSdkLibrarySelectors = builder.build();
        } else {
          AttributeOperationType attributeOperationType;
          try {
            attributeOperationType =
                AttributeOperationType.valueOf(
                    SdkUtils.xmlNameToConstantName(instruction));
          } catch (IllegalArgumentException e) {
            try {
              // is this another tool's operation type that we do not care about.
              OtherOperationType.valueOf(instruction);
              break;
            } catch (IllegalArgumentException e1) {

              String errorMessage =
                  String.format("Invalid instruction '%1$s', "
                          + "valid instructions are : %2$s",
                      instruction,
                      Joiner.on(',').join(AttributeOperationType.values())
                  );
              throw new RuntimeException(MergingException.wrapException(e)
                  .withMessage(errorMessage)
                  .withFile(mDocument.getSourceFile())
                  .withPosition(mDocument.getNodePosition(xml)).build());
            }
          }
          for (String attributeName : Splitter.on(',').trimResults()
              .split(attribute.getNodeValue())) {
            if (attributeName.indexOf(XmlUtils.NS_SEPARATOR) == -1) {
              String toolsPrefix = XmlUtils
                  .lookupNamespacePrefix(getXml(), SdkConstants.TOOLS_URI,
                      SdkConstants.ANDROID_NS_NAME, false);
              // automatically provide the prefix.
              attributeName = toolsPrefix + XmlUtils.NS_SEPARATOR + attributeName;
            }
            NodeName nodeName = XmlNode.fromXmlName(attributeName);
            attributeOperationTypeBuilder.put(nodeName, attributeOperationType);
          }
        }
      }
    }
    mAttributesOperationTypes = attributeOperationTypeBuilder.build();
    for (int i = 0; i < namedNodeMap.getLength(); i++) {
      Node attribute = namedNodeMap.item(i);
      XmlAttribute xmlAttribute = new XmlAttribute(
          this, (Attr) attribute, getType().getAttributeModel(XmlNode.fromXmlName(
          ((Attr) attribute).getName())));
      attributesListBuilder.add(xmlAttribute);
    }
    mNodeOperationType = lastNodeOperationType;
    mAttributes = attributesListBuilder.build();
    mMergeableChildren = initMergeableChildren();
    mSelector = selector;
    mOverrideUsesSdkLibrarySelectors = overrideUsesSdkLibrarySelectors;
  }

  /**
   * Calculate the effective node operation type for a higher priority node when a lower priority
   * node is queried for merge.
   *
   * @param higherPriority the higher priority node which may have a {@link NodeOperationType}
   * declaration and may also have a {@link Selector} declaration.
   * @param lowerPriority the lower priority node that is elected for merging with the higher
   * priority node.
   * @return the effective {@link NodeOperationType} that should be used to affect higher and lower
   * priority nodes merging.
   */
  private static NodeOperationType calculateNodeOperationType(
      @NonNull XmlElement higherPriority,
      @NonNull XmlElement lowerPriority) {

    NodeOperationType operationType = higherPriority.getOperationType();
    // if the operation's selector exists and the lower priority node is not selected,
    // we revert to default operation type which is merge.
    if (higherPriority.supportsSelector()
        && higherPriority.mSelector != null
        && !higherPriority.mSelector.appliesTo(lowerPriority)) {
      operationType = NodeOperationType.MERGE;
    }
    return operationType;
  }

  private static List<Node> filterUninterestingNodes(NodeList nodeList) {
    List<Node> interestingNodes = new ArrayList<Node>();
    for (int i = 0; i < nodeList.getLength(); i++) {
      Node node = nodeList.item(i);
      if (node.getNodeType() == Node.TEXT_NODE) {
        Text t = (Text) node;
        if (!t.getData().trim().isEmpty()) {
          interestingNodes.add(node);
        }
      } else if (node.getNodeType() != Node.COMMENT_NODE) {
        interestingNodes.add(node);
      }
    }
    return interestingNodes;
  }

  private static Optional<String> checkAttributes(
      XmlElement expected,
      XmlElement actual) {

    for (XmlAttribute expectedAttr : expected.getAttributes()) {
      XmlAttribute.NodeName attributeName = expectedAttr.getName();
      if (attributeName.isInNamespace(SdkConstants.TOOLS_URI)) {
        continue;
      }
      Optional<XmlAttribute> actualAttr = actual.getAttribute(attributeName);
      if (actualAttr.isPresent()) {
        if (!expectedAttr.getValue().equals(actualAttr.get().getValue())) {
          return Optional.of(
              String.format("Attribute %1$s do not match: %2$s versus %3$s at %4$s",
                  expectedAttr.getId(),
                  expectedAttr.getValue(),
                  actualAttr.get().getValue(),
                  actual.printPosition()));
        }
      } else {
        return Optional.of(String.format("Attribute %1$s not found at %2$s",
            expectedAttr.getId(), actual.printPosition()));
      }
    }
    return Optional.absent();
  }

  /**
   * Returns all leading comments in the source xml before the node to be adopted.
   *
   * @param nodeToBeAdopted node that will be added as a child to this node.
   */
  static List<Node> getLeadingComments(Node nodeToBeAdopted) {
    ImmutableList.Builder<Node> nodesToAdopt = new ImmutableList.Builder<Node>();
    Node previousSibling = nodeToBeAdopted.getPreviousSibling();
    while (previousSibling != null
        && (previousSibling.getNodeType() == Node.COMMENT_NODE
        || previousSibling.getNodeType() == Node.TEXT_NODE)) {
      // we really only care about comments.
      if (previousSibling.getNodeType() == Node.COMMENT_NODE) {
        nodesToAdopt.add(previousSibling);
      }
      previousSibling = previousSibling.getPreviousSibling();
    }
    return nodesToAdopt.build().reverse();
  }

  /**
   * Returns the owning {@link com.android.manifmerger.XmlDocument}
   */
  @NonNull
  public XmlDocument getDocument() {
    return mDocument;
  }

  /**
   * Returns the list of attributes for this xml element.
   */
  public List<XmlAttribute> getAttributes() {
    return mAttributes;
  }

  /**
   * Returns the {@link com.android.manifmerger.XmlAttribute} for an attribute present on this xml
   * element, or {@link com.google.common.base.Optional#absent} if not present.
   *
   * @param attributeName the attribute name.
   */
  public Optional<XmlAttribute> getAttribute(NodeName attributeName) {
    for (XmlAttribute xmlAttribute : mAttributes) {
      if (xmlAttribute.getName().equals(attributeName)) {
        return Optional.of(xmlAttribute);
      }
    }
    return Optional.absent();
  }

  /**
   * Get the node operation type as optionally specified by the user. If the user did not explicitly
   * specify how conflicting elements should be handled, a {@link com.android.manifmerger.NodeOperationType#MERGE}
   * will be returned.
   */
  public NodeOperationType getOperationType() {
    return mNodeOperationType != null
        ? mNodeOperationType
        : NodeOperationType.MERGE;
  }

  /**
   * Get the attribute operation type as optionally specified by the user. If the user did not
   * explicitly specify how conflicting attributes should be handled, a {@link
   * AttributeOperationType#STRICT} will be returned.
   */
  public AttributeOperationType getAttributeOperationType(NodeName attributeName) {
    return mAttributesOperationTypes.containsKey(attributeName)
        ? mAttributesOperationTypes.get(attributeName)
        : AttributeOperationType.STRICT;
  }

  public Collection<Map.Entry<NodeName, AttributeOperationType>> getAttributeOperations() {
    return mAttributesOperationTypes.entrySet();
  }

  @NonNull
  public List<Selector> getOverrideUsesSdkLibrarySelectors() {
    return mOverrideUsesSdkLibrarySelectors;
  }

  @NonNull
  @Override
  public SourcePosition getPosition() {
    return mDocument.getNodePosition(this);
  }

  @NonNull
  @Override
  public SourceFile getSourceFile() {
    return mDocument.getSourceFile();
  }

  /**
   * Merge this xml element with a lower priority node.
   *
   * For now, attributes will be merged. If present on both xml elements, a warning will be issued
   * and the attribute merge will be rejected.
   *
   * @param lowerPriorityNode lower priority Xml element to merge with.
   * @param mergingReport the merging report to log errors and actions.
   */
  public void mergeWithLowerPriorityNode(
      XmlElement lowerPriorityNode,
      MergingReport.Builder mergingReport) {

    if (mSelector != null && !mSelector.isResolvable(getDocument().getSelectors())) {
      mergingReport.addMessage(getSourceFilePosition(),
          MergingReport.Record.Severity.ERROR,
          String.format("'tools:selector=\"%1$s\"' is not a valid library identifier, "
                  + "valid identifiers are : %2$s",
              mSelector.toString(),
              Joiner.on(',').join(mDocument.getSelectors().getKeys())));
      return;
    }
    mergingReport.getLogger().info("Merging " + getId()
        + " with lower " + lowerPriorityNode.printPosition());

    // workaround for 0.12 release and overlay treatment of manifest entries. This will
    // need to be expressed in the model instead.
    MergeType mergeType = getType().getMergeType();
    // if element we are merging in is not a library (an overlay or an application),  we should
    // always merge the <manifest> attributes otherwise, we do not merge the libraries
    // <manifest> attributes.
    if (isA(ManifestModel.NodeTypes.MANIFEST)
        && lowerPriorityNode.getDocument().getFileType() != XmlDocument.Type.LIBRARY) {
      mergeType = MergeType.MERGE;
    }

    if (mergeType != MergeType.MERGE_CHILDREN_ONLY) {
      // make a copy of all the attributes metadata, it will eliminate elements from this
      // list as it finds them explicitly defined in the lower priority node.
      // At the end of the explicit attributes processing, the remaining elements of this
      // list will need to be checked for default value that may clash with a locally
      // defined attribute.
      List<AttributeModel> attributeModels =
          new ArrayList<AttributeModel>(lowerPriorityNode.getType().getAttributeModels());

      // merge explicit attributes from lower priority node.
      for (XmlAttribute lowerPriorityAttribute : lowerPriorityNode.getAttributes()) {
        lowerPriorityAttribute.mergeInHigherPriorityElement(this, mergingReport);
        if (lowerPriorityAttribute.getModel() != null) {
          attributeModels.remove(lowerPriorityAttribute.getModel());
        }
      }
      // merge implicit default values from lower priority node when we have an explicit
      // attribute declared on this node.
      for (AttributeModel attributeModel : attributeModels) {
        if (attributeModel.getDefaultValue() != null) {
          Optional<XmlAttribute> myAttribute = getAttribute(attributeModel.getName());
          if (myAttribute.isPresent()) {
            myAttribute.get().mergeWithLowerPriorityDefaultValue(
                mergingReport, lowerPriorityNode);
          }
        }
      }
    }
    // are we supposed to merge children ?
    if (mNodeOperationType != NodeOperationType.MERGE_ONLY_ATTRIBUTES) {
      mergeChildren(lowerPriorityNode, mergingReport);
    } else {
      // record rejection of the lower priority node's children .
      for (XmlElement lowerPriorityChild : lowerPriorityNode.getMergeableElements()) {
        mergingReport.getActionRecorder().recordNodeAction(this,
            Actions.ActionType.REJECTED,
            lowerPriorityChild);
      }
    }
  }

  public ImmutableList<XmlElement> getMergeableElements() {
    return mMergeableChildren;
  }

  /**
   * Returns a child of a particular type and a particular key.
   *
   * @param type the requested child type.
   * @param keyValue the requested child key.
   * @return the child of {@link com.google.common.base.Optional#absent()} if no child of this type
   * and key exist.
   */
  public Optional<XmlElement> getNodeByTypeAndKey(
      ManifestModel.NodeTypes type,
      @Nullable String keyValue) {

    for (XmlElement xmlElement : mMergeableChildren) {
      if (xmlElement.isA(type) &&
          (keyValue == null || keyValue.equals(xmlElement.getKey()))) {
        return Optional.of(xmlElement);
      }
    }
    return Optional.absent();
  }

  /**
   * Returns all immediate children of this node for a particular type, irrespective of their key.
   *
   * @param type the type of children element requested.
   * @return the list (potentially empty) of children.
   */
  public ImmutableList<XmlElement> getAllNodesByType(ManifestModel.NodeTypes type) {
    ImmutableList.Builder<XmlElement> listBuilder = ImmutableList.builder();
    for (XmlElement mergeableChild : initMergeableChildren()) {
      if (mergeableChild.isA(type)) {
        listBuilder.add(mergeableChild);
      }
    }
    return listBuilder.build();
  }

  // merge this higher priority node with a lower priority node.
  public void mergeChildren(XmlElement lowerPriorityNode,
      MergingReport.Builder mergingReport) {

    // read all lower priority mergeable nodes.
    // if the same node is not defined in this document merge it in.
    // if the same is defined, so far, give an error message.
    for (XmlElement lowerPriorityChild : lowerPriorityNode.getMergeableElements()) {

      if (shouldIgnore(lowerPriorityChild, mergingReport)) {
        continue;
      }
      mergeChild(lowerPriorityChild, mergingReport);
    }
  }

  /**
   * Returns true if this element supports having a tools:selector decoration, false otherwise.
   */
  public boolean supportsSelector() {
    return getOperationType().isSelectable();
  }

  // merge a child of a lower priority node into this higher priority node.
  private void mergeChild(XmlElement lowerPriorityChild, MergingReport.Builder mergingReport) {

    ILogger logger = mergingReport.getLogger();

    // If this a custom element, we just blindly merge it in.
    if (lowerPriorityChild.getType() == ManifestModel.NodeTypes.CUSTOM) {
      handleCustomElement(lowerPriorityChild, mergingReport);
      return;
    }

    Optional<XmlElement> thisChildOptional =
        getNodeByTypeAndKey(lowerPriorityChild.getType(), lowerPriorityChild.getKey());

    // only in the lower priority document ?
    if (!thisChildOptional.isPresent()) {
      addElement(lowerPriorityChild, mergingReport);
      return;
    }
    // it's defined in both files.
    logger.verbose(lowerPriorityChild.getId() + " defined in both files...");

    XmlElement thisChild = thisChildOptional.get();
    switch (thisChild.getType().getMergeType()) {
      case CONFLICT:
        addMessage(mergingReport, MergingReport.Record.Severity.ERROR, String.format(
            "Node %1$s cannot be present in more than one input file and it's "
                + "present at %2$s and %3$s",
            thisChild.getType(),
            thisChild.printPosition(),
            lowerPriorityChild.printPosition()
        ));
        break;
      case ALWAYS:

        // no merging, we consume the lower priority node unmodified.
        // if the two elements are equal, just skip it.

        // but check first that we are not supposed to replace or remove it.
        NodeOperationType operationType =
            calculateNodeOperationType(thisChild, lowerPriorityChild);
        if (operationType == NodeOperationType.REMOVE ||
            operationType == NodeOperationType.REPLACE) {
          mergingReport.getActionRecorder().recordNodeAction(thisChild,
              Actions.ActionType.REJECTED, lowerPriorityChild);
          break;
        }

        if (thisChild.getType().areMultipleDeclarationAllowed()) {
          mergeChildrenWithMultipleDeclarations(lowerPriorityChild, mergingReport);
        } else {
          if (!thisChild.isEquals(lowerPriorityChild)) {
            addElement(lowerPriorityChild, mergingReport);
          }
        }
        break;
      default:
        // 2 nodes exist, some merging need to happen
        handleTwoElementsExistence(thisChild, lowerPriorityChild, mergingReport);
        break;
    }
  }

  /**
   * Handles presence of custom elements (elements not part of the android or tools namespaces).
   * Such elements are merged unchanged into the resulting document, and optionally, the namespace
   * definition is added to the merged document root element.
   *
   * @param customElement the custom element present in the lower priority document.
   * @param mergingReport the merging report to log errors and actions.
   */
  private void handleCustomElement(XmlElement customElement,
      MergingReport.Builder mergingReport) {
    addElement(customElement, mergingReport);

    // add the custom namespace to the document generation.
    String nodeName = customElement.getXml().getNodeName();
    if (!nodeName.contains(":")) {
      return;
    }
    String prefix = nodeName.substring(0, nodeName.indexOf(':'));
    String namespace = customElement.getDocument().getRootNode()
        .getXml().getAttribute(SdkConstants.XMLNS_PREFIX + prefix);

    if (namespace != null) {
      getDocument().getRootNode().getXml().setAttributeNS(
          SdkConstants.XMLNS_URI, SdkConstants.XMLNS_PREFIX + prefix, namespace);
    }
  }

  /**
   * Merges two children when this children's type allow multiple elements declaration with the same
   * key value. In that case, we only merge the lower priority child if there is not already an
   * element with the same key value that is equal to the lower priority child. Two children are
   * equals if they have the same attributes and children declared irrespective of the declaration
   * order.
   *
   * @param lowerPriorityChild the lower priority element's child.
   * @param mergingReport the merging report to log errors and actions.
   */
  private void mergeChildrenWithMultipleDeclarations(
      XmlElement lowerPriorityChild,
      MergingReport.Builder mergingReport) {

    Preconditions.checkArgument(lowerPriorityChild.getType().areMultipleDeclarationAllowed());
    if (lowerPriorityChild.getType().areMultipleDeclarationAllowed()) {
      for (XmlElement sameTypeChild : getAllNodesByType(lowerPriorityChild.getType())) {
        if (sameTypeChild.getId().equals(lowerPriorityChild.getId()) &&
            sameTypeChild.isEquals(lowerPriorityChild)) {
          return;
        }
      }
    }
    // if we end up here, we never found a child of this element with the same key and strictly
    // equals to the lowerPriorityChild so we should merge it in.
    addElement(lowerPriorityChild, mergingReport);
  }

  /**
   * Determine if we should completely ignore a child from any merging activity. There are 2
   * situations where we should ignore a lower priority child : <p> <ul> <li>The associate {@link
   * com.android.manifmerger.ManifestModel.NodeTypes} is annotated with {@link
   * com.android.manifmerger.MergeType#IGNORE}</li> <li>This element has a child of the same type
   * with no key that has a ' tools:node="removeAll' attribute.</li> </ul>
   *
   * @param lowerPriorityChild the lower priority child we should determine eligibility for
   * merging.
   * @return true if the element should be ignored, false otherwise.
   */
  private boolean shouldIgnore(
      XmlElement lowerPriorityChild,
      MergingReport.Builder mergingReport) {

    if (lowerPriorityChild.getType().getMergeType() == MergeType.IGNORE) {
      return true;
    }

    // do we have an element of the same type of that child with no key ?
    Optional<XmlElement> thisChildElementOptional =
        getNodeByTypeAndKey(lowerPriorityChild.getType(), null /* keyValue */);
    if (!thisChildElementOptional.isPresent()) {
      return false;
    }
    XmlElement thisChild = thisChildElementOptional.get();

    // are we supposed to delete all occurrences and if yes, is there a selector defined to
    // filter which elements should be deleted.
    boolean shouldDelete = thisChild.mNodeOperationType == NodeOperationType.REMOVE_ALL
        && (thisChild.mSelector == null
        || thisChild.mSelector.appliesTo(lowerPriorityChild));
    // if we should discard this child element, record the action.
    if (shouldDelete) {
      mergingReport.getActionRecorder().recordNodeAction(thisChildElementOptional.get(),
          Actions.ActionType.REJECTED,
          lowerPriorityChild);
    }
    return shouldDelete;
  }

  /**
   * Handle 2 elements (of same identity) merging. higher priority one has a tools:node="remove",
   * remove the low priority one higher priority one has a tools:node="replace", replace the low
   * priority one higher priority one has a tools:node="strict", flag the error if not equals.
   * default or tools:node="merge", merge the two elements.
   *
   * @param higherPriority the higher priority node.
   * @param lowerPriority the lower priority element.
   * @param mergingReport the merging report to log errors and actions.
   */
  private void handleTwoElementsExistence(
      XmlElement higherPriority,
      XmlElement lowerPriority,
      MergingReport.Builder mergingReport) {

    NodeOperationType operationType = calculateNodeOperationType(higherPriority, lowerPriority);
    // 2 nodes exist, 3 possibilities :
    //  higher priority one has a tools:node="remove", remove the low priority one
    //  higher priority one has a tools:node="replace", replace the low priority one
    //  higher priority one has a tools:node="strict", flag the error if not equals.
    switch (operationType) {
      case MERGE:
      case MERGE_ONLY_ATTRIBUTES:
        // record the action
        mergingReport.getActionRecorder().recordNodeAction(higherPriority,
            Actions.ActionType.MERGED, lowerPriority);
        // and perform the merge
        higherPriority.mergeWithLowerPriorityNode(lowerPriority, mergingReport);
        break;
      case REMOVE:
      case REPLACE:
        // so far remove and replace and similar, the post validation will take
        // care of removing this node in the case of REMOVE.

        // just don't import the lower priority node and record the action.
        mergingReport.getActionRecorder().recordNodeAction(higherPriority,
            Actions.ActionType.REJECTED, lowerPriority);
        break;
      case STRICT:
        Optional<String> compareMessage = higherPriority.compareTo(lowerPriority);
        if (compareMessage.isPresent()) {
          // flag error.
          addMessage(mergingReport, MergingReport.Record.Severity.ERROR, String.format(
              "Node %1$s at %2$s is tagged with tools:node=\"strict\", yet "
                  + "%3$s at %4$s is different : %5$s",
              higherPriority.getId(),
              higherPriority.printPosition(),
              lowerPriority.getId(),
              lowerPriority.printPosition(),
              compareMessage.get()
          ));
        }
        break;
      default:
        mergingReport.getLogger().error(null /* throwable */,
            "Unhandled node operation type %s", higherPriority.getOperationType());
        break;
    }
  }

  /**
   * Add an element and its leading comments as the last sub-element of the current element.
   *
   * @param elementToBeAdded xml element to be added to the current element.
   * @param mergingReport the merging report to log errors and actions.
   */
  private void addElement(XmlElement elementToBeAdded, MergingReport.Builder mergingReport) {

    List<Node> comments = getLeadingComments(elementToBeAdded.getXml());
    // record all the actions before the node is moved from the library document to the main
    // merged document.
    mergingReport.getActionRecorder().recordDefaultNodeAction(elementToBeAdded);

    // only in the new file, just import it.
    Node node = getXml().getOwnerDocument().adoptNode(elementToBeAdded.getXml());
    getXml().appendChild(node);

    // also adopt the child's comments if any.
    for (Node comment : comments) {
      Node newComment = getXml().getOwnerDocument().adoptNode(comment);
      getXml().insertBefore(newComment, node);
    }

    mergingReport.getLogger().verbose("Adopted " + node);
  }

  public boolean isEquals(XmlElement otherNode) {
    return !compareTo(otherNode).isPresent();
  }

  /**
   * Returns a potentially null (if not present) selector decoration on this element.
   */
  @Nullable
  public Selector getSelector() {
    return mSelector;
  }

  /**
   * Compares this element with another {@link XmlElement} ignoring all attributes belonging to the
   * {@link com.android.SdkConstants#TOOLS_URI} namespace.
   *
   * @param other the other element to compare against.
   * @return a {@link String} describing the differences between the two XML elements or {@link
   * Optional#absent()} if they are equals.
   */
  public Optional<String> compareTo(Object other) {

    if (!(other instanceof XmlElement)) {
      return Optional.of("Wrong type");
    }
    XmlElement otherNode = (XmlElement) other;

    // compare element names
    if (getXml().getNamespaceURI() != null) {
      if (!getXml().getLocalName().equals(otherNode.getXml().getLocalName())) {
        return Optional.of(
            String.format("Element names do not match: %1$s versus %2$s",
                getXml().getLocalName(),
                otherNode.getXml().getLocalName()));
      }
      // compare element ns
      String thisNS = getXml().getNamespaceURI();
      String otherNS = otherNode.getXml().getNamespaceURI();
      if ((thisNS == null && otherNS != null)
          || (thisNS != null && !thisNS.equals(otherNS))) {
        return Optional.of(
            String.format("Element namespaces names do not match: %1$s versus %2$s",
                thisNS, otherNS));
      }
    } else {
      if (!getXml().getNodeName().equals(otherNode.getXml().getNodeName())) {
        return Optional.of(String.format("Element names do not match: %1$s versus %2$s",
            getXml().getNodeName(),
            otherNode.getXml().getNodeName()));
      }
    }

    // compare attributes, we do it twice to identify added/missing elements in both lists.
    Optional<String> message = checkAttributes(this, otherNode);
    if (message.isPresent()) {
      return message;
    }
    message = checkAttributes(otherNode, this);
    if (message.isPresent()) {
      return message;
    }

    // compare children
    List<Node> expectedChildren = filterUninterestingNodes(getXml().getChildNodes());
    List<Node> actualChildren = filterUninterestingNodes(otherNode.getXml().getChildNodes());
    if (expectedChildren.size() != actualChildren.size()) {

      if (expectedChildren.size() > actualChildren.size()) {
        // missing some.
        List<String> missingChildrenNames =
            Lists.transform(expectedChildren, NODE_TO_NAME);
        missingChildrenNames.removeAll(Lists.transform(actualChildren, NODE_TO_NAME));
        return Optional.of(String.format(
            "%1$s: Number of children do not match up: "
                + "expected %2$d versus %3$d at %4$s, missing %5$s",
            getId(),
            expectedChildren.size(),
            actualChildren.size(),
            otherNode.printPosition(),
            Joiner.on(",").join(missingChildrenNames)));
      } else {
        // extra ones.
        List<String> extraChildrenNames = Lists.transform(actualChildren, NODE_TO_NAME);
        extraChildrenNames.removeAll(Lists.transform(expectedChildren, NODE_TO_NAME));
        return Optional.of(String.format(
            "%1$s: Number of children do not match up: "
                + "expected %2$d versus %3$d at %4$s, extra elements found : %5$s",
            getId(),
            expectedChildren.size(),
            actualChildren.size(),
            otherNode.printPosition(),
            Joiner.on(",").join(expectedChildren)));
      }
    }
    for (Node expectedChild : expectedChildren) {
      if (expectedChild.getNodeType() == Node.ELEMENT_NODE) {
        XmlElement expectedChildNode = new XmlElement((Element) expectedChild, mDocument);
        message = findAndCompareNode(otherNode, actualChildren, expectedChildNode);
        if (message.isPresent()) {
          return message;
        }
      }
    }
    return Optional.absent();
  }

  private Optional<String> findAndCompareNode(
      XmlElement otherElement,
      List<Node> otherElementChildren,
      XmlElement childNode) {

    Optional<String> message = Optional.absent();
    for (Node potentialNode : otherElementChildren) {
      if (potentialNode.getNodeType() == Node.ELEMENT_NODE) {
        XmlElement otherChildNode = new XmlElement((Element) potentialNode, mDocument);
        if (childNode.getType() == otherChildNode.getType()) {
          // check if this element uses a key.
          if (childNode.getType().getNodeKeyResolver().getKeyAttributesNames()
              .isEmpty()) {
            // no key... try all the other elements, if we find one equal, we are done.
            message = childNode.compareTo(otherChildNode);
            if (!message.isPresent()) {
              return Optional.absent();
            }
          } else {
            // key...
            if (childNode.getKey() == null) {
              // other key MUST also be null.
              if (otherChildNode.getKey() == null) {
                return childNode.compareTo(otherChildNode);
              }
            } else {
              if (childNode.getKey().equals(otherChildNode.getKey())) {
                return childNode.compareTo(otherChildNode);
              }
            }
          }
        }
      }
    }
    return message.isPresent()
        ? message
        : Optional.of(String.format("Child %1$s not found in document %2$s",
            childNode.getId(),
            otherElement.printPosition()));
  }

  private ImmutableList<XmlElement> initMergeableChildren() {
    ImmutableList.Builder<XmlElement> mergeableNodes = new ImmutableList.Builder<XmlElement>();
    NodeList nodeList = getXml().getChildNodes();
    for (int i = 0; i < nodeList.getLength(); i++) {
      Node node = nodeList.item(i);
      if (node instanceof Element) {
        XmlElement xmlElement = new XmlElement((Element) node, mDocument);
        mergeableNodes.add(xmlElement);
      }
    }
    return mergeableNodes.build();
  }

  void addMessage(MergingReport.Builder mergingReport,
      MergingReport.Record.Severity severity,
      String message) {
    mergingReport.addMessage(getSourceFilePosition(),
        severity,
        message);
  }
}
