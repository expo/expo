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
import com.android.annotations.Nullable;
import com.google.common.base.Joiner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Describes an attribute characteristics like if it supports smart package name replacement, has a
 * default value and a validator for its values.
 */
class AttributeModel {

  /**
   * Standard attribute value merging policy, generates an error unless both values are equal.
   */
  static final MergingPolicy STRICT_MERGING_POLICY = new MergingPolicy() {

    @Override
    public boolean shouldMergeDefaultValues() {
      return false;
    }

    @Nullable
    @Override
    public String merge(@NonNull String higherPriority, @NonNull String lowerPriority) {
      // it's ok if the values are equal, otherwise it's not.
      return higherPriority.equals(lowerPriority)
          ? higherPriority
          : null;
    }
  };
  /**
   * Boolean OR merging policy.
   */
  static final MergingPolicy OR_MERGING_POLICY = new MergingPolicy() {
    @Override
    public boolean shouldMergeDefaultValues() {
      return true;
    }

    @Nullable
    @Override
    public String merge(@NonNull String higherPriority, @NonNull String lowerPriority) {
      return Boolean.toString(BooleanValidator.isTrue(higherPriority) ||
          BooleanValidator.isTrue(lowerPriority));
    }
  };
  /**
   * Merging policy that will return the higher priority value regardless of the lower priority
   * value
   */
  static final MergingPolicy NO_MERGING_POLICY = new MergingPolicy() {

    @Override
    public boolean shouldMergeDefaultValues() {
      return true;
    }

    @Nullable
    @Override
    public String merge(@NonNull String higherPriority, @NonNull String lowerPriority) {
      return higherPriority;
    }
  };
  @NonNull private final XmlNode.NodeName mName;
  private final boolean mIsPackageDependent;
  @Nullable private final String mDefaultValue;
  @Nullable private final Validator mOnReadValidator;
  @Nullable private final Validator mOnWriteValidator;
  @NonNull private final MergingPolicy mMergingPolicy;

  /**
   * Define a new attribute with specific characteristics.
   *
   * @param name name of the attribute, so far assumed to be in the {@link
   * com.android.SdkConstants#ANDROID_URI} namespace.
   * @param isPackageDependent true if the attribute support smart substitution of package name.
   * @param defaultValue an optional default value.
   * @param onReadValidator an optional validator to validate values against.
   */
  private AttributeModel(@NonNull XmlNode.NodeName name,
      boolean isPackageDependent,
      @Nullable String defaultValue,
      @Nullable Validator onReadValidator,
      @Nullable Validator onWriteValidator,
      @NonNull MergingPolicy mergingPolicy) {
    mName = name;
    mIsPackageDependent = isPackageDependent;
    mDefaultValue = defaultValue;
    mOnReadValidator = onReadValidator;
    mOnWriteValidator = onWriteValidator;
    mMergingPolicy = mergingPolicy;
  }

  /**
   * Creates a new {@link Builder} to describe an attribute.
   *
   * @param attributeName the to be described attribute name
   */
  static Builder newModel(String attributeName) {
    return new Builder(attributeName);
  }

  /**
   * Decode a decimal or hexadecimal {@link String} into an {@link Integer}. String starting with 0
   * will be considered decimal, not octal.
   */
  private static int decodeDecOrHexString(String s) {
    long decodedValue = s.startsWith("0x") || s.startsWith("0X")
        ? Long.decode(s)
        : Long.parseLong(s);
    if (decodedValue < 0xFFFFFFFFL) {
      return (int) decodedValue;
    } else {
      throw new IllegalArgumentException("Value " + s + " too big for 32 bits.");
    }
  }

  @NonNull XmlNode.NodeName getName() {
    return mName;
  }

  /**
   * Return true if the attribute support smart substitution of partially fully qualified class
   * names with package settings as provided by the manifest node's package attribute {@link <a
   * href=http://developer.android.com/guide/topics/manifest/manifest-element.html>}
   *
   * @return true if this attribute supports smart substitution or false if not.
   */
  boolean isPackageDependent() {
    return mIsPackageDependent;
  }

  /**
   * Returns the attribute's default value or null if none.
   */
  @Nullable String getDefaultValue() {
    return mDefaultValue;
  }

