import { ExperimentalList, Host, type ViewDescription } from '@expo/ui/swift-ui';
import * as React from 'react';

type Row = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  tint: string;
};

const TINTS = ['#FF6B6B', '#FF8E53', '#FFC53D', '#52C41A', '#36CFC9', '#4096FF', '#9254DE'];
const ICONS = ['sun.max.fill', 'moon.fill', 'star.fill', 'cloud.fill', 'bolt.fill'];

const DATA: Row[] = Array.from({ length: 2000 }, (_, i) => ({
  id: i,
  title: `Row ${i}`,
  subtitle: `Lazy item rendered by a worklet — #${i}`,
  icon: ICONS[i % ICONS.length],
  tint: TINTS[i % TINTS.length],
}));

export default function ExperimentalListScreen() {
  const renderItem = React.useCallback((item: Row, index: number): ViewDescription => {
    'worklet';
    console.log(`Rendering row #${index} with id ${item.id}`);
    return {
      type: 'HStack',
      spacing: 12,
      alignment: 'center',
      children: [
        { type: 'Image', systemImage: item.icon, foregroundColor: item.tint },
        {
          type: 'VStack',
          alignment: 'leading',
          spacing: 2,
          children: [
            {
              type: 'Text',
              text: item.title,
              font: 'headline',
              weight: 'semibold',
            },
            {
              type: 'Text',
              text: item.subtitle,
              font: 'caption',
              foregroundColor: 'secondary',
            },
          ],
        },
        { type: 'Spacer' },
        {
          type: 'Text',
          text: `#${index}`,
          font: 'caption2',
          foregroundColor: 'gray',
        },
      ],
    };
  }, []);

  return (
    <Host style={{ flex: 1 }}>
      <ExperimentalList data={DATA} renderItem={renderItem} spacing={12} />
    </Host>
  );
}

ExperimentalListScreen.navigationOptions = {
  title: 'ExperimentalList (worklet renderItem)',
};
