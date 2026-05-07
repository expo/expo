import { type ReactNode } from 'react';

import { Terminal } from '~/ui/components/Snippet';
import { CODE, H3, LI, P, UL } from '~/ui/components/Text';

import easCliData from './data/eas-cli-commands.json';
import {
  countNonEmptyLines,
  formatDescription,
  formatSentence,
  parseListEntries,
  parseSubItems,
  parseUsageSections,
  renderInlineContent,
  slugify,
  toTerminalLines,
  type ListEntry,
} from './utils';

type CommandData = {
  command: string;
  description: string;
  usage: string;
};

type EasCliReferenceData = {
  commands: CommandData[];
};

const SubsectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="mt-0 mb-2 text-base leading-relaxed font-semibold tracking-[-0.011rem]">
    {children}
  </p>
);

const ListSection = ({ entries }: { entries: ListEntry[] }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <UL className="mb-4">
      {entries.map(entry => (
        <LI key={entry.name}>
          <CODE className="text-xs">{entry.name}</CODE>
          {entry.description &&
            (() => {
              const parsed = parseSubItems(entry.description);
              if (parsed) {
                const lead = parsed.lead ? formatSentence(parsed.lead) : '';
                return (
                  <>
                    {lead ? <span> {renderInlineContent(lead)}</span> : null}
                    <UL className="mt-2">
                      {parsed.items.map(item => (
                        <LI key={`${entry.name}-${item.name}`}>
                          <CODE className="text-xs">{item.name}</CODE>
                          {item.description ? (
                            <span> {renderInlineContent(formatSentence(item.description))}</span>
                          ) : null}
                        </LI>
                      ))}
                    </UL>
                  </>
                );
              }

              return <span> {renderInlineContent(formatSentence(entry.description))}</span>;
            })()}
        </LI>
      ))}
    </UL>
  );
};

const CommandSection = ({ command }: { command: CommandData }) => {
  const sections = parseUsageSections(command.usage);
  const description = formatDescription(command.description ?? '');
  const slug = slugify(command.command);
  const argumentsList = sections.arguments ? parseListEntries(sections.arguments) : [];
  const flagsList = sections.flags ? parseListEntries(sections.flags) : [];

  return (
    <section className="border-secondary border-b pb-8 last:border-0 last:pb-0">
      <H3 id={slug} className="translate-y-[2px] self-center">
        <CODE className="font-mono text-[inherit]">{command.command}</CODE>
      </H3>
      <P className="mt-2 mb-5">{renderInlineContent(description)}</P>

      {sections.usage && (
        <div className="mb-6">
          <SubsectionLabel>Usage</SubsectionLabel>
          <Terminal cmd={toTerminalLines(sections.usage)} />
        </div>
      )}

      {argumentsList.length > 0 && (
        <div className="mb-6">
          <SubsectionLabel>{argumentsList.length === 1 ? 'Argument' : 'Arguments'}</SubsectionLabel>
          <ListSection entries={argumentsList} />
        </div>
      )}

      {flagsList.length > 0 && (
        <div className="mb-6">
          <SubsectionLabel>{flagsList.length === 1 ? 'Flag' : 'Flags'}</SubsectionLabel>
          <ListSection entries={flagsList} />
        </div>
      )}

      {sections.aliases && (
        <div className="mb-6">
          <SubsectionLabel>
            {countNonEmptyLines(sections.aliases) === 1 ? 'Alias' : 'Aliases'}
          </SubsectionLabel>
          <Terminal cmd={toTerminalLines(sections.aliases)} />
        </div>
      )}

      {sections.examples && (
        <div className="mb-4">
          <SubsectionLabel>Examples</SubsectionLabel>
          <Terminal cmd={toTerminalLines(sections.examples)} />
        </div>
      )}
    </section>
  );
};

export const EASCLIReference = () => {
  const data = easCliData as EasCliReferenceData;

  return (
    <div className="space-y-8">
      {data.commands.map(command => (
        <CommandSection key={command.command} command={command} />
      ))}
    </div>
  );
};