  /**
   * Returns the attribute's {@link com.android.manifmerger.AttributeModel.Validator} to validate
   * its value when read from xml files or null if no validation is necessary.
   */
  @Nullable
  public Validator getOnReadValidator() {
    return mOnReadValidator;
  }

  /**
   * Returns the attribute's {@link com.android.manifmerger.AttributeModel.Validator} to validate
   * its value when the merged file is about to be persisted.
   */
  @Nullable
  public Validator getOnWriteValidator() {
    return mOnWriteValidator;
  }

  /**
   * Returns the {@link com.android.manifmerger.AttributeModel.MergingPolicy} for this attribute.
   */
  @NonNull
  public MergingPolicy getMergingPolicy() {
    return mMergingPolicy;
  }

  /**
   * Defines a merging policy between two attribute values. Example of merging policies can be
   * strict when it is illegal to try to merge or override a value by another. Another example is a
   * OR merging policy on boolean attribute values.
   */
  interface MergingPolicy {

    /**
     * Returns true if it should be attempted to merge this attribute value with the attribute
     * default value when merging with a node that does not contain the attribute declaration.
     */
    boolean shouldMergeDefaultValues();

    /**
     * Merges the two attributes values and returns the merged value. If the values cannot be
     * merged, return null.
     */
    @Nullable String merge(@NonNull String higherPriority, @NonNull String lowerPriority);
  }

  /**
   * Validates an attribute value.
   *
   * The validator can be called when xml documents are read to ensure the xml file contains valid
   * statements.
   *
   * This is a poor-mans replacement for not having a proper XML Schema do perform such
   * validations.
   */
  interface Validator {

