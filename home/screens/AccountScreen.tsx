import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import Account from '../containers/Account';
import { AllStackRoutes } from '../navigation/Navigation.types';

export default function AccountScreen({
  navigation,
  ...props
}: StackScreenProps<AllStackRoutes, 'Account'>) {
  return (
    <Account {...props} accountName={props.route.params.accountName} navigation={navigation} />
  );
}
