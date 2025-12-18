import { Terminal } from '~/ui/components/Snippet';
import { A, CODE, H3, H4, LI, P, UL } from '~/ui/components/Text';

import easCliData from './data/eas-cli-commands.json';
import {
  countNonEmptyLines,
  formatDescription,
  formatDescriptionForInlineLink,
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
  seeCode: string;
};

type EasCliReferenceData = {
  commands: CommandData[];
};

const ListSection = ({ entries }: { entries: ListEntry[] }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <UL className="mb-4">
      {entries.map(entry => (
        <LI key={entry.name}>
          <CODE className="text-3xs">{entry.name}</CODE>
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
                          <CODE className="text-3xs">{item.name}</CODE>
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
  const description = command.seeCode
    ? formatDescriptionForInlineLink(command.description ?? '')
    : formatDescription(command.description ?? '');
  const slug = slugify(command.command);
  const argumentsList = sections.arguments ? parseListEntries(sections.arguments) : [];
  const flagsList = sections.flags ? parseListEntries(sections.flags) : [];

  return (
    <section className="border-b border-secondary pb-8 last:border-0 last:pb-0">
      <H3 id={slug} className="translate-y-[2px] self-center">
        {command.command}
      </H3>
      <P className="mb-5 mt-2">
        {renderInlineContent(description)}
        {command.seeCode && (
          <>
            {' '}
            (
            <A href={command.seeCode} openInNewTab>
              see code
            </A>
            ).
          </>
        )}
      </P>

      {sections.usage && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">Usage</H4>
          <Terminal cmd={toTerminalLines(sections.usage)} />
        </div>
      )}

      {argumentsList.length > 0 && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {argumentsList.length === 1 ? 'Argument' : 'Arguments'}
          </H4>
          <ListSection entries={argumentsList} />
        </div>
      )}

      {flagsList.length > 0 && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {flagsList.length === 1 ? 'Flag' : 'Flags'}
          </H4>
          <ListSection entries={flagsList} />
        </div>
      )}

      {sections.aliases && (
        <div className="mb-6">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">
            {countNonEmptyLines(sections.aliases) === 1 ? 'Alias' : 'Aliases'}
          </H4>
          <Terminal cmd={toTerminalLines(sections.aliases)} />
        </div>
      )}

      {sections.examples && (
        <div className="mb-4">
          <H4 className="mb-2 mt-0 translate-y-[2px] self-center">Examples</H4>
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
