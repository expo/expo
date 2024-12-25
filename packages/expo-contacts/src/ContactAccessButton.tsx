import { requireNativeView } from 'expo';
import { Platform, requireOptionalNativeModule } from 'expo-modules-core';
import React from 'react';
import { ColorValue, ViewProps } from 'react-native';

export type ContactAccessButtonProps = ViewProps & {
  /**
   * A string to match against contacts not yet exposed to the app.
   * You typically get this value from a search UI that your app presents, like a text field.
   * @platform ios 18.0+
   */
  query?: string;

  /**
   * When the query produces a single result, the contact access button shows the caption under the matching contact name.
   * It can be nothing (default), email address or phone number.
   * @platform ios 18.0+
   */
  caption?: 'default' | 'email' | 'phone';

  /**
   * An array of email addresses. The search omits contacts matching query that also match any email address in this array.
   * @platform ios 18.0+
   */
  ignoredEmails?: string[];

  /**
   * An array of phone numbers. The search omits contacts matching query that also match any phone number in this set.
   * @platform ios 18.0+
   */
  ignoredPhoneNumbers?: string[];

  /**
   * A tint color of the button and the modal that is presented when there is more than one match.
   * @platform ios 18.0+
   */
  tintColor?: ColorValue;

  /**
   * A color of the button's background. Provided color should not be transparent,
   * otherwise it may not satisfy platform requirements for button legibility.
   * @platform ios 18.0+
   */
  backgroundColor?: ColorValue;

  /**
   * A color of the button's title. Slightly dimmed version of this color is used for the caption text.
   * Make sure there is a good contrast between the text and the background,
   * otherwise platform requirements for button legibility may not be satisfied.
   * @platform ios 18.0+
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
 *
 * For more details, you can read the Apple docs about the underlying [`ContactAccessButton`](https://developer.apple.com/documentation/contactsui/contactaccessbutton) SwiftUI view.
 *
 * @platform ios 18.0+
 */
export default class ContactAccessButton extends React.PureComponent<ContactAccessButtonProps> {
  /**
   * Returns a boolean whether the `ContactAccessButton` is available on the platform.
   * This is `true` only on iOS 18.0 and newer.
   */
  static isAvailable(): boolean {
    return (
      Platform.OS === 'ios' &&
      (requireOptionalNativeModule<ContactAccessButtonModule>('ExpoContactAccessButton')
        ?.isAvailable ??
        false)
    );
  }

  render() {
    if (Platform.OS !== 'ios') {
      return null;
    }
    return <NativeContactAccessButton {...this.props} />;
  }
}
