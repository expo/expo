import { StackScreenProps } from '@react-navigation/stack';
import { ThemeContext, useExpoTheme } from 'expo-dev-client-components';
import { useHomeScreenDataQuery } from 'graphql/types';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { useDispatch, useSelector } from '../../redux/Hooks';
import { HistoryList } from '../../types';
import isUserAuthenticated from '../../utils/isUserAuthenticated';
import { HomeScreenView } from './HomeScreenView';

type NavigationProps = StackScreenProps<HomeStackRoutes, 'Home'>;

export function HomeScreen(props: NavigationProps) {
  const [isFocused, setFocused] = React.useState(true);
  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', () => {
      setFocused(true);
    });
    const unsubscribeBlur = props.navigation.addListener('blur', () => {
      setFocused(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [props.navigation]);

  const dispatch = useDispatch();
  const { recentHistory, allHistory, isAuthenticated } = useSelector(
    React.useCallback((data) => {
      const { history } = data.history;

      return {
        recentHistory: history.take(10) as HistoryList,
        allHistory: history as HistoryList,
        isAuthenticated: isUserAuthenticated(data.session),
      };
    }, [])
  );

  const theme = useExpoTheme();

  const { data } = useHomeScreenDataQuery();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background.default }} edges={['top']}>
      <ThemeContext.Consumer>
        {(theme) => (
          <HomeScreenView
            theme={theme}
            {...props}
            isFocused={isFocused}
            dispatch={dispatch}
            recentHistory={recentHistory}
            allHistory={allHistory}
            isAuthenticated={isAuthenticated}
            currentUser={data?.viewer ?? undefined}
          />
        )}
      </ThemeContext.Consumer>
    </SafeAreaView>
  );
}
