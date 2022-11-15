import { WordMarkLogo, SearchIcon, theme, StatusWaitingIcon, XIcon } from '@expo/styleguide';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { CommandFooter } from './CommandFooter';
import { RNDirectoryItem, RNDocsItem, ExpoDocsItem, ExpoItem } from './Items';
import { entries } from './expoEntries';
import { searchIconStyle, closeIconStyle } from './styles';
import type { ExpoItemType, RNDirectoryItemType, AlgoliaItemType } from './types';
import { getExpoResults, getDocsResults, getDirectoryResults, getItems } from './utils';

import { CALLOUT } from '~/ui/components/Text';

type Props = {
  version: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const CommandMenu = ({ version, open, setOpen }: Props) => {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [expoDocsItems, setExpoDocsItems] = useState<AlgoliaItemType[]>([]);
  const [expoItems, setExpoItems] = useState<ExpoItemType[]>([]);
  const [rnDocsItems, setRnDocsItems] = useState<AlgoliaItemType[]>([]);
  const [directoryItems, setDirectoryItems] = useState<RNDirectoryItemType[]>([]);

  const getExpoDocsItems = async () => getItems(query, getExpoResults, setExpoDocsItems, version);
  const getRNDocsItems = async () => getItems(query, getDocsResults, setRnDocsItems);
  const getDirectoryItems = async () => getItems(query, getDirectoryResults, setDirectoryItems);

  const getExpoItems = async () => {
    return setExpoItems(
      entries.filter(entry => entry.label.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const dismiss = () => setOpen(false);

  const fetchData = () => {
    Promise.all([getExpoDocsItems(), getRNDocsItems(), getDirectoryItems(), getExpoItems()]).then(
      () => setLoading(false)
    );
  };

  useEffect(() => {
    setLoading(true);
    const inputTimeout = setTimeout(() => fetchData(), 150);
    return () => clearTimeout(inputTimeout);
  }, [query]);

  const totalCount =
    expoDocsItems.length + rnDocsItems.length + directoryItems.length + expoItems.length;

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search Menu" shouldFilter={false}>
      <SearchIcon
        color={theme.icon.secondary}
        css={[searchIconStyle, { opacity: !loading ? 1 : 0 }]}
      />
      <StatusWaitingIcon
        color={theme.palette.purple[300]}
        css={[searchIconStyle, { opacity: loading ? 1 : 0 }]}
      />
      <XIcon color={theme.icon.secondary} css={closeIconStyle} onClick={() => setOpen(false)} />
      <Command.Input value={query} onValueChange={setQuery} placeholder="search anything…" />
      <Command.List>
        {expoDocsItems.length > 0 && (
          <Command.Group heading={<ExpoHeading label="documentation" />}>
            {expoDocsItems.map(item => (
              <ExpoDocsItem item={item} onSelect={dismiss} key={`hit-expo-docs-${item.objectID}`} />
            ))}
          </Command.Group>
        )}
        {expoItems.length > 0 && (
          <Command.Group heading={<ExpoHeading label="dashboard" />}>
            {expoItems.map((item: ExpoItemType) => (
              <ExpoItem item={item} onSelect={dismiss} key={`hit-expo-${item.url}`} query={query} />
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
