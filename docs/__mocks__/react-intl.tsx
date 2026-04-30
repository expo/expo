import { type ReactElement, type ReactNode } from 'react';

import enMessages from '~/messages/en.json';

type FormatMessageDescriptor = {
  id?: string;
  defaultMessage?: string;
};

type FormatValues = Record<string, ReactNode | ((chunks: ReactNode) => ReactNode)>;

type FormattedMessageProps = FormatMessageDescriptor & {
  values?: FormatValues;
  children?: (chunks: ReactNode) => ReactNode;
};

const messages = enMessages as Record<string, string>;

function lookup({ id, defaultMessage }: FormatMessageDescriptor) {
  if (id && messages[id] !== undefined) {
    return messages[id];
  }
  return defaultMessage ?? id ?? '';
}

function expandTemplate(template: string, values: FormatValues = {}): (string | ReactElement)[] {
  const tokenRegex = /<([A-Za-z][\w-]*)>([\S\s]*?)<\/\1>|{([A-Za-z][\w-]*)}/g;
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of template.matchAll(tokenRegex)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push(template.slice(lastIndex, matchIndex));
    }
    const [whole, tagName, inner, varName] = match;
    if (tagName) {
      const fn = values[tagName];
      const inside = expandTemplate(inner, values);
      const node = typeof fn === 'function' ? fn(inside) : inside;
      parts.push(<span key={`t-${key++}`}>{node}</span>);
    } else if (varName) {
      const v = values[varName];
      if (typeof v === 'function') {
        parts.push(<span key={`v-${key++}`}>{(v as (c: ReactNode) => ReactNode)('')}</span>);
      } else if (v !== undefined) {
        parts.push(<span key={`v-${key++}`}>{v as ReactNode}</span>);
      }
    }
    lastIndex = matchIndex + whole.length;
  }
  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }
  return parts;
}

const stubIntl = {
  locale: 'en',
  formatMessage: (descriptor: FormatMessageDescriptor = {}) => lookup(descriptor),
  formatDate: (value: unknown) => String(value ?? ''),
  formatTime: (value: unknown) => String(value ?? ''),
  formatRelativeTime: (value: unknown) => String(value ?? ''),
  formatNumber: (value: unknown) => String(value ?? ''),
  formatPlural: () => 'other',
  formatList: (items: unknown[]) => (Array.isArray(items) ? items.join(', ') : String(items)),
};

export const useIntl = () => stubIntl;

export const IntlProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;

export const FormattedMessage = ({
  defaultMessage,
  id,
  values,
  children,
}: FormattedMessageProps) => {
  const text = lookup({ id, defaultMessage });
  const parts = expandTemplate(text, values);
  if (typeof children === 'function') {
    return <>{children(parts)}</>;
  }
  return <>{parts}</>;
};

export const defineMessages = <T,>(messages: T) => messages;
export const createIntl = () => stubIntl;
