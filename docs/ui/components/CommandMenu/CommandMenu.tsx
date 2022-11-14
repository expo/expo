import { WordMarkLogo, SearchIcon, theme, StatusWaitingIcon } from '@expo/styleguide';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';

import { CommandFooter } from './CommandFooter';
import { RNDirectoryItem, RNDocsItem, ExpoDocsItem, ExpoItem } from './Items';
import { entries } from './expoEntries';
import { searchIconStyle, loadingIconStyle } from './styles';
import type { ExpoItemType, RNDirectoryItemType, AlgoliaItemType } from './types';
import { getExpoResults, getDocsResults, getDirectoryResults, getItems } from './utils';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  version: string;
};

export const CommandMenu = ({ version }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [expoDocsItems, setExpoDocsItems] = useState<AlgoliaItemType[]>([]);
  const [expoItems, setExpoItems] = useState<ExpoItemType[]>([]);
  const [rnDocsItems, setRnDocsItems] = useState<AlgoliaItemType[]>([]);
  const [directoryItems, setDirectoryItems] = useState<RNDirectoryItemType[]>([]);

  useEffect(() => {
    const keyDownListener = (e: KeyboardEvent) => {
      if (e.key === 'j' && e.metaKey) {
        setOpen(open => !open);
      }
    };
    document.addEventListener('keydown', keyDownListener);
    return () => document.removeEventListener('keydown', keyDownListener);
  }, []);

  const getExpoDocsItems = async () => getItems(query, getExpoResults, setExpoDocsItems, version);
  const getRNDocsItems = async () => getItems(query, getDocsResults, setRnDocsItems);
  const getDirectoryItems = async () => getItems(query, getDirectoryResults, setDirectoryItems);

  const getExpoItems = async () => {
    return setExpoItems(
      entries.filter(entry => entry.label.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const dismiss = () => setOpen(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getExpoDocsItems(), getRNDocsItems(), getDirectoryItems(), getExpoItems()]).then(
      () => setLoading(false)
    );
  }, [query]);

  const totalCount =
    expoDocsItems.length + rnDocsItems.length + directoryItems.length + expoItems.length;

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search Menu" shouldFilter={false}>
      <SearchIcon color={theme.icon.secondary} css={searchIconStyle} />
      <StatusWaitingIcon
        color={theme.palette.purple[300]}
        css={[loadingIconStyle, { opacity: loading ? 1 : 0 }]}
      />
      <Command.Input value={query} onValueChange={setQuery} placeholder="search…" />
      <Command.List>
        {expoDocsItems.length > 0 && (
          <Command.Group heading={<ExpoHeading label="documentation" />}>
            {expoDocsItems.map(item => (
              <ExpoDocsItem item={item} onSelect={dismiss} />
            ))}
          </Command.Group>
        )}
        {expoItems.length > 0 && (
          <Command.Group heading={<ExpoHeading label="dashboard" />}>
            {expoItems.map((item: ExpoItemType) => (
              <ExpoItem item={item} onSelect={dismiss} />
            ))}
          </Command.Group>
        )}
        {rnDocsItems.length > 0 && (
          <Command.Group heading="React Native documentation">
            {rnDocsItems.map(item => (
              <RNDocsItem item={item} onSelect={dismiss} />
            ))}
          </Command.Group>
        )}
        {directoryItems.length > 0 && (
          <Command.Group heading="React Native directory">
            {directoryItems.map(item => (
              <RNDirectoryItem item={item} onSelect={dismiss} />
            ))}
          </Command.Group>
        )}
        {totalCount === 0 && (
          <Command.Empty>
            <CALLOUT theme="secondary">No results found.</CALLOUT>
          </Command.Empty>
        )}
      </Command.List>
      <CommandFooter />
    </Command.Dialog>
  );
};

const ExpoHeading = ({ label }: { label: string }) => (
  <>
    <WordMarkLogo width={46} /> {label}
  </>
);
