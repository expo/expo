import {
  Box,
  Button,
  Card,
  Column,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  Row,
  Slider,
  Spacer,
  Switch,
  Text,
  ToggleButton,
} from '@expo/ui/jetpack-compose';
import {
  padding,
  height,
  weight,
  clip,
  size,
  paddingAll,
  background,
  Shapes,
  fillMaxWidth,
  align,
} from '@expo/ui/jetpack-compose/modifiers';
import { Color } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { AppLocaleBottomSheet } from '@/components/AppLocaleBottomSheet';
import { ClickableListItem, cornerRadii } from '@/components/ClickableListItem';
import { COLOR_SCHEMES, ColorSchemePickerDialog } from '@/components/ColorSchemePickerDialog';
import { LanguageBottomSheet } from '@/components/LanguageBottomSheet';
import { ThemeDialog } from '@/components/ThemeDialog';
import languages from '@/data/languages.json';
import locales from '@/data/locales.json';

export default function Settings() {
  const colorScheme = useColorScheme();

  const [showColorSchemePicker, setShowColorSchemePicker] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showAppLocaleSheet, setShowAppLocaleSheet] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentAppLocale, setCurrentAppLocale] = useState<string | null>(null);
  const [currentColorScheme, setCurrentColorScheme] = useState(COLOR_SCHEMES[0]);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [blackTheme, setBlackTheme] = useState(false);
  const [fontStyle, setFontStyle] = useState<'sans-serif' | 'serif'>('sans-serif');
  const [fontSize, setFontSize] = useState(16);
  const [dataSaver, setDataSaver] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [expandSections, setExpandSections] = useState(false);
  const [imageBackground, setImageBackground] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [renderMath, setRenderMath] = useState(true);
  const [manageHistory, setManageHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState(true);

  return (
    <Host style={{ flex: 1 }} colorScheme={colorScheme}>
      <LazyColumn
        verticalArrangement={{ spacedBy: 2 }}
        contentPadding={{ start: 16, end: 16, top: 8, bottom: 16 }}>
        <Spacer modifiers={[height(8)]} />

        <ClickableListItem
          headline="Color scheme"
          supportingText="Color"
          onClick={() => setShowColorSchemePicker(true)}
          itemPosition="leading">
          <ClickableListItem.Leading>
            <Icon source={require('@/assets/symbols/palette.xml')} tintColor="#1d1b20" />
          </ClickableListItem.Leading>
        </ClickableListItem>

        <ClickableListItem
          headline="Theme"
          supportingText="System default"
          onClick={() => setShowThemeDialog(true)}>
          <ClickableListItem.Leading>
            <Icon source={require('@/assets/symbols/light_mode.xml')} tintColor="#1d1b20" />
          </ClickableListItem.Leading>
        </ClickableListItem>

        <ListItem
          headline="Black theme"
          supportingText="Use a pure black dark theme"
          modifiers={[clip(Shapes.RoundedCorner(cornerRadii('trailing')))]}>
          <ListItem.Leading>
            <Icon source={require('@/assets/symbols/contrast.xml')} tintColor="#1d1b20" />
          </ListItem.Leading>
          <ListItem.Trailing>
            <Switch value={blackTheme} onValueChange={setBlackTheme}>
              <Switch.ThumbContent>
                {blackTheme ? (
                  <Icon
                    source={require('@/assets/symbols/check.xml')}
                    modifiers={[size(Switch.DefaultIconSize, Switch.DefaultIconSize)]}
                  />
                ) : (
                  <Icon
                    source={require('@/assets/symbols/clear.xml')}
                    modifiers={[size(Switch.DefaultIconSize, Switch.DefaultIconSize)]}
                  />
                )}
              </Switch.ThumbContent>
            </Switch>
          </ListItem.Trailing>
        </ListItem>

        <Spacer modifiers={[height(12)]} />

        <ClickableListItem
          headline="Wikipedia language"
          supportingText={languages.find((l) => l.code === currentLanguage)?.name ?? 'English'}
          onClick={() => setShowLanguageSheet(true)}
          itemPosition="leading">
          <ClickableListItem.Leading>
            <Icon source={require('@/assets/symbols/translate.xml')} tintColor="#1d1b20" />
          </ClickableListItem.Leading>
        </ClickableListItem>

        <ClickableListItem
          headline="App language"
          supportingText={
            currentAppLocale
              ? (locales.find((l) => l.code === currentAppLocale)?.name ?? 'System default')
              : 'System default'
          }
          onClick={() => setShowAppLocaleSheet(true)}>
          <ClickableListItem.Leading>
            <Icon source={require('@/assets/symbols/language.xml')} tintColor="#1d1b20" />
          </ClickableListItem.Leading>
        </ClickableListItem>

        <ListItem
          headline="Font style"
          modifiers={[clip(Shapes.RoundedCorner(cornerRadii(undefined)))]}>
          <ListItem.Leading>
            <Icon source={require('@/assets/symbols/serif.xml')} tintColor="#1d1b20" />
          </ListItem.Leading>
          <ListItem.SupportingContent>
            <Row horizontalArrangement={{ spacedBy: 4 }} modifiers={[padding(0, 4, 0, 4)]}>
              <ToggleButton
                checked={fontStyle === 'sans-serif'}
                onCheckedChange={() => setFontStyle('sans-serif')}
                modifiers={[weight(1), padding(0, 4, 0, 0), height(40)]}>
                {fontStyle === 'sans-serif' ? (
                  <Icon source={require('@/assets/symbols/check.xml')} />
                ) : null}
                <Spacer
                  modifiers={[
                    size(ToggleButton.DefaultIconSpacing, ToggleButton.DefaultIconSpacing),
                  ]}
                />
                <Text>Sans-serif</Text>
              </ToggleButton>

              <ToggleButton
                checked={fontStyle === 'serif'}
                onCheckedChange={() => setFontStyle('serif')}
                modifiers={[weight(1), padding(0, 4, 0, 0), height(40)]}>
                {fontStyle === 'serif' ? (
                  <Icon source={require('@/assets/symbols/check.xml')} />
                ) : null}
                <Spacer
                  modifiers={[
                    size(ToggleButton.DefaultIconSpacing, ToggleButton.DefaultIconSpacing),
                  ]}
                />
                <Text>Serif</Text>
              </ToggleButton>
            </Row>
          </ListItem.SupportingContent>
        </ListItem>

        <ListItem
          headline="Font size"
          modifiers={[clip(Shapes.RoundedCorner(cornerRadii('trailing')))]}>
          <ListItem.Leading>
            <Icon source={require('@/assets/symbols/format_size.xml')} tintColor="#1d1b20" />
          </ListItem.Leading>
          <ListItem.SupportingContent>
            <Column>
              <Text>{`${fontSize}`}</Text>
              <Slider
                value={fontSize}
                onValueChange={(value) => setFontSize(Math.round(value))}
                min={10}
                max={22}
              />
            </Column>
          </ListItem.SupportingContent>
        </ListItem>

        <Spacer modifiers={[height(12)]} />

        <SwitchListItem
          headline="Data saver"
          supportingText="Disable images and feed. Page images can still be opened by clicking the description card."
          icon={require('@/assets/symbols/data_saver_on.xml')}
          value={dataSaver}
          onValueChange={setDataSaver}
          itemPosition="leading"
        />
        <SwitchListItem
          headline="Feed"
          supportingText="Show a feed of trending articles, news and more on app startup"
          icon={require('@/assets/symbols/feed.xml')}
          value={showFeed}
          onValueChange={setShowFeed}
        />
        <SwitchListItem
          headline="Expand sections"
          supportingText="Expand all sections by default"
          icon={require('@/assets/symbols/expand_all.xml')}
          value={expandSections}
          onValueChange={setExpandSections}
        />
        <SwitchListItem
          headline="Image background"
          supportingText="Add a white background to transparent images. The background can help increase readability in dark mode."
          icon={require('@/assets/symbols/texture.xml')}
          value={imageBackground}
          onValueChange={setImageBackground}
        />
        <SwitchListItem
          headline="Immersive mode"
          supportingText="Hide search bar and floating action buttons while scrolling. Enabled by default on small screen sizes."
          icon={require('@/assets/symbols/open_in_full.xml')}
          value={immersiveMode}
          onValueChange={setImmersiveMode}
        />
        <SwitchListItem
          headline="Render math expressions"
          supportingText="Requires small amounts of additional data. Turn off to improve performance at the cost of readability."
          icon={require('@/assets/symbols/function.xml')}
          value={renderMath}
          onValueChange={setRenderMath}
        />
        <SwitchListItem
          headline="History"
          supportingText="Save article browsing history"
          icon={require('@/assets/symbols/manage_history.xml')}
          value={manageHistory}
          onValueChange={setManageHistory}
        />
        <SwitchListItem
          headline="Search history"
          supportingText="Save search history"
          icon={require('@/assets/symbols/search_history.xml')}
          value={searchHistory}
          onValueChange={setSearchHistory}
          itemPosition="trailing"
        />

        <Card modifiers={[padding(0, 14, 0, 14), fillMaxWidth()]} color="#faf8ff">
          <Column
            modifiers={[paddingAll(20), fillMaxWidth()]}
            horizontalAlignment="center"
            verticalArrangement={{ spacedBy: 8 }}>
            <Box contentAlignment="center">
              <Spacer
                modifiers={[
                  clip(Shapes.Material.Cookie12Sided),
                  background(Color.android.dynamic.secondaryContainer),
                  paddingAll(8),
                  size(24, 24),
                ]}
              />
              <Icon
                source={require('@/assets/symbols/filled_info.xml')}
                tintColor={Color.android.dynamic.onSecondaryContainer}
                modifiers={[size(24, 24)]}
              />
            </Box>
            <Text style={{ typography: 'headlineSmall' }}>Set as default</Text>
            <Text style={{ typography: 'bodyLarge' }} modifiers={[fillMaxWidth()]}>
              You can set WikiReader as your default app for opening Wikipedia links. Click on the
              buttons below to know more or open settings.
            </Text>
            <Row horizontalArrangement={{ spacedBy: 8 }} modifiers={[align('end')]}>
              <Button>Settings</Button>
              <Button variant="bordered">Instructions</Button>
            </Row>
          </Column>
        </Card>
      </LazyColumn>

      {/* dynamic views */}
      {showColorSchemePicker ? (
        <ColorSchemePickerDialog
          currentColor={currentColorScheme}
          onDismiss={() => setShowColorSchemePicker(false)}
          onColorChange={(color) => setCurrentColorScheme(color)}
        />
      ) : null}
      {showThemeDialog ? (
        <ThemeDialog
          options={[
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
            { key: 'system', label: 'System default' },
          ]}
          selectedKey={currentTheme}
          onDismiss={() => setShowThemeDialog(false)}
          onConfirm={(key) => setCurrentTheme(key as 'light' | 'dark' | 'system')}
        />
      ) : null}
      {showLanguageSheet ? (
        <LanguageBottomSheet
          languages={languages}
          recentLanguageCodes={['en']}
          currentLanguageCode={currentLanguage}
          onDismiss={() => setShowLanguageSheet(false)}
          onLanguageSelected={setCurrentLanguage}
        />
      ) : null}
      {showAppLocaleSheet ? (
        <AppLocaleBottomSheet
          locales={locales}
          currentLocaleCode={currentAppLocale}
          onDismiss={() => setShowAppLocaleSheet(false)}
          onLocaleSelected={setCurrentAppLocale}
        />
      ) : null}
    </Host>
  );
}

