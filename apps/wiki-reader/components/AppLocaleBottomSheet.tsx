import { Column, LazyColumn, ModalBottomSheet, Spacer, Text } from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, padding, Shapes, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useMemo, useState } from 'react';

import { LanguageListItem } from './LanguageListItem';
import { LanguageSearchBar } from './LanguageSearchBar';

export interface AppLocale {
  code: string;
  name: string;
}

interface AppLocaleBottomSheetProps {
  locales: AppLocale[];
  currentLocaleCode: string | null;
  onDismiss: () => void;
  onLocaleSelected: (code: string | null) => void;
}

export function AppLocaleBottomSheet({
  locales,
  currentLocaleCode,
  onDismiss,
  onLocaleSelected,
}: AppLocaleBottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentLocaleCode);

  const filteredLocales = useMemo(() => {
    if (!searchQuery) return locales;
    const query = searchQuery.toLowerCase();
    return locales.filter((l) => l.name.toLowerCase().includes(query));
  }, [locales, searchQuery]);

  function handleSelect(code: string | null) {
    setSelectedCode(code);
    onLocaleSelected(code);
    onDismiss();
    setSearchQuery('');
  }

  const isSystemDefault = selectedCode == null;

  return (
    <ModalBottomSheet onDismissRequest={onDismiss}>
      <Column horizontalAlignment="center">
        <Text style={{ typography: 'labelLarge' }}>Choose app language</Text>

        <LanguageSearchBar
          onQueryChange={setSearchQuery}
          modifiers={[fillMaxWidth(), padding(16, 16, 16, 16)]}
        />

        <LazyColumn
          modifiers={[fillMaxWidth(), padding(16, 0, 16, 0), clip(Shapes.RoundedCorner(20))]}>
          <LanguageListItem
            headline="System default"
            selected={isSystemDefault}
            items={filteredLocales.length + 1}
            index={0}
            onClick={() => handleSelect(null)}
          />

          <Spacer modifiers={[padding(0, 6, 0, 6)]} />

          {filteredLocales.map((locale, index) => (
            <LanguageListItem
              key={locale.code}
              headline={locale.name}
              selected={selectedCode === locale.code}
              items={filteredLocales.length}
              index={index}
              onClick={() => handleSelect(locale.code)}
            />
          ))}
        </LazyColumn>

        <Spacer modifiers={[weight(1)]} />
      </Column>
    </ModalBottomSheet>
  );
}