    /**
     * Validates a value, issuing a warning or error in case of failure through the passed merging
     * report.
     *
     * @param mergingReport to report validation warnings or error
     * @param attribute the attribute to validate.
     * @param value the proposed or existing attribute value.
     * @return true if the value is legal for this attribute.
     */
    boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute,
        @NonNull String value);
  }

  static class Builder {

    private final String mName;
    private boolean mIsPackageDependent = false;
    private String mDefaultValue;
    private Validator mOnReadValidator;
    private Validator mOnWriteValidator;
    private MergingPolicy mMergingPolicy = STRICT_MERGING_POLICY;

    Builder(String name) {
      this.mName = name;
    }

    /**
     * Sets the attribute support for smart substitution of partially fully qualified class names
     * with package settings as provided by the manifest node's package attribute {@link <a
     * href=http://developer.android.com/guide/topics/manifest/manifest-element.html>}
     */
    Builder setIsPackageDependent() {
      mIsPackageDependent = true;
      return this;
    }

    /**
     * Sets the attribute default value.
     */
    Builder setDefaultValue(String value) {
      mDefaultValue = value;
      return this;
    }

    /**
     * Sets a {@link com.android.manifmerger.AttributeModel.Validator} to validate the attribute's
     * values coming from xml files.
     */
    Builder setOnReadValidator(Validator validator) {
      mOnReadValidator = validator;
      return this;
    }

    /**
     * Sets a {@link com.android.manifmerger.AttributeModel.Validator} to validate values before
     * they are written to the final merged document.
     */
    Builder setOnWriteValidator(Validator validator) {
      mOnWriteValidator = validator;
      return this;
    }

    Builder setMergingPolicy(MergingPolicy mergingPolicy) {
      mMergingPolicy = mergingPolicy;
      return this;
    }

    /**
     * Build an immutable {@link com.android.manifmerger.AttributeModel}
     */
    AttributeModel build() {
      return new AttributeModel(
          XmlNode.fromXmlName("android:" + mName),
          mIsPackageDependent,
          mDefaultValue,
          mOnReadValidator,
          mOnWriteValidator,
          mMergingPolicy);
    }
  }

  /**
   * Validates a boolean attribute type.
   */
  static class BooleanValidator implements Validator {

    // TODO: check with @xav where to find the acceptable values by runtime.
    private static final Pattern TRUE_PATTERN = Pattern.compile("true|True|TRUE");
    private static final Pattern FALSE_PATTERN = Pattern.compile("false|False|FALSE");

    private static boolean isTrue(String value) {
      return TRUE_PATTERN.matcher(value).matches();
    }

    @Override
    public boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute,
        @NonNull String value) {
      boolean matches = TRUE_PATTERN.matcher(value).matches() ||
          FALSE_PATTERN.matcher(value).matches();
      if (!matches) {
        attribute.addMessage(mergingReport, MergingReport.Record.Severity.ERROR,
            String.format(
                "Attribute %1$s at %2$s has an illegal value=(%3$s), "
                    + "expected 'true' or 'false'",
                attribute.getId(),
                attribute.printPosition(),
                value
            )
        );
      }
      return matches;
    }
  }

  /**
   * A {@link com.android.manifmerger.AttributeModel.Validator} for verifying that a proposed value
   * is part of the acceptable list of possible values.
   */
  static class MultiValueValidator implements Validator {

    private final String[] multiValues;
    private final String allValues;

    MultiValueValidator(String... multiValues) {
      this.multiValues = multiValues;
      allValues = Joiner.on(',').join(multiValues);
    }

    @Override
    public boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute, @NonNull String value) {
      for (String multiValue : multiValues) {
        if (multiValue.equals(value)) {
          return true;
        }
      }
      attribute.addMessage(mergingReport, MergingReport.Record.Severity.ERROR,
          String.format(
              "Invalid value for attribute %1$s at %2$s, value=(%3$s), "
                  + "acceptable values are (%4$s)",
              attribute.getId(),
              attribute.printPosition(),
              value,
              allValues
          )
      );
      return false;
    }
  }

  /**
   * A {@link com.android.manifmerger.AttributeModel.Validator} for verifying that a proposed value
   * is a numerical integer value.
   */
  static class IntegerValueValidator implements Validator {

    @Override
    public boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute, @NonNull String value) {
      try {
        return Integer.parseInt(value) > 0;
      } catch (NumberFormatException e) {
        attribute.addMessage(mergingReport, MergingReport.Record.Severity.ERROR,
            String.format(
                "Attribute %1$s at %2$s must be an integer, found %3$s",
                attribute.getId(),
                attribute.printPosition(),
                value)
        );
        return false;
      }
    }
  }

  /**
   * A {@link com.android.manifmerger.AttributeModel.Validator} to validate that a string is a valid
   * 32 bits hexadecimal representation.
   */
  static class Hexadecimal32Bits implements Validator {
    protected static final Pattern PATTERN = Pattern.compile("0[xX]([0-9a-fA-F]+)");

    @Override
    public boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute, @NonNull String value) {
      Matcher matcher = PATTERN.matcher(value);
      boolean valid = matcher.matches() && matcher.group(1).length() <= 8;
      if (!valid) {
        attribute.addMessage(mergingReport, MergingReport.Record.Severity.ERROR,
            String.format(
                "Attribute %1$s at %2$s is not a valid hexadecimal 32 bit value,"
                    + " found %3$s",
                attribute.getId(),
                attribute.printPosition(),
                value
            ));
      }
      return valid;
    }
  }

  /**
   * A {@link com.android.manifmerger.AttributeModel.Validator} to validate that a string is a valid
   * 32 positive hexadecimal representation with a minimum value requirement.
   */
  static class Hexadecimal32BitsWithMinimumValue extends Hexadecimal32Bits {

    private final int mMinimumValue;

    Hexadecimal32BitsWithMinimumValue(int minimumValue) {
      mMinimumValue = minimumValue;
    }

    @Override
    public boolean validates(@NonNull MergingReport.Builder mergingReport,
        @NonNull XmlAttribute attribute, @NonNull String value) {
      boolean valid = super.validates(mergingReport, attribute, value);
      if (valid) {
        try {
          Long decodedValue = Long.decode(value);
          valid = decodedValue >= mMinimumValue && decodedValue < 0xFFFFFFFFL;
        } catch (NumberFormatException e) {
          valid = false;
        }
        if (!valid) {
          attribute.addMessage(mergingReport, MergingReport.Record.Severity.ERROR,
              String.format(
                  "Attribute %1$s at %2$s is not a valid hexadecimal value,"
                      + " minimum is 0x%3$08X, maximum is 0x%4$08X, found %5$s",
                  attribute.getId(),
                  attribute.printPosition(),
                  mMinimumValue,
                  Integer.MAX_VALUE,
                  value
              ));
        }
        return valid;
      }
      return false;
    }
  }
}