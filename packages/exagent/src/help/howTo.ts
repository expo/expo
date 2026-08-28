// @ref llp/0024-cli-ui.rfc.md §The on-ramp
// The one screen that teaches this CLI to an agent that has never seen it.
//
// The listing in `exagent -h` says which commands exist. It cannot say the four things an agent has
// to know before the first command is worth running: what order they go in, what the exit code
// means, what `--json` guarantees, and what to do with a failure. Those are the protocol, they are
// the same for every command, and repeating them in twenty help blocks would be twenty places to
// get them wrong. So they are here, once, and every help block ends with the line that points at
// this one.
//
// The acceptance test for this file is a walk: an agent that has read `exagent -h` and this text,
// and nothing else, gets a project from nothing to a checked, running app. Every place such an
// agent had to guess is a defect in this text, not in the agent.

import { color } from '../utils/color';

/** The command that prints this. Named here so the text and the pointer cannot disagree. */
export const HOW_TO_COMMAND = 'npx exagent help how-to';

/** The on-ramp, in one screen. */
export function formatHowTo(): string {
  return `
  ${color.command(HOW_TO_COMMAND)} — the loop, for an agent that has not run this CLI before

  ${color.heading('What this is')}
    One CLI over the Expo toolchain. It works out what has to run, runs it, and reports what
    happened in a shape you can branch on: an exit code, plain text, and --json.

  ${color.heading('The loop')}
    1  orient   ${color.command('npx exagent status')}           what this project is, and what to run next
    2  run      ${color.command('npx exagent dev --detach')}     the dev server starts, this terminal comes back
                ${color.command('npx exagent navigate /')}       the app opens a route, on a device
    3  iterate  edit a file, then
                ${color.command('npx exagent runtime:reload')}   the app runs the code that is on disk now
                ${color.command('npx exagent runtime:errors')}   what it threw, over a time window
                ${color.command('npx exagent runtime:tree')}     what is on screen, and the testIDs to tap
    4  gate     ${color.command('npx exagent smoke')}            bundle, boot and error window, one exit code
                ${color.command('npx exagent typecheck')}        the type errors neither of those can see
    5  ship     ${color.command('npx exagent deploy')}           the web app to EAS Hosting

  ${color.heading('Which commands change something')}
    read only   status · typecheck · doctor · runtime:errors · runtime:tree · dev:logs
    they act    dev · navigate · runtime:reload · install · deploy
    ${color.muted('smoke is both: it runs the app in order to report whether the app boots.')}

  ${color.heading('Exit codes — read the code before you read the output')}
     0   the tool worked and the outcome was success
     1   the tool did not work: a bad flag, no project here, a crash.
         Running the same line again changes nothing. Change the line.
     7   the tool worked and a person has to finish the step — signing in, approving.
         Hand the printed instruction to your human; no command of yours completes it.
    20   the tool worked and the outcome failed: the app threw, the bundle does not compile.
         The report says what failed. Retrying is worth it once you have changed something.
    22   the tool worked and could not conclude: a wait expired, or the runtime is unreadable.
         Retrying, or a longer --timeout, may still answer.

  ${color.heading('--json')}
    Every command that produces a report takes --json, and its help block names the top-level
    keys. One JSON object on stdout and nothing else. Progress, warnings and the Try: line go
    to stderr, so never parse stderr.
    A failure under --json is still one object on stdout, and always this shape:
      { "error": { "code", "message", "suggestedCommand", "needsHuman", "data" } }

  ${color.heading('Errors are prompts')}
    A failing command ends with a "Try: <command>" line on stderr. That is the recovery,
    already worked out. Run it instead of searching for one.

  ${color.heading('When you need an answer about EAS')}
    ${color.command('npx exagent status --explain')} asks the service: which sources changed, whether an
    update published now would reach the installed builds, and whether EAS already has a
    build for this exact fingerprint. It is slower than status, and it is the one that asks.

  ${color.heading('Where the rest is')}
    ${color.command('npx exagent -h')}                every command, grouped by the job it does
    ${color.command('npx exagent help <command>')}    its options, two to four examples, and its JSON keys
    ${color.muted('Every help block ends with the commands typically run after it.')}
`;
}
