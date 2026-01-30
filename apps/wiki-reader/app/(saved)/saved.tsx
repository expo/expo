import {
  Box,
  Column,
  FilterChip,
  FlowRow,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  ListItem,
  Spacer,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import { Color, Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { cornerRadii } from '@/components/ClickableListItem';
import { DeleteArticleDialog } from '@/components/DeleteArticleDialog';

interface SavedArticle {
  pageId: number;
  lang: string;
  langName: string;
  title: string;
  description?: string;
}

const MOCK_SAVED_ARTICLES: SavedArticle[] = [
  {
    pageId: 1,
    lang: 'en',
    langName: 'English',
    title: 'React (software)',
    description: 'JavaScript library for building user interfaces',
  },
  {
    pageId: 2,
    lang: 'en',
    langName: 'English',
    title: 'TypeScript',
    description: 'Programming language developed by Microsoft',
  },
  {
    pageId: 3,
    lang: 'en',
    langName: 'English',
    title: 'Expo (framework)',
    description: 'Framework for building React Native applications',
  },
  {
    pageId: 7,
    lang: 'en',
    langName: 'English',
    title: 'Node.js',
    description: 'Open-source, cross-platform JavaScript runtime environment',
  },
  {
    pageId: 8,
    lang: 'en',
    langName: 'English',
    title: 'GraphQL',
    description: 'Data query and manipulation language for APIs',
  },
  {
    pageId: 9,
    lang: 'en',
    langName: 'English',
    title: 'Rust (programming language)',
    description: 'Multi-paradigm, general-purpose programming language emphasizing safety',
  },
  {
    pageId: 10,
    lang: 'en',
    langName: 'English',
    title: 'WebAssembly',
    description: 'Binary instruction format for a stack-based virtual machine',
  },
  {
    pageId: 11,
    lang: 'en',
    langName: 'English',
    title: 'Linux',
    description: 'Family of open-source Unix-like operating systems',
  },
  {
    pageId: 4,
    lang: 'de',
    langName: 'Deutsch',
    title: 'Kotlin (Programmiersprache)',
    description: 'Plattformübergreifende, statisch typisierte Programmiersprache',
  },
  {
    pageId: 5,
    lang: 'de',
    langName: 'Deutsch',
    title: 'Jetpack Compose',
    description: 'Modernes Toolkit für native Android-Benutzeroberflächen',
  },
  {
    pageId: 12,
    lang: 'de',
    langName: 'Deutsch',
    title: 'Android (Betriebssystem)',
    description: 'Mobiles Betriebssystem von Google',
  },
  {
    pageId: 13,
    lang: 'de',
    langName: 'Deutsch',
    title: 'Freie Software',
    description: 'Software, die jedem die Nutzung, Untersuchung und Änderung erlaubt',
  },
  {
    pageId: 6,
    lang: 'ja',
    langName: '日本語',
    title: 'ウィキペディア',
    description: 'オンライン百科事典',
  },
  {
    pageId: 14,
    lang: 'ja',
    langName: '日本語',
    title: 'プログラミング言語',
    description: 'コンピュータに命令するための人工言語',
  },
  {
    pageId: 15,
    lang: 'ja',
    langName: '日本語',
    title: 'オペレーティングシステム',
    description: 'コンピュータのハードウェアを管理するソフトウェア',
  },
  {
    pageId: 16,
    lang: 'fr',
    langName: 'Français',
    title: 'Intelligence artificielle',
    description: 'Ensemble de théories et techniques visant à créer des machines intelligentes',
  },
  {
    pageId: 17,
    lang: 'fr',
    langName: 'Français',
    title: 'Informatique',
    description: "Science du traitement automatique de l'information",
  },
  {
    pageId: 18,
    lang: 'fr',
    langName: 'Français',
    title: 'Réseau informatique',
    description: 'Ensemble de machines interconnectées',
  },
];

function buildWikipediaUrl(article: SavedArticle): string {
  const slug = article.title.replace(/ /g, '_');
  return `https://${article.lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
}

export default function Saved() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [articles, setArticles] = useState<SavedArticle[]>(MOCK_SAVED_ARTICLES);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedArticle | null>(null);

  const availableLanguages = useMemo(() => {
    const langMap = new Map<string, string>();
    for (const article of articles) {
      langMap.set(article.lang, article.langName);
    }
    return Array.from(langMap.entries()).map(([code, name]) => ({ code, name }));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (selectedLanguages.size === 0) return articles;
    return articles.filter((a) => selectedLanguages.has(a.lang));
  }, [articles, selectedLanguages]);

  const groupedArticles = useMemo(() => {
    const groups = new Map<string, SavedArticle[]>();
    for (const article of filteredArticles) {
      const group = groups.get(article.langName);
      if (group) {
        group.push(article);
      } else {
        groups.set(article.langName, [article]);
      }
    }
    return groups;
  }, [filteredArticles]);

  const toggleLanguageFilter = (langCode: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(langCode)) {
        next.delete(langCode);
      } else {
        next.add(langCode);
      }
      return next;
    });
  };

  const showLanguageChips = availableLanguages.length > 1;
  const showLanguageHeaders = groupedArticles.size > 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Host matchContents>
              <IconButton
                onPress={() => {
                  setDeleteTarget(null);
                  setShowDeleteDialog(true);
                }}>
                <Icon source={require('@/assets/symbols/delete.xml')} tintColor="#1d1b20" />
              </IconButton>
            </Host>
          ),
        }}
      />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        {articles.length === 0 ? (
          <Box modifiers={[fillMaxSize()]} contentAlignment="center">
            <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 8 }}>
              <Box contentAlignment="center">
                <Spacer
                  modifiers={[
                    clip(Shapes.Material.Cookie12Sided),
                    background(Color.android.dynamic.primaryContainer),
                    paddingAll(32),
                    size(100, 100),
                  ]}
                />
                <Icon
                  source={require('@/assets/symbols/download_done.xml')}
                  tintColor={Color.android.dynamic.onPrimaryContainer}
                  modifiers={[size(100, 100)]}
                />
              </Box>
              <Spacer modifiers={[height(8)]} />
              <Text style={{ typography: 'titleLarge', textAlign: 'center' }}>
                No saved articles
              </Text>
              <Text
                style={{ typography: 'bodyMedium', textAlign: 'center' }}
                modifiers={[padding(48, 0, 48, 0)]}>
                Articles you save will show up here
              </Text>
            </Column>
          </Box>
        ) : (
          <LazyColumn
            verticalArrangement={{ spacedBy: 2 }}
            contentPadding={{ start: 16, end: 16, top: 8, bottom: 16 }}>
            {showLanguageChips ? (
              <FlowRow
                horizontalArrangement={{ spacedBy: 8 }}
                modifiers={[padding(0, 8, 0, 8), fillMaxWidth()]}>
                {availableLanguages.map((lang) => (
                  <FilterChip
                    key={lang.code}
                    label={lang.name}
                    selected={selectedLanguages.has(lang.code)}
                    onPress={() => toggleLanguageFilter(lang.code)}>
                    {selectedLanguages.has(lang.code) ? (
                      <FilterChip.LeadingIcon>
                        <Icon source={require('@/assets/symbols/check.xml')} tintColor="#000000" />
                      </FilterChip.LeadingIcon>
                    ) : null}
                  </FilterChip>
                ))}
              </FlowRow>
            ) : null}

            {Array.from(groupedArticles.entries()).map(([langName, items]) => [
              showLanguageHeaders ? (
                <Text
                  key={`${langName}-header`}
                  style={{ typography: 'titleSmall' }}
                  modifiers={[padding(32, 14, 32, 14)]}>
                  {langName}
                </Text>
              ) : null,
              ...items.map((article, index) => {
                const itemPosition =
                  items.length === 1
                    ? undefined
                    : index === 0
                      ? 'leading'
                      : index === items.length - 1
                        ? 'trailing'
                        : undefined;

                return (
                  <ListItem
                    key={`${article.pageId}-${article.lang}`}
                    headline={article.title}
                    supportingText={article.description}
                    modifiers={[
                      clip(
                        Shapes.RoundedCorner(
                          items.length === 1
                            ? { topStart: 20, topEnd: 20, bottomStart: 20, bottomEnd: 20 }
                            : cornerRadii(itemPosition)
                        )
                      ),
                      clickable(() =>
                        router.push({
                          pathname: '/page',
                          params: {
                            title: article.title,
                            url: buildWikipediaUrl(article),
                          },
                        })
                      ),
                    ]}>
                    <ListItem.Leading>
                      <Box
                        modifiers={[
                          clip(
                            Shapes.RoundedCorner({
                              topStart: 16,
                              topEnd: 16,
                              bottomStart: 16,
                              bottomEnd: 16,
                            })
                          ),
                          background(Color.android.dynamic.surfaceVariant),
                          size(64, 64),
                        ]}
                        contentAlignment="center">
                        <Text style={{ typography: 'titleMedium' }}>
                          {article.title.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    </ListItem.Leading>
                  </ListItem>
                );
              }),
            ])}
            <Spacer modifiers={[height(16)]} />
          </LazyColumn>
        )}

        {showDeleteDialog ? (
          <DeleteArticleDialog
            title={deleteTarget?.title}
            onDismiss={() => {
              setShowDeleteDialog(false);
              setDeleteTarget(null);
            }}
            onDeleteArticle={() => {
              if (deleteTarget) {
                setArticles((prev) =>
                  prev.filter(
                    (a) => !(a.pageId === deleteTarget.pageId && a.lang === deleteTarget.lang)
                  )
                );
              }
            }}
            onDeleteAll={() => setArticles([])}
          />
        ) : null}
      </Host>
    </>
  );
}
