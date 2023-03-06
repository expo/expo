import { SearchRefractionIcon, XIcon } from '@expo/styleguide-icons';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { BarLoader } from './BarLoader';
import { CommandFooter } from './CommandFooter';
import { RNDirectoryItem, RNDocsItem, ExpoDocsItem, ExpoItem } from './Items';
import { entries } from './expoEntries';
import { searchIconStyle, closeIconStyle } from './styles';
import type { ExpoItemType, RNDirectoryItemType, AlgoliaItemType } from './types';
import { getExpoDocsResults, getRNDocsResults, getDirectoryResults, getItemsAsync } from './utils';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  version: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const CommandMenu = ({ version, open, setOpen }: Props) => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [expoDocsItems, setExpoDocsItems] = useState<AlgoliaItemType[]>([]);
  const [expoItems, setExpoItems] = useState<ExpoItemType[]>([]);
  const [rnDocsItems, setRnDocsItems] = useState<AlgoliaItemType[]>([]);
  const [directoryItems, setDirectoryItems] = useState<RNDirectoryItemType[]>([]);

  const getExpoDocsItems = async () =>
    getItemsAsync(query, getExpoDocsResults, setExpoDocsItems, version);
  const getRNDocsItems = async () => getItemsAsync(query, getRNDocsResults, setRnDocsItems);
  const getDirectoryItems = async () =>
    getItemsAsync(query, getDirectoryResults, setDirectoryItems);

  const getExpoItems = async () => {
    setExpoItems(entries.filter(entry => entry.label.toLowerCase().includes(query.toLowerCase())));
  };

  const dismiss = () => setOpen(false);

  const fetchData = (callback: () => void) => {
    Promise.all([getExpoDocsItems(), getRNDocsItems(), getDirectoryItems(), getExpoItems()]).then(
      callback
    );
  };

  const onQueryChange = () => {
    if (open) {
      setLoading(true);
      const inputTimeout = setTimeout(() => fetchData(() => setLoading(false)), 150);
      return () => clearTimeout(inputTimeout);
    }
  };

  const onMenuOpen = () => {
    if (open && !initialized) {
      fetchData(() => {
        setInitialized(true);
        setLoading(false);
      });
    }
  };

  useEffect(onMenuOpen, [open]);
  useEffect(onQueryChange, [query]);

  const totalCount =
    expoDocsItems.length + rnDocsItems.length + directoryItems.length + expoItems.length;

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search Menu" shouldFilter={false}>
      <SearchRefractionIcon className="icon-md text-icon-secondary" css={searchIconStyle} />
      <div css={closeIconStyle}>
        <XIcon className="icon-md text-icon-secondary" onClick={() => setOpen(false)} />
      </div>
      <Command.Input value={query} onValueChange={setQuery} placeholder="search anything…" />
      <BarLoader isLoading={loading} />
      <Command.List>
        {initialized && (
          <>
            {expoDocsItems.length > 0 && (
              <Command.Group heading="Expo documentation">
                {expoDocsItems.map(item => (
                  <ExpoDocsItem
                    item={item}
                    onSelect={dismiss}
                    key={`hit-expo-docs-${item.objectID}`}
                  />
                ))}
              </Command.Group>
            )}
            {expoItems.length > 0 && (
              <Command.Group heading="Expo dashboard">
                {expoItems.map((item: ExpoItemType) => (
                  <ExpoItem
                    item={item}
                    onSelect={dismiss}
                    key={`hit-expo-${item.url}`}
                    query={query}
                  />
                ))}
              </Command.Group>
            )}
            {rnDocsItems.length > 0 && (
              <Command.Group heading="React Native documentation">
                {rnDocsItems.map(item => (
                  <RNDocsItem item={item} onSelect={dismiss} key={`hit-rn-docs-${item.objectID}`} />
                ))}
              </Command.Group>
            )}
            {directoryItems.length > 0 && (
              <Command.Group heading="React Native directory">
                {directoryItems.map(item => (
                  <RNDirectoryItem
                    item={item}
                    onSelect={dismiss}
                    key={`hit-rn-dir-${item.npmPkg}`}
                    query={query}
                  />
                ))}
              </Command.Group>
            )}
            {!loading && totalCount === 0 && (
              <Command.Empty>
                <CALLOUT theme="secondary">No results found.</CALLOUT>
              </Command.Empty>
            )}
          </>
        )}
      </Command.List>
      <CommandFooter />
    </Command.Dialog>
  );
};
