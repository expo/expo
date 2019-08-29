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
import com.android.annotations.concurrency.Immutable;
import com.android.utils.SdkUtils;
import com.android.xml.AndroidManifest;
import com.google.common.base.Joiner;
import com.google.common.base.Preconditions;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableList;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.w3c.dom.Attr;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import static com.android.SdkConstants.ANDROID_URI;
import static com.android.SdkConstants.ATTR_NAME;
import static com.android.manifmerger.AttributeModel.Hexadecimal32BitsWithMinimumValue;
import static com.android.manifmerger.AttributeModel.MultiValueValidator;

/**
 * Model for the manifest file merging activities. <p>
 *
 * This model will describe each element that is eligible for merging and associated merging
 * policies. It is not reusable as most of its interfaces are private but a future enhancement could
 * easily make this more generic/reusable if we need to merge more than manifest files.
 */
@Immutable class ManifestModel {

  /**
   * Subclass of {@link com.android.manifmerger.ManifestModel.AttributeBasedNodeKeyResolver} that
   * uses "android:name" as the attribute.
   */
  private static final NodeKeyResolver DEFAULT_NAME_ATTRIBUTE_RESOLVER =
      new AttributeBasedNodeKeyResolver(ANDROID_URI, SdkConstants.ATTR_NAME);
  private static final NoKeyNodeResolver DEFAULT_NO_KEY_NODE_RESOLVER = new NoKeyNodeResolver();
  /**
   * A {@link com.android.manifmerger.ManifestModel.NodeKeyResolver} capable of extracting the
   * element key first in an "android:name" attribute and if not value found there, in the
   * "android:glEsVersion" attribute.
   */
  private static final NodeKeyResolver NAME_AND_GLESVERSION_KEY_RESOLVER = new NodeKeyResolver() {
    private final NodeKeyResolver nameAttrResolver = DEFAULT_NAME_ATTRIBUTE_RESOLVER;
    private final NodeKeyResolver glEsVersionResolver =
        new AttributeBasedNodeKeyResolver(ANDROID_URI,
            AndroidManifest.ATTRIBUTE_GLESVERSION);

    @Nullable
    @Override
    public String getKey(Element xmlElement) {
      String key = nameAttrResolver.getKey(xmlElement);
      return Strings.isNullOrEmpty(key)
          ? glEsVersionResolver.getKey(xmlElement)
          : key;
    }

    @NonNull
    @Override
    public ImmutableList<String> getKeyAttributesNames() {
      return ImmutableList.of(SdkConstants.ATTR_NAME, AndroidManifest.ATTRIBUTE_GLESVERSION);
    }
  };
  /**
   * Specific {@link com.android.manifmerger.ManifestModel.NodeKeyResolver} for intent-filter
   * elements. Intent filters do not have a proper key, therefore their identity is really carried
   * by the presence of the action and category sub-elements. We concatenate such elements sub-keys
   * (after sorting them to work around declaration order) and use that for the intent-filter unique
   * key.
   */
  private static final NodeKeyResolver INTENT_FILTER_KEY_RESOLVER = new NodeKeyResolver() {
    @Nullable
    @Override
    public String getKey(Element element) {
      OrphanXmlElement xmlElement = new OrphanXmlElement(element);
      assert (xmlElement.getType() == NodeTypes.INTENT_FILTER);
      // concatenate all actions and categories attribute names.
      List<String> allSubElementKeys = new ArrayList<String>();
      NodeList childNodes = element.getChildNodes();
      for (int i = 0; i < childNodes.getLength(); i++) {
        Node child = childNodes.item(i);
        if (child.getNodeType() != Node.ELEMENT_NODE) continue;
        OrphanXmlElement subElement = new OrphanXmlElement((Element) child);
        if (subElement.getType() == NodeTypes.ACTION
            || subElement.getType() == NodeTypes.CATEGORY) {
          Attr nameAttribute = subElement.getXml()
              .getAttributeNodeNS(ANDROID_URI, ATTR_NAME);
          if (nameAttribute != null) {
            allSubElementKeys.add(nameAttribute.getValue());
          }
        }
      }
      Collections.sort(allSubElementKeys);
      return Joiner.on('+').join(allSubElementKeys);
    }

    @NonNull
    @Override
    public ImmutableList<String> getKeyAttributesNames() {
      return ImmutableList.of("action#name", "category#name");
    }
  };
  private static final AttributeModel.BooleanValidator BOOLEAN_VALIDATOR =
      new AttributeModel.BooleanValidator();
  private static final boolean MULTIPLE_DECLARATION_FOR_SAME_KEY_ALLOWED = true;

