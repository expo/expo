import { Link04Icon } from '@expo/styleguide-icons';
import React, { PropsWithChildren } from 'react';

import { RuntimePopup } from './RuntimePopup';
import { SnippetHeader } from '../Snippet/SnippetHeader';

type ProtocolType = 'expo-go' | 'custom' | 'web';

const mapping: { name: string; id: ProtocolType }[] = [
  { name: 'Expo Go', id: 'expo-go' },
  { name: 'Custom', id: 'custom' },
  { name: 'Web', id: 'web' },
];

const SharedContext = React.createContext<{
  type: ProtocolType;
  setType: (type: ProtocolType) => void;
} | null>(null);

/**
 * Wraps a group of route urls and shares the preference.
 */
export function RouteUrlGroup({ children }: { children: React.ReactNode }) {
  const [type, setType] = React.useState<ProtocolType>('custom');
  return <SharedContext.Provider value={{ type, setType }}>{children}</SharedContext.Provider>;
}

function getProtocol(type: ProtocolType) {
  return { 'expo-go': 'exp://127.0.0.1:8081/--/', web: 'acme.dev/', custom: 'acme://' }[type];
}

export const RouteUrl = (props: PropsWithChildren) => {
  const context = React.useContext(SharedContext);
  const [type, setType] = React.useState<ProtocolType>('custom');

  if (context) {
    return <RouteUrlInner {...props} {...context} />;
  }

  return <RouteUrlInner {...props} type={type} setType={setType} />;
};

const RouteUrlInner = ({
  children,
  type,
  setType,
}: PropsWithChildren<{ type: ProtocolType; setType: (type: ProtocolType) => void }>) => {
  const protocol = getProtocol(type);

  const childrenString = React.useMemo(
    () =>
      React.Children.map(children, child => {
        // return strings
        if (typeof child === 'string') {
          return child;
        }
        return null;
      })
        ?.filter(Boolean)
        .join('')
        .trim() || '/',
    [children]
  );

  const [parsedProtocol, inputUrl] = React.useMemo<[string, string]>(() => {
    if (type === 'custom') {
      if (childrenString === '/') {
        // remove last slash
        return [protocol.replace(/\/$/, ''), childrenString];
      } else {
        // ensure no starting slashes
        return [protocol, childrenString.replace(/^\/+/, '')];
      }
    }
    // remove last slash
    return [protocol.replace(/\/$/, ''), childrenString];
  }, [type, childrenString, protocol]);

  return (
    <SnippetHeader
      float
      title={
        <span className="select-all">
          <span className="text-icon-secondary ">{parsedProtocol}</span>
          {inputUrl}
        </span>
      }
      Icon={Link04Icon}>
      <RuntimePopup items={mapping} selected={type} onSelect={value => setType(value)} />
    </SnippetHeader>
  );
};
