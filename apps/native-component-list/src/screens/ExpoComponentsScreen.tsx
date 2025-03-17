import { memo } from 'react';

import ComponentListScreen from './ComponentListScreen';
import ExpoAPIIcon from '../components/ExpoAPIIcon';
import { type ScreenApiItem } from '../types/ScreenConfig';

export default memo(function ExpoComponentsScreen({ apis }: { apis: ScreenApiItem[] }) {
  return (
    <ComponentListScreen
      renderItemRight={({ name }: { name: string }) => (
        <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
      )}
      apis={apis}
    />
  );
});
