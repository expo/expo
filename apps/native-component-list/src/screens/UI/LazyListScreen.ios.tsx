import { Host, List } from '@expo/ui/swift-ui';
import { Lazy, type LazyDescriptor } from '@expo/ui/swift-ui/lazy';
import * as React from 'react';

const ROW_COUNT = 5000;

type Row = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

const ROWS: Row[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: String(i),
  title: `Row ${i}`,
  subtitle: `Subtitle for row ${i}`,
  icon: i % 2 === 0 ? 'star.fill' : 'moon.fill',
}));

function buildRow(row: Row): LazyDescriptor {
  return Lazy.HStack({
    id: row.id,
    spacing: 12,
    children: [
      Lazy.Image({ systemName: row.icon, foregroundColor: 'orange' }),
      Lazy.VStack({
        spacing: 2,
        children: [
          Lazy.Text({ value: row.title, font: 'headline' }),
          Lazy.Text({
            value: row.subtitle,
            font: 'subheadline',
            foregroundColor: 'secondary',
          }),
        ],
      }),
    ],
  });
}

export default function LazyListScreen() {
  const items = React.useMemo(() => ROWS.map(buildRow), []);

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <List.LazyForEach items={items} />
      </List>
    </Host>
  );
}
