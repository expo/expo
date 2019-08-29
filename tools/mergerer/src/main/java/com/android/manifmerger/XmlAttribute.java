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
import com.android.ide.common.blame.SourceFilePosition;
import com.android.ide.common.blame.SourcePosition;
import com.google.common.base.Joiner;
import com.google.common.base.Optional;
import com.google.common.base.Preconditions;
import com.google.common.base.Splitter;
import com.google.common.collect.ImmutableSet;
import org.w3c.dom.Attr;

/**
 * Defines an XML attribute inside a {@link XmlElement}.
 *
 * Basically a facade object on {@link Attr} objects with some added features like automatic
 * namespace handling, manifest merger friendly identifiers and smart replacement of shortened full
 * qualified class names using manifest node's package setting from the the owning Android's
 * document.
 */
public class XmlAttribute extends XmlNode {

  private final XmlElement mOwnerElement;
  private final Attr mXml;
  @Nullable
  private final AttributeModel mAttributeModel;

  /**
   * Creates a new facade object to a {@link Attr} xml attribute in a {@link XmlElement}.
   *
   * @param ownerElement the xml node object owning this attribute.
   * @param xml the xml definition of the attribute.
   */
  public XmlAttribute(
      @NonNull XmlElement ownerElement,
      @NonNull Attr xml,
      @Nullable AttributeModel attributeModel) {
    this.mOwnerElement = Preconditions.checkNotNull(ownerElement);
    this.mXml = Preconditions.checkNotNull(xml);
    this.mAttributeModel = attributeModel;
    if (mAttributeModel != null && mAttributeModel.isPackageDependent()) {
      String value = mXml.getValue();
      if (value == null || value.isEmpty()) return;
      // placeholders are never expanded.
      if (!PlaceholderHandler.isPlaceHolder(value)) {
        String pkg = mOwnerElement.getDocument().getPackageNameForAttributeExpansion();
        // We know it's a shortened FQCN if it starts with a dot
        // or does not contain any dot.
        if (value.indexOf('.') == -1 || value.charAt(0) == '.') {
          if (value.charAt(0) == '.') {
            value = pkg + value;
          } else {
            value = pkg + '.' + value;
          }
          mXml.setValue(value);
        }
      }
    }
  }

  /**
   * Returns the attribute's name, providing isolation from details like namespaces handling.
   */
  @Override
  public NodeName getName() {
    return XmlNode.unwrapName(mXml);
  }

  /**
   * Returns the attribute's value
   */
  public String getValue() {
    return mXml.getValue();
  }

  /**
   * Returns a display friendly identification string that can be used in machine and user readable
   * messages.
   */
  @Override
  public NodeKey getId() {
    // (Id of the parent element)@(my name)
    String myName = mXml.getNamespaceURI() == null ? mXml.getName() : mXml.getLocalName();
    return new NodeKey(mOwnerElement.getId() + "@" + myName);
  }

  @NonNull
  @Override
  public SourcePosition getPosition() {
    try {
      return mOwnerElement.getDocument().getNodePosition(this);
    } catch (Exception e) {
      return SourcePosition.UNKNOWN;
    }
  }

  @NonNull
  @Override
  public Attr getXml() {
    return mXml;
  }

  @Nullable
  public AttributeModel getModel() {
    return mAttributeModel;
  }

  XmlElement getOwnerElement() {
    return mOwnerElement;
  }

  void mergeInHigherPriorityElement(XmlElement higherPriorityElement,
      MergingReport.Builder mergingReport) {

    // does the higher priority has the same attribute as myself ?
    Optional<XmlAttribute> higherPriorityAttributeOptional =
        higherPriorityElement.getAttribute(getName());

    AttributeOperationType attributeOperationType =
        higherPriorityElement.getAttributeOperationType(getName());

    if (higherPriorityAttributeOptional.isPresent()) {

      XmlAttribute higherPriorityAttribute = higherPriorityAttributeOptional.get();
      handleBothAttributePresent(
          mergingReport, higherPriorityAttribute, attributeOperationType);
      return;
    }

    // it does not exist, verify if we are supposed to remove it.
    if (attributeOperationType == AttributeOperationType.REMOVE) {
      // record the fact the attribute was actively removed.
      mergingReport.getActionRecorder().recordAttributeAction(
          this,
          Actions.ActionType.REJECTED,
          AttributeOperationType.REMOVE);
      return;
    }

    // the node is not defined in the higher priority element, it's defined in this lower
    // priority element, we need to merge this lower priority attribute value with a potential
    // higher priority default value (implicitly set on the higher priority element).
    String mergedValue = mergeThisAndDefaultValue(mergingReport, higherPriorityElement);
    if (mergedValue == null) {
      return;
    }

    // ok merge it in the higher priority element.
    getName().addToNode(higherPriorityElement.getXml(), mergedValue);

    // and record the action.
    mergingReport.getActionRecorder().recordAttributeAction(
        this,
        Actions.ActionType.ADDED,
        getOwnerElement().getAttributeOperationType(getName()));
  }

