import { ModalBottomSheet, Column, LazyColumn, Spacer, Text } from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, padding, Shapes, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useMemo, useState } from 'react';

import { LanguageListItem } from './LanguageListItem';
import { LanguageSearchBar } from './LanguageSearchBar';

export interface Language {
  code: string;
  name: string;
  wikipediaName: string;
}

interface LanguageBottomSheetProps {
  languages: Language[];
  recentLanguageCodes: string[];
  currentLanguageCode: string;
  onDismiss: () => void;
  onLanguageSelected: (code: string) => void;
}

export function LanguageBottomSheet({
  languages,
  recentLanguageCodes,
  currentLanguageCode,
  onDismiss,
  onLanguageSelected,
}: LanguageBottomSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentLanguageCode);

  const recentLanguages = useMemo(
    () =>
      recentLanguageCodes
        .map((code) => languages.find((l) => l.code === code))
        .filter((l): l is Language => l != null),
    [recentLanguageCodes, languages]
  );

  const showRecentSection = recentLanguages.length > 0 && !searchQuery;

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return languages;
    const query = searchQuery.toLowerCase();
    return languages.filter((l) => l.name.toLowerCase().includes(query));
  }, [languages, searchQuery]);

  function handleSelect(code: string) {
    setSelectedCode(code);
    onLanguageSelected(code);
    onDismiss();
    setSearchQuery('');
  }

  return (
    <ModalBottomSheet onDismissRequest={onDismiss}>
      <Column horizontalAlignment="center">
        <Text style={{ typography: 'labelLarge' }}>Choose Wikipedia language</Text>

        <LanguageSearchBar
          onQueryChange={setSearchQuery}
          modifiers={[fillMaxWidth(), padding(16, 16, 16, 16)]}
        />

        <LazyColumn
          modifiers={[fillMaxWidth(), padding(16, 0, 16, 0), clip(Shapes.RoundedCorner(20))]}>
          {showRecentSection && (
            <>
              <Text style={{ typography: 'titleSmall' }} modifiers={[padding(16, 0, 16, 16)]}>
                Recent languages
              </Text>
              {recentLanguages.map((lang, index) => (
                <LanguageListItem
                  key={`recent-${lang.code}`}
                  headline={lang.name}
                  supportingText={lang.wikipediaName}
                  selected={selectedCode === lang.code}
                  items={recentLanguages.length}
                  index={index}
                  onClick={() => handleSelect(lang.code)}
                />
              ))}
            </>
          )}

          <Text style={{ typography: 'titleSmall' }} modifiers={[padding(16, 14, 16, 16)]}>
            Other languages
          </Text>
          {filteredLanguages.map((lang, index) => (
            <LanguageListItem
              key={lang.code}
              headline={lang.name}
              supportingText={lang.wikipediaName}
              selected={selectedCode === lang.code}
              items={filteredLanguages.length}
              index={index}
              onClick={() => handleSelect(lang.code)}
            />
          ))}
        </LazyColumn>

        <Spacer modifiers={[weight(1)]} />
      </Column>
    </ModalBottomSheet>
  );
}
