import { memo } from 'react';

import ExpoAPIIcon from '../components/ExpoAPIIcon';
import ComponentListScreen, { type ListElement } from './ComponentListScreen';

export default memo(function ExpoComponentsScreen({ apis }: { apis: ListElement[] }) {
  return (
    <ComponentListScreen
      renderItemRight={({ name }: { name: string }) => (
        <ExpoAPIIcon name={name} style={{ marginRight: 10, marginLeft: 6 }} />
      )}
      apis={apis}
    />
  );
});
