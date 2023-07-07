import { Link04Icon } from '@expo/styleguide-icons';
import React, { useState, PropsWithChildren } from 'react';

import { SnippetHeader } from '../Snippet/SnippetHeader';
import { RuntimePopup } from './RuntimePopup';

type ProtocolType = 'expo-go' | 'custom' | 'web';

const mapping: { name: string; id: ProtocolType }[] = [
  { name: 'Expo Go', id: 'expo-go' },
  { name: 'Custom', id: 'custom' },
  { name: 'Web', id: 'web' },
];

function getProtocol(type: ProtocolType) {
  return { 'expo-go': 'exp://127.0.0.1:8081/--/', web: 'acme.dev/', custom: 'acme://' }[type];
}

export const RouteUrl = ({ children }: PropsWithChildren) => {
  const [protocolType, setProtocolType] = useState<ProtocolType>('custom');
  const protocol = getProtocol(protocolType);

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
    if (protocolType === 'custom') {
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
  }, [childrenString, protocol]);

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
      <RuntimePopup
        items={mapping}
        selected={protocolType}
        onSelect={value => setProtocolType(value)}
      />
    </SnippetHeader>
  );
};