function SwitchListItem({
  headline,
  supportingText,
  icon,
  value,
  onValueChange,
  itemPosition,
}: {
  headline: string;
  supportingText: string;
  icon: React.ComponentProps<typeof Icon>['source'];
  value: boolean;
  onValueChange: (value: boolean) => void;
  itemPosition?: 'leading' | 'trailing';
}) {
  return (
    <ListItem
      headline={headline}
      supportingText={supportingText}
      modifiers={[clip(Shapes.RoundedCorner(cornerRadii(itemPosition)))]}>
      <ListItem.Leading>
        <Icon source={icon} tintColor="#1d1b20" />
      </ListItem.Leading>
      <ListItem.Trailing>
        <Switch value={value} onValueChange={onValueChange}>
          <Switch.ThumbContent>
            {value ? (
              <Icon
                source={require('@/assets/symbols/check.xml')}
                modifiers={[size(Switch.DefaultIconSize, Switch.DefaultIconSize)]}
              />
            ) : (
              <Icon
                source={require('@/assets/symbols/clear.xml')}
                modifiers={[size(Switch.DefaultIconSize, Switch.DefaultIconSize)]}
              />
            )}
          </Switch.ThumbContent>
        </Switch>
      </ListItem.Trailing>
    </ListItem>
  );
}
