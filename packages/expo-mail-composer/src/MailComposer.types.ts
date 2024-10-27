/**
 * Represents a mail client available on the device.
 */
export type MailClient = {
  /**
   * The display name of the mail client.
   */
  label: string;
  /**
   * The package name of the mail client application.
   * You can use this package name with the `openPackage` function from `expo-intent-launcher` to open the mail client.
   * @platform android
   */
  packageName?: string;
  /**
   * The icon of the mail client application as a base64-encoded PNG image string.
   * The string is prefixed with `data:image/png;base64,` and can be used directly in an `expo-image` `<Image>`
   * component's `source` prop.
   * @platform android
   */
  icon?: string;
  /**
   * The URL scheme of the mail client.
   * You can use this URL with the `openURL` function from `expo-linking` to open the mail client.
   * @platform ios
   */
  url?: string;
};

// @needsAudit
/**
 * A map defining the data to fill the mail.
 */
export type MailComposerOptions = {
  /**
   * An array of e-mail addresses of the recipients.
   */
  recipients?: string[];
  /**
   * An array of e-mail addresses of the CC recipients.
   */
  ccRecipients?: string[];
  /**
   * An array of e-mail addresses of the BCC recipients.
   */
  bccRecipients?: string[];
  /**
   * Subject of the e-mail.
   */
  subject?: string;
  /**
   * Body of the e-mail.
   */
  body?: string;
  /**
   * Whether the body contains HTML tags so it could be formatted properly.
   * Not working perfectly on Android.
   */
  isHtml?: boolean;
  /**
   * An array of app's internal file URIs to attach.
   */
  attachments?: string[];
};

// @docsMissing
export type MailComposerResult = {
  status: MailComposerStatus;
};

// @docsMissing
export enum MailComposerStatus {
  UNDETERMINED = 'undetermined',
  SENT = 'sent',
  SAVED = 'saved',
  CANCELLED = 'cancelled',
}