  /**
   * Handles merging of two attributes value explicitly declared in xml elements.
   *
   * @param report report to log errors and actions.
   * @param higherPriority higher priority attribute we should merge this attribute with.
   * @param operationType user operation type optionally requested by the user.
   */
  private void handleBothAttributePresent(
      MergingReport.Builder report,
      XmlAttribute higherPriority,
      AttributeOperationType operationType) {

    // handles tools: attribute separately.

    if (getXml().getNamespaceURI() != null
        && getXml().getNamespaceURI().equals(SdkConstants.TOOLS_URI)) {
      handleBothToolsAttributePresent(higherPriority);
      return;
    }

    // the attribute is present on both elements, there are 2 possibilities :
    // 1. tools:replace was specified, replace the value.
    // 2. nothing was specified, the values should be equal or this is an error.
    if (operationType == AttributeOperationType.REPLACE) {
      // record the fact the lower priority attribute was rejected.
      report.getActionRecorder().recordAttributeAction(
          this,
          Actions.ActionType.REJECTED,
          AttributeOperationType.REPLACE);
      return;
    }
    // if the values are the same, then it's fine, otherwise flag the error.
    if (mAttributeModel != null) {
      String mergedValue = mAttributeModel.getMergingPolicy()
          .merge(higherPriority.getValue(), getValue());
      if (mergedValue != null) {
        higherPriority.mXml.setValue(mergedValue);
      } else {
        addConflictingValueMessage(report, higherPriority);
      }
      return;
    }
    // no merging policy, for now revert on checking manually for equality.
    if (!getValue().equals(higherPriority.getValue())) {
      addConflictingValueMessage(report, higherPriority);
    }
  }

  /**
   * Handles tools: namespace attributes presence in both documents.
   *
   * @param higherPriority the higherPriority attribute
   */
  private void handleBothToolsAttributePresent(
      XmlAttribute higherPriority) {

    // do not merge tools:node attributes, the higher priority one wins.
    if (getName().getLocalName().equals(NodeOperationType.NODE_LOCAL_NAME)) {
      return;
    }

    // everything else should be merged, duplicates should be eliminated.
    Splitter splitter = Splitter.on(',');
    ImmutableSet.Builder<String> targetValues = ImmutableSet.builder();
    targetValues.addAll(splitter.split(higherPriority.getValue()));
    targetValues.addAll(splitter.split(getValue()));
    higherPriority.getXml().setValue(Joiner.on(',').join(targetValues.build()));
  }

  /**
   * Merge this attribute value (on a lower priority element) with a implicit default value
   * (implicitly declared on the implicitNode).
   *
   * @param mergingReport report to log errors and actions.
   * @param implicitNode the lower priority node where the implicit attribute value resides.
   * @return the merged value that should be stored in the attribute or null if nothing should be
   * stored.
   */
  private String mergeThisAndDefaultValue(MergingReport.Builder mergingReport,
      XmlElement implicitNode) {

    String mergedValue = getValue();
    if (mAttributeModel == null || mAttributeModel.getDefaultValue() == null
        || !mAttributeModel.getMergingPolicy().shouldMergeDefaultValues()) {
      return mergedValue;
    }
    String defaultValue = mAttributeModel.getDefaultValue();
    if (defaultValue.equals(mergedValue)) {
      // even though the lower priority attribute is only declared and its value is the same
      // as the default value, ensure it gets added to the higher priority node.
      return mergedValue;
    } else {
      // ok, the default value and actual declaration are different, delegate to the
      // merging policy to figure out what value should be used if any.
      mergedValue = mAttributeModel.getMergingPolicy().merge(defaultValue, mergedValue);
      if (mergedValue == null) {
        addIllegalImplicitOverrideMessage(mergingReport, mAttributeModel, implicitNode);
        return null;
      }
      if (mergedValue.equals(defaultValue)) {
        // no need to forcefully add an attribute to the parent with its default value
        // since it was not declared to start with.
        return null;
      }
    }
    return mergedValue;
  }