  /**
   * Definitions of the support node types in the Android Manifest file. {@link <a
   * href=http://developer.android.com/guide/topics/manifest/manifest-intro.html/>} for more details
   * about the xml format.
   *
   * There is no DTD or schema associated with the file type so this is best effort in providing
   * some metadata on the elements of the Android's xml file.
   *
   * Each xml element is defined as an enum value and for each node, extra metadata is added <ul>
   * <li>{@link com.android.manifmerger.MergeType} to identify how the merging engine should process
   * this element.</li> <li>{@link com.android.manifmerger.ManifestModel.NodeKeyResolver} to resolve
   * the element's key. Elements can have an attribute like "android:name", others can use a
   * sub-element, and finally some do not have a key and are meant to be unique.</li> <li>List of
   * attributes models with special behaviors : <ul> <li>Smart substitution of class names to fully
   * qualified class names using the document's package declaration. The list's size can be
   * 0..n</li> <li>Implicit default value when no defined on the xml element.</li> <li>{@link
   * AttributeModel.Validator} to validate attribute value against.</li> </ul> </ul>
   *
   * It is of the outermost importance to keep this model correct as it is used by the merging
   * engine to make all its decisions. There should not be special casing in the engine, all
   * decisions must be represented here.
   *
   * If you find yourself needing to extend the model to support future requirements, do it here and
   * modify the engine to make proper decision based on the added metadata.
   */
  enum NodeTypes {

    /**
     * Action (contained in intent-filter) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/action-element.html> Action Xml
     * documentation</a>}
     */
    ACTION(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER),

    /**
     * Activity (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/activity-element.html> Activity Xml
     * documentation</a>}
     */
    ACTIVITY(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel("parentActivityName").setIsPackageDependent(),
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Activity-alias (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/activity-alias-element.html>
     * Activity-alias Xml documentation</a>}
     */
    ACTIVITY_ALIAS(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel("targetActivity").setIsPackageDependent(),
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Application (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/application-element.html> Application
     * Xml documentation</a>}
     */
    APPLICATION(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER,
        AttributeModel.newModel("backupAgent").setIsPackageDependent(),
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Category (contained in intent-filter) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/category-element.html> Category Xml
     * documentation</a>}
     */
    CATEGORY(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER),

    /**
     * Compatible-screens (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/compatible-screens-element.html>
     * Category Xml documentation</a>}
     */
    COMPATIBLE_SCREENS(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Data (contained in intent-filter) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/data-element.html> Category Xml
     * documentation</a>}
     */
    DATA(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Grant-uri-permission (contained in intent-filter) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/grant-uri-permission-element.html>
     * Category Xml documentation</a>}
     */
    GRANT_URI_PERMISSION(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Instrumentation (contained in intent-filter) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/instrumentation-element.html>
     * Instrunentation Xml documentation</a>}
     */
    INSTRUMENTATION(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Intent-filter (contained in activity, activity-alias, service, receiver) <br> <b>See also :
     * </b> {@link <a href=http://developer.android.com/guide/topics/manifest/intent-filter-element.html>
     * Intent-filter Xml documentation</a>}
     */
    INTENT_FILTER(MergeType.ALWAYS, INTENT_FILTER_KEY_RESOLVER,
        MULTIPLE_DECLARATION_FOR_SAME_KEY_ALLOWED),

    /**
     * Manifest (top level node) <br> <b>See also : </b> {@link <a href=http://developer.android.com/guide/topics/manifest/manifest-element.html>
     * Manifest Xml documentation</a>}
     */
    MANIFEST(MergeType.MERGE_CHILDREN_ONLY, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Meta-data (contained in activity, activity-alias, application, provider, receiver) <br>
     * <b>See also : </b> {@link <a href=http://developer.android.com/guide/topics/manifest/meta-data-element.html>
     * Meta-data Xml documentation</a>}
     */
    META_DATA(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER),

    /**
     * Path-permission (contained in provider) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/path-permission-element.html>
     * Meta-data Xml documentation</a>}
     */
    PATH_PERMISSION(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Permission-group (contained in manifest). <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/permission-group-element.html>
     * Permission-group Xml documentation</a>}
     */
    PERMISSION_GROUP(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME)),

    /**
     * Permission (contained in manifest). <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/permission-element.html> Permission
     * Xml documentation</a>}
     */
    PERMISSION(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME),
        AttributeModel.newModel("protectionLevel")
            .setDefaultValue("normal")
            // TODO : this will need to be populated from
            // sdk/platforms/android-19/data/res/values.attrs_manifest.xml
            .setOnReadValidator(new MultiValueValidator(
                "normal", "dangerous", "signature", "signatureOrSystem"))),

    /**
     * Permission-tree (contained in manifest). <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/permission-tree-element.html>
     * Permission-tree Xml documentation</a>}
     */
    PERMISSION_TREE(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME)),

    /**
     * Provider (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/provider-element.html> Provider Xml
     * documentation</a>}
     */
    PROVIDER(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME)
            .setIsPackageDependent()),

