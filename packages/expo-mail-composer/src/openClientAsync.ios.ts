import { canOpenURL, openURL } from 'expo-linking';
import { ActionSheetIOS } from 'react-native';

import type { MailClientOptions } from './MailComposer.types';

/**
 * Represents a mail client with a name and a URL scheme.
 */
type TMailClient = { name: string; url: string };

/**
 * A list of mail clients with their names and URL schemes.
 * These URLs are used to check if the mail clients are available on the device.
 * Keep the list in sync with those in the file `plugin/src/withMailComposer.ts`.
 */
const mailClients: TMailClient[] = [
  { name: 'Airmail', url: 'airmail://' },
  { name: 'Apple Mail', url: 'message://' },
  { name: 'BlueMail', url: 'bluemail://' },
  { name: 'Canary', url: 'canary://' },
  { name: 'Edison Mail', url: 'edisonmail://' },
  { name: 'Email.cz', url: 'szn-email://' },
  { name: 'Fastmail', url: 'fastmail://' },
  { name: 'GMX Mail', url: 'x-gmxmail-netid-v1://' },
  { name: 'Gmail', url: 'googlegmail://' },
  { name: 'Mail.ru', url: 'mailrumail://' },
  { name: 'Outlook', url: 'ms-outlook://' },
  { name: 'Proton Mail', url: 'protonmail://' },
  { name: 'Secure Mail', url: 'ctxmail://' },
  { name: 'Spark', url: 'readdle-spark://' },
  { name: 'Superhuman', url: 'superhuman://' },
  { name: 'Telekom Mail', url: 'telekommail:// ' },
  { name: 'Tuta Mail', url: 'tutanota://' },
  { name: 'WEB.DE Mail', url: 'x-webdemail-netid-v1://' },
  { name: 'Yahoo Mail', url: 'ymail://' },
  { name: 'Yandex Mail', url: 'yandexmail://' },
  { name: 'freenet Mail', url: 'appcenter-f45b4c0b-75c9-2d01-7ab6-41f6a6015be2://' },
  { name: 'myMail', url: 'mymail-mailto://' },
];

/**
 * Checks the availability of listed mail clients on the device.
 */
const getAvailableMailAppsAsync = async (): Promise<TMailClient[]> =>
  (
    await Promise.all(mailClients.map(async (app) => ((await canOpenURL(app.url)) ? app : null)))
  ).filter(Boolean) as TMailClient[];

/**
 * Prompts the user to choose a mail app from the list of available mail apps.
 * @param title
 * @param cancelLabel
 */
async function askMailAppChoiceAsync({
  title,
  cancelLabel,
}: MailClientOptions): Promise<TMailClient | null> {
  const availableMailApps = await getAvailableMailAppsAsync();

  if (availableMailApps.length === 0) return null;
  if (availableMailApps.length === 1) return availableMailApps[0];

  return new Promise((resolve) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...availableMailApps.map(({ name }) => name), cancelLabel ?? 'Cancel'],
        cancelButtonIndex: availableMailApps.length,
      },
      (buttonIndex) =>
        resolve(buttonIndex === availableMailApps.length ? null : availableMailApps[buttonIndex])
    );
  });
}

/**
 * Opens the chosen mail client using its URL scheme.
 * @param options
 */
export async function openClientAsyncIos(options: MailClientOptions): Promise<void> {
  const mailApp = await askMailAppChoiceAsync(options);

  if (mailApp) {
    await openURL(mailApp.url);
  }
}