  /**
   * Merge this attribute value with a lower priority node attribute default value. The attribute is
   * not explicitly set on the implicitNode, yet it exist on this attribute {@link
   * com.android.manifmerger.XmlElement} higher priority owner.
   *
   * @param mergingReport report to log errors and actions.
   * @param implicitNode the lower priority node where the implicit attribute value resides.
   */
  void mergeWithLowerPriorityDefaultValue(
      MergingReport.Builder mergingReport, XmlElement implicitNode) {

    if (mAttributeModel == null || mAttributeModel.getDefaultValue() == null
        || !mAttributeModel.getMergingPolicy().shouldMergeDefaultValues()) {
      return;
    }
    // if this value has been explicitly set to replace the implicit default value, just
    // log the action.
    if (mOwnerElement.getAttributeOperationType(getName()) == AttributeOperationType.REPLACE) {
      mergingReport.getActionRecorder().recordImplicitRejection(this, implicitNode);
      return;
    }
    String mergedValue = mAttributeModel.getMergingPolicy().merge(
        getValue(), mAttributeModel.getDefaultValue());
    if (mergedValue == null) {
      addIllegalImplicitOverrideMessage(mergingReport, mAttributeModel, implicitNode);
    } else {
      getXml().setValue(mergedValue);
      mergingReport.getActionRecorder().recordAttributeAction(
          this,
          Actions.ActionType.MERGED,
          null /* attributeOperationType */);
    }
  }

  private void addIllegalImplicitOverrideMessage(
      @NonNull MergingReport.Builder mergingReport,
      @NonNull AttributeModel attributeModel,
      @NonNull XmlElement implicitNode) {
    String error = String.format("Attribute %1$s value=(%2$s) at %3$s"
            + " cannot override implicit default value=(%4$s) at %5$s",
        getId(),
        getValue(),
        printPosition(),
        attributeModel.getDefaultValue(),
        implicitNode.printPosition());
    addMessage(mergingReport, MergingReport.Record.Severity.ERROR, error);
  }

  private void addConflictingValueMessage(
      MergingReport.Builder report,
      XmlAttribute higherPriority) {

    Actions.AttributeRecord attributeRecord = report.getActionRecorder()
        .getAttributeCreationRecord(higherPriority);

    String error = String.format(
        "Attribute %1$s value=(%2$s) from %3$s\n"
            + "\tis also present at %4$s value=(%5$s)\n"
            + "\tSuggestion: add 'tools:replace=\"%6$s\"' to <%7$s> element "
            + "at %8$s to override",
        higherPriority.getId(),
        higherPriority.getValue(),
        attributeRecord != null
            ? attributeRecord.getActionLocation().print(true /*shortFormat*/)
            : "(unknown)",
        printPosition(),
        getValue(),
        mXml.getName(),
        getOwnerElement().getType().toXmlName(),
        higherPriority.getOwnerElement().printPosition()
    );
    higherPriority.addMessage(report,
        attributeRecord != null
            ? attributeRecord.getActionLocation().getPosition()
            : SourcePosition.UNKNOWN,
        MergingReport.Record.Severity.ERROR, error);
  }

  void addMessage(MergingReport.Builder report,
      MergingReport.Record.Severity severity,
      String message) {
    addMessage(report, getPosition(), severity, message);
  }

  void addMessage(MergingReport.Builder report,
      SourcePosition position,
      MergingReport.Record.Severity severity,
      String message) {
    report.addMessage(
        new SourceFilePosition(getOwnerElement().getDocument().getSourceFile(), position),
        severity, message);
  }

  @NonNull
  @Override
  public SourceFile getSourceFile() {
    return getOwnerElement().getSourceFile();
  }
}
