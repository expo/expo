import { WordMarkLogo, SearchIcon, theme, StatusWaitingIcon } from '@expo/styleguide';
import { Command } from 'cmdk';
import { Dispatch, useEffect, useState, SetStateAction } from 'react';

import { CommandFooter } from './CommandFooter';
import { RNDirectoryItem, RNDocsItem, ExpoDocsItem, ExpoItem } from './Items';
import { entries } from './Items/expoEntries';
import { footnoteStyle } from './Items/styles';
import { searchIconStyle, loadingIconStyle } from './styles';
import type { ExpoItemType, RNDirectoryItemType } from './types';
import { AlgoliaItemType } from './types';
import { getExpoResults, getDocsResults, getDirectoryResults } from './utils';

import { FOOTNOTE } from '~/ui/components/Text';

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
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && e.metaKey) {
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  async function getItems(
    fetcher: (query: string, version?: string) => Promise<any>,
    setter: Dispatch<SetStateAction<any[]>>,
    version?: string
  ) {
    const data = await fetcher(query, version).then(response => response.json());
    setter(data?.hits || data?.libraries || []);
  }

  const getExpoDocsItems = async () => {
    return getItems(getExpoResults, setExpoDocsItems, version);
  };

  const getRNDocsItems = async () => {
    return getItems(getDocsResults, setRnDocsItems);
  };

  const getDirectoryItems = async () => {
    return getItems(getDirectoryResults, setDirectoryItems);
  };

  const getExpoItems = async () => {
    return setExpoItems(
      entries.filter(entry => entry.label.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const getData = () => {
    setLoading(true);
    Promise.all([getExpoDocsItems(), getRNDocsItems(), getDirectoryItems(), getExpoItems()]).then(
      () => {
        setLoading(false);
      }
    );
  };

  useEffect(getData, [query]);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search Menu" shouldFilter={false}>
      <SearchIcon color={theme.icon.secondary} css={searchIconStyle} />
      <StatusWaitingIcon
        color={theme.palette.purple[300]}
        css={[loadingIconStyle, { opacity: loading ? 1 : 0 }]}
      />
      <Command.Input value={query} onValueChange={setQuery} />
      <Command.List>
        {expoDocsItems.length > 0 && (
          <Command.Group
            heading={
              <>
                <WordMarkLogo width={46} css={{ marginRight: 4 }} /> documentation
              </>
            }>
            {expoDocsItems.map(item => (
              <ExpoDocsItem item={item} onSelect={() => setOpen(false)} />
            ))}
          </Command.Group>
        )}
        {expoItems.length > 0 && (
          <Command.Group
            heading={
              <>
                <WordMarkLogo width={46} css={{ marginRight: 4 }} /> dashboard
              </>
            }>
            {expoItems.map((item: ExpoItemType) => (
              <ExpoItem item={item} onSelect={() => setOpen(false)} />
            ))}
          </Command.Group>
        )}
        {rnDocsItems.length > 0 && (
          <Command.Group heading="React Native documentation">
            {rnDocsItems.map(item => (
              <RNDocsItem item={item} onSelect={() => setOpen(false)} />
            ))}
          </Command.Group>
        )}
        {directoryItems.length > 0 && (
          <Command.Group heading="React Native directory">
            {directoryItems.map(item => (
              <RNDirectoryItem item={item} onSelect={() => setOpen(false)} />
            ))}
          </Command.Group>
        )}
        {expoDocsItems.length + rnDocsItems.length + directoryItems.length === 0 && (
          <Command.Empty>
            <FOOTNOTE css={footnoteStyle}>No results found.</FOOTNOTE>
          </Command.Empty>
        )}
      </Command.List>
      <CommandFooter />
    </Command.Dialog>
  );
};
