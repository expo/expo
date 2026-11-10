import { useRouter } from 'expo-router';

import { ColumnScreen, OptionButton } from '@/components/split-view';

export default function NoItem() {
  const router = useRouter();
  return (
    <ColumnScreen column="content">
      {['item-1', 'item-2', 'item-3'].map((item) => (
        <OptionButton
          key={item}
          label={`Open ${item}`}
          onPress={() => router.replace(`/split-view/${item}`)}
        />
      ))}
    </ColumnScreen>
  );
}
