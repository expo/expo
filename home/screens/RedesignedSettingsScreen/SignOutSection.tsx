import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'expo-dev-client-components';
import * as React from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';
import { useDispatch } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';

export function SignOutSection() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const onPress = React.useCallback(() => {
    dispatch(SessionActions.signOut());
    requestAnimationFrame(navigation.goBack);
  }, [dispatch, navigation]);

  return (
    <View bg="default" overflow="hidden" rounded="large" border="hairline">
      <PressableOpacity onPress={onPress} containerProps={{ bg: 'default' }}>
        <View padding="medium">
          <Text size="medium">Sign out</Text>
        </View>
      </PressableOpacity>
    </View>
  );
}
