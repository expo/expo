// @ref llp/0006-agent-native-cli-surface.rfc.md §The `@expo/agent-cli` launcher, §Errors are prompts
// `@expo/agent-cli agents:setup` is the one command a project runs once: it links the agent skills the
// installed packages ship, and maintains the managed block in the project's AGENTS.md that orients
// every agent — including the ones that never call a tool.
import chalk from 'chalk';

import * as Log from '../log';
import { PROGRAM_PREFIX } from '../programName';
import { readProjectPackageJsonAsync } from '../project/nodeModules';
import { probeProjectStateAsync } from '../project/probe';
import {
  detectInstalledAgentsAsync,
  getAllAgents,
  getPersistedAgentIdsAsync,
  resolveAgentsAsync,
} from '../skills/agents';
import { discoverSkillsAsync } from '../skills/discovery';
import { syncSkillsAsync } from '../skills/skillsAsync';
import type { SkillsAgent } from '../skills/types';
import { checkClaudeMdReferenceAsync, writeManagedBlockAsync } from './agentsMd';
import { generateAgentsMdBlock } from './content';
import { event } from './events';
import { withStdoutRedirectedAsync } from './stdout';
import type { SetupOptions, SetupReport, SetupSkillsResult } from './types';

/** Width of the label column of the text summary, matching `@expo/agent-cli status`. */
const LABEL_WIDTH = 12;

/** Run the setup, emit the summary event, and print the report. */
export async function printSetupAsync(projectRoot: string, options: SetupOptions): Promise<void> {
  const report = await runSetupAsync(projectRoot, options);

  event('setup_completed', {
    agents: report.agents,
    skillsSynced: report.skills?.synced ?? false,
    skillsDiscovered: report.skills?.discovered ?? 0,
    agentsMdAction: report.agentsMd?.action ?? null,
    noteCount: report.notes.length,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
    return;
  }

  for (const line of summaryLines(report)) {
    Log.log(line);
  }
  for (const note of report.notes) {
    Log.warn(note);
  }
}

/**
 * Do the two things setup does, in order: link the skills, then describe the project.
 *
 * The skills come first, so the block names the directories the links actually live in.
 */
export async function runSetupAsync(
  projectRoot: string,
  options: SetupOptions
): Promise<SetupReport> {
  const notes: string[] = [];
  let skills: SetupSkillsResult | null = null;
  let agents: SkillsAgent[];

  if (options.agentSkills) {
    // The selection is resolved here and forwarded as ids, so an interactive prompt happens at
    // most once even though the sync resolves the selection again.
    const resolved = await resolveAgentsAsync(projectRoot, { agents: options.agents });
    agents = resolved.agents;

    const discovered = await discoverSkillsAsync(projectRoot);
    // The sync itself is `@expo/agent-cli skills:sync`: composed, never reimplemented. Its text summary
    // is moved to stderr under `--json`, where it cannot break the one-object contract.
    const syncAsync = () =>
      syncSkillsAsync(projectRoot, { agents: agents.map((agent) => agent.id), dryRun: false });
    await (options.json ? withStdoutRedirectedAsync(syncAsync) : syncAsync());

    skills = {
      synced: true,
      discovered: discovered.length,
      packages: new Set(discovered.map((skill) => skill.packageName)).size,
      agents: agents.map((agent) => agent.id),
      skillsDirs: uniqueSkillsDirs(agents),
    };
  } else {
    // Nothing is linked in this run, so the block reports the selection that is already in place.
    agents = await readConfiguredAgentsAsync(projectRoot);
  }

  let agentsMd: SetupReport['agentsMd'] = null;
  if (options.agentsMd) {
    const [state, packageJson] = await Promise.all([
      probeProjectStateAsync(projectRoot),
      readProjectPackageJsonAsync(projectRoot),
    ]);
    const block = generateAgentsMdBlock({
      state,
      projectName: packageJson?.name ?? null,
      skillsDirs: uniqueSkillsDirs(agents),
    });
    agentsMd = await writeManagedBlockAsync(projectRoot, block);

    const claudeMdNote = await checkClaudeMdReferenceAsync(projectRoot);
    if (claudeMdNote) {
      notes.push(claudeMdNote);
    }
  }

  return {
    projectRoot,
    skills,
    agentsMd,
    agents: agents.map((agent) => agent.id),
    notes,
  };
}

/**
 * The agents already configured for this project: the cached selection, or the detected ones.
 *
 * Read-only by contract — it never prompts and never fails — because it runs on the path where
 * nothing is linked and the answer only fills in one line of the generated block.
 */
async function readConfiguredAgentsAsync(projectRoot: string): Promise<SkillsAgent[]> {
  const persistedIds = await getPersistedAgentIdsAsync(projectRoot);
  if (persistedIds != null) {
    return getAllAgents().filter((agent) => persistedIds.includes(agent.id));
  }
  return await detectInstalledAgentsAsync(projectRoot);
}

function uniqueSkillsDirs(agents: SkillsAgent[]): string[] {
  return [...new Set(agents.map((agent) => agent.skillsDir))];
}

function summaryLines(report: SetupReport): string[] {
  const lines: string[] = [];
  const row = (label: string, value: string) =>
    lines.push(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  // A completed sync already printed its own summary line, so it is not repeated here.
  if (!report.skills) {
    row('Skills', chalk.dim('skipped (--no-agent-skills)'));
  }

  if (report.agentsMd) {
    row('AGENTS.md', `${report.agentsMd.action} (managed block)`);
  } else {
    row('AGENTS.md', chalk.dim('skipped (--no-agents-md)'));
  }

  row('Next', chalk.bold(`${PROGRAM_PREFIX} status`));

  return lines;
}
