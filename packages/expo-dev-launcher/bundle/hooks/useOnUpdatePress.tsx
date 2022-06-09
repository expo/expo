import * as React from 'react';

import { Toasts } from '../components/Toasts';
import { loadUpdate } from '../native-modules/DevLauncherInternal';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { Update } from '../queries/useUpdatesForBranch';

export function useOnUpdatePress() {
  const toastStack = useToastStack();
  const { runtimeVersion, updatesUrl } = useUpdatesConfig();

  const [loadingUpdateId, setLoadingUpdateId] = React.useState('');

  const onUpdatePress = React.useCallback(
    (update: Update) => {
      const isCompatible = update.runtimeVersion === runtimeVersion;
      if (!isCompatible) {
        // prevent multiple taps bringing up multiple of the same toast
        if (
          toastStack.getItems().filter((i) => i.status === 'pushing' || i.status === 'settled')
            .length === 0
        ) {
          toastStack.push(
            () => (
              <Toasts.Warning>
                {`To run this update, you need a compatible development build with runtime version ${update.runtimeVersion}.`}
              </Toasts.Warning>
            ),
            { durationMs: 10000 }
          );
        }
      } else {
        setLoadingUpdateId(update.id);

        loadUpdate(update.manifestPermalink, updatesUrl)
          .catch((error) => {
            setLoadingUpdateId('');

            toastStack.push(() => <Toasts.Error>{error.message}</Toasts.Error>, {
              durationMs: 10000,
            });
          })
          .then(() => setLoadingUpdateId(''));
      }
    },
    [runtimeVersion, updatesUrl, toastStack]
  );

  return {
    loadingUpdateId,
    onUpdatePress,
  };
}
