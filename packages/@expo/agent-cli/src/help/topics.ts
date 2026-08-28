// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// The topics `@expo/agent-cli help <topic>` answers, as data.
//
// A topic is a **positional** argument rather than a flag, because a topic is a thing you ask for:
// `git help workflows`, `npm help folders`. A flag would have made the on-ramp an option of the
// help command instead of a thing the help command is about, and it would have had to be a second
// flag for every topic that follows.
//
// One list, so `help` stays one registry entry however many topics there come to be, and so
// `@expo/agent-cli help` can name them without anybody maintaining a second list. Only `workflow` ships:
// the exit-code table and the `--json` contract are inside it, where a reader meets them in the
// order they need them, and splitting them out before anybody has asked would be three screens
// where one is being read.

import { ON_RAMP_TOPIC } from './onRamp';
import { formatWorkflowTopic } from './workflow';

/** One thing `@expo/agent-cli help` can be asked about that is not a command. */
export interface HelpTopic {
  /** The word a caller types after `help`. */
  name: string;
  /** One line, for the listing of topics in `@expo/agent-cli help --help`. */
  summary: string;
  /** The screen, built when it is asked for. */
  render: () => string;
}

export const helpTopics: HelpTopic[] = [
  {
    name: ON_RAMP_TOPIC,
    summary: 'What to run in order, the exit codes, and the --json contract',
    render: formatWorkflowTopic,
  },
];

/** The topic one word names, or null when it names none. Checked before the command names. */
export function findHelpTopic(name: string): HelpTopic | null {
  return helpTopics.find((topic) => topic.name === name) ?? null;
}
