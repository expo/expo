import { requireNativeView } from 'expo';
import { Platform, requireOptionalNativeModule } from 'expo-modules-core';
import React from 'react';
import { ColorValue, ViewProps } from 'react-native';

export type ContactAccessButtonProps = ViewProps & {
  /**
   * A string to match against contacts not yet exposed to the app.
   * You typically get this value from a search UI that your app presents, like a text field.
   */
  query?: string;

  /**
   * When the query produces a single result, the contact access button shows the caption under the matching contact name.
   * It can be nothing (default), email address or phone number.
   */
  caption?: 'default' | 'email' | 'phone';

  /**
   * An array of email addresses. The search omits contacts matching query that also match any email address in this array.
   */
  ignoredEmails?: string[];

  /**
   * An array of phone numbers. The search omits contacts matching query that also match any phone number in this set.
   */
  ignoredPhoneNumbers?: string[];

  /**
   * A tint color of the button and the modal that is presented when there is more than one match.
   */
  tintColor?: ColorValue;

  /**
   * A color of the button's background. Provided color should not be transparent,
   * otherwise it may not satisfy platform requirements for button legibility.
   */
  backgroundColor?: ColorValue;

  /**
   * A color of the button's title. Slightly dimmed version of this color is used for the caption text.
   * Make sure there is a good contrast between the text and the background,
   * otherwise platform requirements for button legibility may not be satisfied.
   */
  textColor?: ColorValue;
};

type ContactAccessButtonModule = {
  /**
   * Boolean value whether the contact access button is available on this platform.
   */
  isAvailable: boolean;
};

const NativeContactAccessButton =
  requireNativeView<ContactAccessButtonProps>('ExpoContactAccessButton');

/**
 * Creates a contact access button to quickly add contacts under limited-access authorization.
 */
export default class ContactAccessButton extends React.PureComponent<ContactAccessButtonProps> {
  static isAvailable() {
    return (
      Platform.OS === 'ios' &&
      requireOptionalNativeModule<ContactAccessButtonModule>('ExpoContactAccessButton')?.isAvailable
    );
  }

  render() {
    if (Platform.OS !== 'ios') {
      return null;
    }
    return <NativeContactAccessButton {...this.props} />;
  }
}