    /**
     * Receiver (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/receiver-element.html> Receiver Xml
     * documentation</a>}
     */
    RECEIVER(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Screen (contained in compatible-screens) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/compatible-screens-element.html>
     * Receiver Xml documentation</a>}
     */
    SCREEN(MergeType.MERGE, new TwoAttributesBasedKeyResolver(
        new AttributeBasedNodeKeyResolver(ANDROID_URI, "screenSize"),
        new AttributeBasedNodeKeyResolver(ANDROID_URI, "screenDensity"))),

    /**
     * Service (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/application-element.html> Service Xml
     * documentation</a>}
     */
    SERVICE(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(SdkConstants.ATTR_NAME).setIsPackageDependent()),

    /**
     * Supports-gl-texture (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/supports-gl-texture-element.html>
     * Support-screens Xml documentation</a>}
     */
    SUPPORTS_GL_TEXTURE(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER),

    /**
     * Support-screens (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/supports-screens-element.html>
     * Support-screens Xml documentation</a>}
     */
    SUPPORTS_SCREENS(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Uses-configuration (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/uses-configuration-element.html>
     * Support-screens Xml documentation</a>}
     */
    USES_CONFIGURATION(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER),

    /**
     * Uses-feature (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/uses-feature-element.html>
     * Uses-feature Xml documentation</a>}
     */
    USES_FEATURE(MergeType.MERGE, NAME_AND_GLESVERSION_KEY_RESOLVER,
        AttributeModel.newModel(AndroidManifest.ATTRIBUTE_REQUIRED)
            .setDefaultValue(SdkConstants.VALUE_TRUE)
            .setOnReadValidator(BOOLEAN_VALIDATOR)
            .setMergingPolicy(AttributeModel.OR_MERGING_POLICY),
        AttributeModel.newModel(AndroidManifest.ATTRIBUTE_GLESVERSION)
            .setDefaultValue("0x00010000")
            .setOnReadValidator(new Hexadecimal32BitsWithMinimumValue(0x00010000))),

    /**
     * Use-library (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/uses-library-element.html>
     * Use-library Xml documentation</a>}
     */
    USES_LIBRARY(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER,
        AttributeModel.newModel(AndroidManifest.ATTRIBUTE_REQUIRED)
            .setDefaultValue(SdkConstants.VALUE_TRUE)
            .setOnReadValidator(BOOLEAN_VALIDATOR)
            .setMergingPolicy(AttributeModel.OR_MERGING_POLICY)),

    /**
     * Uses-permission (contained in application) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/uses-permission-element.html>
     * Uses-permission Xml documentation</a>}
     */
    USES_PERMISSION(MergeType.MERGE, DEFAULT_NAME_ATTRIBUTE_RESOLVER),

    /**
     * Uses-sdk (contained in manifest) <br> <b>See also : </b> {@link <a
     * href=http://developer.android.com/guide/topics/manifest/uses-sdk-element.html> Uses-sdk Xml
     * documentation</a>}
     */
    USES_SDK(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER,
        AttributeModel.newModel("minSdkVersion")
            .setDefaultValue(SdkConstants.VALUE_1)
            .setMergingPolicy(AttributeModel.NO_MERGING_POLICY),
        AttributeModel.newModel("maxSdkVersion")
            .setMergingPolicy(AttributeModel.NO_MERGING_POLICY),
        // TODO : model target's default value is minSdkVersion value.
        AttributeModel.newModel("targetSdkVersion")
            .setMergingPolicy(AttributeModel.NO_MERGING_POLICY)
    ),

    /**
     * Custom tag for any application specific element
     */
    CUSTOM(MergeType.MERGE, DEFAULT_NO_KEY_NODE_RESOLVER);

    private final MergeType mMergeType;
    private final NodeKeyResolver mNodeKeyResolver;
    private final ImmutableList<AttributeModel> mAttributeModels;
    private final boolean mMultipleDeclarationAllowed;

    NodeTypes(
        @NonNull MergeType mergeType,
        @NonNull NodeKeyResolver nodeKeyResolver,
        @Nullable AttributeModel.Builder... attributeModelBuilders) {
      this(mergeType, nodeKeyResolver, false, attributeModelBuilders);
    }

    NodeTypes(
        @NonNull MergeType mergeType,
        @NonNull NodeKeyResolver nodeKeyResolver,
        boolean mutipleDeclarationAllowed,
        @Nullable AttributeModel.Builder... attributeModelBuilders) {
      this.mMergeType = Preconditions.checkNotNull(mergeType);
      this.mNodeKeyResolver = Preconditions.checkNotNull(nodeKeyResolver);
      ImmutableList.Builder<AttributeModel> attributeModels =
          new ImmutableList.Builder<AttributeModel>();
      if (attributeModelBuilders != null) {
        for (AttributeModel.Builder attributeModelBuilder : attributeModelBuilders) {
          attributeModels.add(attributeModelBuilder.build());
        }
      }
      this.mAttributeModels = attributeModels.build();
      this.mMultipleDeclarationAllowed = mutipleDeclarationAllowed;
    }

    /**
     * Returns the {@link NodeTypes} instance from an xml element name (without namespace
     * decoration). For instance, an xml element
     * <pre>
     *     {@code
     *     <activity android:name="foo">
     *         ...
     *     </activity>}
     * </pre>
     * has a xml simple name of "activity" which will resolve to {@link NodeTypes#ACTIVITY} value.
     *
     * Note : a runtime exception will be generated if no mapping from the simple name to a {@link
     * com.android.manifmerger.ManifestModel.NodeTypes} exists.
     *
     * @param xmlSimpleName the xml (lower-hyphen separated words) simple name.
     * @return the {@link NodeTypes} associated with that element name.
     */
    static NodeTypes fromXmlSimpleName(String xmlSimpleName) {
      String constantName = SdkUtils.xmlNameToConstantName(xmlSimpleName);

      try {
        return NodeTypes.valueOf(constantName);
      } catch (IllegalArgumentException e) {
        // if this element name is not a known tag, we categorize it as 'custom' which will
        // be simply merged. It will prevent us from catching simple spelling mistakes but
        // extensibility is a must have feature.
        return NodeTypes.CUSTOM;
      }
    }

    @NonNull NodeKeyResolver getNodeKeyResolver() {
      return mNodeKeyResolver;
    }

    ImmutableList<AttributeModel> getAttributeModels() {
      return mAttributeModels.asList();
    }

    @Nullable AttributeModel getAttributeModel(XmlNode.NodeName attributeName) {
      // mAttributeModels could be replaced with a Map if the number of models grows.
      for (AttributeModel attributeModel : mAttributeModels) {
        if (attributeModel.getName().equals(attributeName)) {
          return attributeModel;
        }
      }
      return null;
    }

    /**
     * Returns the Xml name for this node type
     */
    String toXmlName() {
      return SdkUtils.constantNameToXmlName(this.name());
    }

    MergeType getMergeType() {
      return mMergeType;
    }

    /**
     * Returns true if multiple declaration for the same type and key are allowed or false if there
     * must be only one declaration of this element for a particular key value.
     */
    boolean areMultipleDeclarationAllowed() {
      return mMultipleDeclarationAllowed;
    }
  }

