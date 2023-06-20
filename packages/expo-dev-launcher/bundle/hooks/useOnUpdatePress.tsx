import { useNavigation } from '@react-navigation/native';
import * as React from 'react';

import { Toasts } from '../components/Toasts';
import { formatUpdateUrl } from '../functions/formatUpdateUrl';
import { loadUpdate, saveNavigationStateAsync } from '../native-modules/DevLauncherInternal';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { Update } from '../queries/useUpdatesForBranch';

export function useOnUpdatePress() {
  const toastStack = useToastStack();
  const navigation = useNavigation();

  const { runtimeVersion, projectUrl } = useUpdatesConfig();

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

        const updateUrl = formatUpdateUrl(update.manifestPermalink, update.message);
        const rootNavigation = navigation.getParent()?.getParent();

        try {
          const serializedNavigationState = JSON.stringify(rootNavigation?.getState());
          // not necessary to await this as its effects are only applied on app launch
          saveNavigationStateAsync(serializedNavigationState);
        } catch {}

        return loadUpdate(updateUrl, projectUrl)
          .catch((error) => {
            setLoadingUpdateId('');

            toastStack.push(() => <Toasts.Error>{error.message}</Toasts.Error>, {
              durationMs: 10000,
            });
          })
          .then(() => setLoadingUpdateId(''));
      }
    },
    [runtimeVersion, projectUrl, toastStack, navigation]
  );

  return {
    loadingUpdateId,
    onUpdatePress,
  };
}
