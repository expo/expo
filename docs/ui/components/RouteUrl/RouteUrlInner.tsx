import { Link04Icon } from '@expo/styleguide-icons/outline/Link04Icon';
import { Children, type PropsWithChildren, useMemo } from 'react';

import { type ProtocolType, getProtocol, TABS_MAPPING } from './utils';

import { RuntimePopup } from '~/ui/components/RouteUrl/RuntimePopup';
import { SnippetHeader } from '~/ui/components/Snippet/SnippetHeader';

export function RouteUrlInner({
  children,
  type,
  setType,
}: PropsWithChildren<{ type: ProtocolType; setType: (type: ProtocolType) => void }>) {
  const protocol = getProtocol(type);

  const childrenString = useMemo(
    () =>
      Children.map(children, child => {
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

  const [parsedProtocol, inputUrl] = useMemo<[string, string]>(() => {
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
          <span className="text-icon-secondary">{parsedProtocol}</span>
          {inputUrl}
        </span>
      }
      Icon={Link04Icon}>
      <RuntimePopup items={TABS_MAPPING} selected={type} onSelect={value => setType(value)} />
    </SnippetHeader>
  );
}
