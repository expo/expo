// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// The name of the on-ramp topic, and the two lines that point at it.
//
// A module of its own, for two reasons. **One string.** The topic is named in the top-level
// screen, at the foot of every command's help, and in the recoveries for the spellings a caller
// guesses instead — so a rename has to be one edit rather than a search, and the name went from
// `how-to` to `workflow` once already [confirmed, 2026-08-28]. **No cycle.** The registry
// prints the pointer and the topic reads the registry's workflow data, so the constant cannot live
// in either of them. Its one import is `programName`, which imports nothing of this CLI's.

import { PROGRAM_PREFIX } from '../programName';

/**
 * The word a caller types after `help` to get the on-ramp.
 *
 * `workflow` rather than `how-to`: a topic is a thing you ask for, and this one is named after
 * *what it is about* rather than after the genre of document it is. `git help workflows` is the
 * precedent.
 */
export const ON_RAMP_TOPIC = 'workflow';

/** The whole command, as every pointer prints it. */
export const ON_RAMP_POINTER = `${PROGRAM_PREFIX} help ${ON_RAMP_TOPIC}`;

/**
 * The line that offers it, wherever a reader who does not know this CLI might be.
 *
 * A question rather than an instruction: a reader who *does* know the CLI can skip a line that
 * asks them something, and an instruction they have already followed is noise on every screen.
 */
export const ON_RAMP_FOOTER = `New here? ${ON_RAMP_POINTER}`;