  /**
   * Interface responsible for providing a key extraction capability from a xml element. Some
   * elements store their keys as an attribute, some as a sub-element attribute, some don't have any
   * key.
   */
  @Immutable interface NodeKeyResolver {

    /**
     * Returns the key associated with this xml element.
     *
     * @param xmlElement the xml element to get the key from
     * @return the key as a string to uniquely identify xmlElement from similarly typed elements in
     * the xml document or null if there is no key.
     */
    @Nullable String getKey(Element xmlElement);

    /**
     * Returns the attribute(s) used to store the xml element key.
     *
     * @return the key attribute(s) name(s) or null of this element does not have a key.
     */
    @NonNull ImmutableList<String> getKeyAttributesNames();
  }

  /**
   * Implementation of {@link com.android.manifmerger.ManifestModel.NodeKeyResolver} that do not
   * provide any key (the element has to be unique in the xml document).
   */
  private static class NoKeyNodeResolver implements NodeKeyResolver {

    @Override
    @Nullable
    public String getKey(Element xmlElement) {
      return null;
    }

    @NonNull
    @Override
    public ImmutableList<String> getKeyAttributesNames() {
      return ImmutableList.of();
    }
  }

  /**
   * Implementation of {@link com.android.manifmerger.ManifestModel.NodeKeyResolver} that uses an
   * attribute to resolve the key value.
   */
  private static class AttributeBasedNodeKeyResolver implements NodeKeyResolver {

