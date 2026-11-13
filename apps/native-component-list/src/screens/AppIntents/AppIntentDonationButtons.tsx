import * as AppIntents from 'expo-app-intents';
import * as React from 'react';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';

type Props = {
  /** What the buttons donate, for example "Add 5". */
  title: string;
  /** The name the intent is registered under with `AppIntentDonationRegistry`. */
  intent: string;
  params?: Parameters<typeof AppIntents.donateIntentAsync>[1];
  /** Which donations the delete button deletes. Defaults to every donation of `intent`. */
  deleteFilter?: AppIntents.AppIntentDonationFilter;
  /** The delete button title. Defaults to one that names `title`. */
  deleteTitle?: string;
};

/**
 * Donates `intent` with `params`, and deletes the donations that `deleteFilter` selects, for QA.
 * Deleting right after donating returns the donated id, and a second delete returns none.
 */
export function AppIntentDonationButtons({
  title,
  intent,
  params,
  deleteFilter,
  deleteTitle,
}: Props) {
  const [result, setResult] = React.useState('None');

  return (
    <>
      <Button
        title={`Donate: ${title}`}
        onPress={() => {
          AppIntents.donateIntentAsync(intent, params)
            .then((id) => setResult(`Donated: ${id ?? 'unavailable'}`))
            .catch((error: unknown) => {
              setResult('Donation failed');
              console.warn(
                `Could not donate the '${intent}' intent; check that AppIntentsSetup registers it with AppIntentDonationRegistry, and that the params fit its DonationParams record.`,
                error
              );
            });
        }}
      />
      <Button
        title={deleteTitle ?? `Delete donations: ${title}`}
        onPress={() => {
          AppIntents.deleteDonationsAsync(deleteFilter ?? { intent })
            .then((ids) => setResult(`Deleted: ${ids.length > 0 ? ids.join(', ') : 'none'}`))
            .catch((error: unknown) => {
              setResult('Deletion failed');
              console.warn(
                `Could not delete the '${intent}' donations; check that AppIntentsSetup registers the intent, or the entity of an entity filter, with AppIntentDonationRegistry or AppEntityIdentifierRegistry.`,
                error
              );
            });
        }}
      />
      <BodyText>Last result: {result}</BodyText>
    </>
  );
}