    @Nullable private final String mNamespaceUri;
    private final String mAttributeName;

    /**
     * Build a new instance capable of resolving an xml element key from the passed attribute
     * namespace and local name.
     *
     * @param namespaceUri optional namespace for the attribute name.
     * @param attributeName attribute name
     */
    private AttributeBasedNodeKeyResolver(@Nullable String namespaceUri,
        @NonNull String attributeName) {
      this.mNamespaceUri = namespaceUri;
      this.mAttributeName = Preconditions.checkNotNull(attributeName);
    }

    @Override
    @Nullable
    public String getKey(Element xmlElement) {
      String key = mNamespaceUri == null
          ? xmlElement.getAttribute(mAttributeName)
          : xmlElement.getAttributeNS(mNamespaceUri, mAttributeName);
      if (Strings.isNullOrEmpty(key)) return null;
      return key;
    }

    @NonNull
    @Override
    public ImmutableList<String> getKeyAttributesNames() {
      return ImmutableList.of(mAttributeName);
    }
  }

  /**
   * Implementation of {@link com.android.manifmerger.ManifestModel.NodeKeyResolver} that combined
   * two attributes values to create the key value.
   */
  private static final class TwoAttributesBasedKeyResolver implements NodeKeyResolver {
    private final NodeKeyResolver firstAttributeKeyResolver;
    private final NodeKeyResolver secondAttributeKeyResolver;

    private TwoAttributesBasedKeyResolver(NodeKeyResolver firstAttributeKeyResolver,
        NodeKeyResolver secondAttributeKeyResolver) {
      this.firstAttributeKeyResolver = firstAttributeKeyResolver;
      this.secondAttributeKeyResolver = secondAttributeKeyResolver;
    }

    @Nullable
    @Override
    public String getKey(Element xmlElement) {
      String firstKey = firstAttributeKeyResolver.getKey(xmlElement);
      String secondKey = secondAttributeKeyResolver.getKey(xmlElement);

      return Strings.isNullOrEmpty(firstKey)
          ? secondKey
          : Strings.isNullOrEmpty(secondKey)
              ? firstKey
              : firstKey + "+" + secondKey;
    }

    @NonNull
    @Override
    public ImmutableList<String> getKeyAttributesNames() {
      return ImmutableList.of(firstAttributeKeyResolver.getKeyAttributesNames().get(0),
          secondAttributeKeyResolver.getKeyAttributesNames().get(0));
    }
  }
}
