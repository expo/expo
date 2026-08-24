/**
 * Dispatch expo/expo's `/verify` workflow quietly.
 *
 *   et verify                  dashboard
 *   et verify 48780            fix mode follows the comment path (issue yes, PR no)
 *   et verify '#48780'         same; quote the # or the shell eats it
 *   et verify https://github.com/expo/expo/issues/48780
 *   et verify 48780 --fix      force a fix pull request attempt
 *   et verify 48780 --no-fix   force report-only
 *   et verify 48780 --retry    update the thread's previous findings comment in place
 *   et verify 48780 --watch    dispatch, then follow it until it finishes
 *
 * Why this exists rather than commenting `/verify` on the thread: the comment
 * path posts an eyes reaction and a "started" comment, and on a failure a
 * "did not finish" notice. Every one of those reaches the inbox of everyone
 * subscribed to a stranger's pull request. The dispatch path posts nothing
 * until the findings themselves, so a run that finds nothing leaves no trace.
 *
 * The command keeps its own argument grammar (subcommands + flags), so it is
 * registered with allowUnknownOption and parses the raw argv itself.
 */

import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
// Used only by `roundup --include-costs` (transcript artifacts land in a
// temp dir on their way through unzip).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const REPO = 'expo/expo';
const FORK = 'expo-bot/expo';
// @ref LLP 0009#cross-repository-rollout — quiet dispatch follows the shared workflow rename.
const WORKFLOW = 'agent-commands.yml';
const SYNC_WORKFLOW = 'sync-expo-bot-fork.yml';

const HELP = `verify — dispatch expo/expo's /verify workflow without commenting on the thread

  et verify                    dashboard (in progress, recent, fork)
  et verify dash               same
  et verify <n>                issue or PR number (also '#<n>' — quote it — or an expo/expo issue/PR URL)
  et verify <n> --fix          force a fix pull request attempt
  et verify <n> --no-fix       force report-only
  et verify <n> --retry        re-run and UPDATE the thread's latest findings
                            comment in place instead of posting a new one
                            (falls back to a new comment if none exists;
                            same flag works in comments: "/verify --retry")
  et verify <n> --watch        follow the run until it finishes
  et verify <n> --model fable  override the agent model for this run
                            (fable/opus/sonnet/haiku, or a full claude-* id;
                            default: the workflow's VERIFY_MODEL var, else opus)
  et verify <n> --fable        shorthand for --model fable (also --opus,
                            --sonnet, --haiku; same flags work in comments:
                            "/verify --fable")
  et verify ls                 what is in flight, and which issue/PR each run is for
  et verify ls --status success [--limit 10]
                            finished runs in that state (see verify ls --help)
  et verify roundup            digest of recent agent activity (commands, PRs, comments)
  et verify roundup --period day|week|month|all [--limit n]
                            span for the digest (default week; see verify roundup --help)

Posts nothing to the thread until the findings themselves.`;

// Four-wide capacity. Since 2026-08-14 the workflow enforces it with a FIFO
// admission step, not per-slot concurrency groups; the modulo "slot" in the
// logs is only a label. SLOTS mirrors VERIFY_SLOTS/CAP in agent-commands.yml
// and sizes the dashboard's lane row.
const SLOTS = 4;

// Jobs are matched by DISPLAY name, which is what the jobs API returns. Both
// spellings, because a rename does not rewrite history: the workflow's jobs
// were called "slot" and "verify" until 2026-08-12, and `verify ls` recaps
// finished runs, so dropping the old names would blank the target and slot on
// every run from before the rename.
// @ref LLP 0009#cross-repository-rollout — job names are a cross-repo contract.
const SLOT_JOB = new Set(['Assign queue slot', 'slot']);
const COMMAND_JOB = new Set(['Agent command', 'verify']);
/** Live `status` values vs finished `conclusion` values that `gh run list -s` accepts. */
const LS_LIVE = new Set(['queued', 'in_progress', 'waiting', 'requested', 'pending']);
const LS_DONE = new Set([
  'completed',
  'success',
  'failure',
  'cancelled',
  'skipped',
  'timed_out',
  'action_required',
  'neutral',
  'stale',
  'startup_failure',
]);

function normalizeLsStatus(raw: string): string {
  const s = raw.toLowerCase().replace(/-/g, '_');
  if (s === 'failed' || s === 'fail') return 'failure';
  if (s === 'canceled') return 'cancelled';
  if (s === 'running') return 'in_progress';
  if (s === 'timeout') return 'timed_out';
  return s;
}

type LsOpts = { limit: number; status: string | null };

function parseLsArgs(argv: string[]): LsOpts {
  let limit: number | null = null;
  let status: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const eq = a.indexOf('=');
    const flag = eq === -1 ? a : a.slice(0, eq);
    const inline = eq === -1 ? undefined : a.slice(eq + 1);
    const take = (name: string): string => {
      const v = inline ?? argv[++i];
      if (v === undefined || v.startsWith('-')) die(`\`${name}\` needs a value (try --help)`);
      return v;
    };
    if (flag === '--limit' || flag === '-L') {
      const raw = take(flag);
      if (!/^\d+$/.test(raw) || Number(raw) < 1) die(`'${raw}' is not a positive number`);
      limit = Number(raw);
    } else if (flag === '--status' || flag === '-s') {
      const raw = take(flag);
      const norm = normalizeLsStatus(raw);
      if (!LS_LIVE.has(norm) && !LS_DONE.has(norm)) {
        die(`unknown status '${raw}' (try --help)`);
      }
      status = norm;
    } else if (a.startsWith('-')) {
      die(`unknown flag: ${a} (try --help)`);
    } else {
      die(`unexpected argument: ${a} (try --help)`);
    }
  }
  return { limit: limit ?? 20, status };
}

type Run = {
  databaseId: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  event: string;
  displayTitle: string;
};

const LS_HELP = `verify ls — verifications currently running or queued

  et verify ls
  et verify ls --limit 10
  et verify ls --status success
  et verify ls -L 5 -s failure

  ● in progress  22m  #46039  issue  [expo-image] iOS: <Image> does not…
    ↳ Run verification (12/21) · 22m in step · slot 3 · @brentvatne · run 31546334281

  ● running · ◌ queued          elapsed is since the run was created
  #number                       the issue or PR being verified (clickable)
  ↳ step (n/total)              where the verify job has got to, and how
                                long it has been on that step
  slot k                        which concurrency slot it holds
  @user                         who kicked the run off (dispatch or comment)

  --limit, -L <n>               how many runs to show (default 20).
  --status, -s <state>          only runs in that state. Live: queued,
                                in_progress, waiting, requested, pending.
                                Finished: success, failure, cancelled, skipped,
                                timed_out, action_required, neutral, stale,
                                startup_failure, completed. Hyphens and
                                running/failed/canceled/timeout are accepted.
                                Bare \`verify ls\` is in-flight only; pass
                                --status success (or failure, …) for a recap.

SLOTS. GitHub Actions has no "at most N concurrent" setting — a concurrency
group runs exactly ONE job at a time. So there are ${SLOTS} groups, and a run is
assigned one by target number modulo ${SLOTS}. That is what caps verifications at
${SLOTS} at once, which matters because each run holds two sandboxes against a
20-sandbox E2B account.

The header shows occupancy, bold for busy. Two consequences worth knowing:

  · Assignment is by NUMBER, not availability, so a run can queue while a
    slot sits idle — two issues sharing a remainder wait on each other even
    when there is capacity. The upside is that one issue always maps to one
    slot, so a second /verify on it serialises behind the first instead of
    racing it for the same sandboxes.

  · A group holds at most ONE pending run. A third arrival into a busy slot
    cancels the one already waiting. Nothing is spent — a dropped pending run
    never started — but it is not an unbounded queue, and under a burst some
    dispatches are dropped rather than delayed.`;

const DASH_HELP = `verify dashboard — one screen to see if verification is healthy

  et verify
  et verify dash
  et verify d | dashboard

Shows every run still in flight (and any that are queued), a tally plus the
latest finished runs (skipped comment-gate jobs hidden), how far
expo-bot/expo is behind expo/expo main, and the last fork-sync job if that
workflow exists. For a longer recap use \`verify ls --status success\`
(or failure, …).`;

const ROUNDUP_HELP = `verify roundup — digest of recent agent activity on ${REPO}

  et verify roundup                 last 7 days
  et verify roundup --period day    last 24 hours (also: week, month, all)
  et verify roundup --limit 50      list up to 50 PRs per section (default 30;
                                 one search page holds 100). Also -L.
  et verify roundup --json          machine-readable digest on stdout, with
                                 datetimes (created/merged/closed/verified).
                                 Emits everything fetched: --limit is a
                                 display cap and does not apply.
  et verify roundup --include-costs
                                 also sum the token usage recorded in each
                                 routed run's transcript artifact, per model
                                 and per token category, and estimate the
                                 cost at list API prices. Artifacts are kept
                                 14 days, so older runs in the span count as
                                 unmeasured. Slow: downloads one artifact
                                 per routed run.

  commands   started by maintainers. Comment commands are tallied from
             the bot's announce comments — raw workflow-run counts are
             useless for those: a run is created for EVERY repository
             comment and almost all of them skip at the job filter.
             Quiet dispatches announce nothing, but their runs only
             exist when someone dispatched, so THEY are counted from
             workflow_dispatch runs (verify/work not distinguishable
             there: run inputs are not in the runs API).
  created    PRs the agent OPENED in the span, with merged/open/closed
  merged     agent PRs merged in the span, whenever they were opened
  verified   other people's PRs that GOT a verify run in the span —
             targets of the 🔍 announces, grouped merged/open/closed.
             Agent-authored targets are left out: the created section
             already covers them.
  issues     issues that GOT a verify run in the span, grouped
             open/closed.

created/merged count only agent-work branches (verify/…). The expo-bot
login also opens unrelated PRs — docs upstream sync, maintainer pushes
under the bot identity — and those are excluded. --period all starts
at the first /verify deploy (2026-08-10, expo/expo 81cbd5551481);
earlier bot activity is not agent work. Read-only: dispatches nothing,
posts nothing.`;

type RoundupPeriod = 'day' | 'week' | 'month' | 'all';
type RoundupOpts = { period: RoundupPeriod; limit: number; json: boolean; costs: boolean };

function parseRoundupArgs(argv: string[]): RoundupOpts {
  let period: RoundupPeriod = 'week';
  let limit = 30;
  let json = false;
  let costs = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const eq = a.indexOf('=');
    const flag = eq === -1 ? a : a.slice(0, eq);
    const take = (name: string): string => {
      const v = eq === -1 ? argv[++i] : a.slice(eq + 1);
      if (v === undefined || v.startsWith('-')) die(`\`${name}\` needs a value (try --help)`);
      return v;
    };
    if (flag === '--period' || flag === '-p') {
      const v = take(flag).toLowerCase();
      if (v === 'day' || v === 'week' || v === 'month' || v === 'all') period = v;
      else die('--period takes day, week, month, or all (try --help)');
    } else if (flag === '--limit' || flag === '-L') {
      const raw = take(flag);
      if (!/^\d+$/.test(raw) || Number(raw) < 1) die(`'${raw}' is not a positive number`);
      limit = Number(raw);
    } else if (flag === '--json') {
      json = true;
    } else if (flag === '--include-costs') {
      costs = true;
    } else if (a.startsWith('-')) {
      die(`unknown flag: ${a} (try --help)`);
    } else {
      die(`unexpected argument: ${a} (try --help)`);
    }
  }
  return { period, limit, json, costs };
}

/** First agent-work deploy: "[github] Prototype /verify command (#48736)",
 *  expo/expo 81cbd5551481. `--period all` starts here — the expo-bot login
 *  dates to 2020 and its earlier activity is not agent work. */
const AGENT_WORK_EPOCH = '2026-08-10T23:26:53Z';

type RoundupPr = {
  number: number;
  title: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
};

/** Issue search, shaped for the roundup. GitHub caps a page at 100; the
 *  digest lists 30, so one page plus total_count is always enough. */
async function searchBotPrs(query: string): Promise<{ total: number; items: RoundupPr[] }> {
  const raw = await run(
    'gh',
    'api',
    '-X',
    'GET',
    'search/issues',
    '-f',
    `q=${query}`,
    '-f',
    'per_page=100',
    '-f',
    'sort=created',
    '-f',
    'order=desc',
    '--jq',
    '{total: .total_count, items: [.items[] | {number, title, state, created_at, closed_at, merged_at: .pull_request.merged_at}]}'
  );
  return JSON.parse(raw) as { total: number; items: RoundupPr[] };
}

/** html_url says what kind of thread the comment landed on — /pull/N for
 *  a PR, /issues/N for an issue — where issue_url says /issues/N for both. */
type BotComment = { head: string; created_at: string; html_url: string };

/** Every expo-bot comment created in the window. The comments API filters
 *  by UPDATED time, so the created-time window is applied again here. */
async function listBotComments(since: string): Promise<BotComment[]> {
  const raw = await run(
    'gh',
    'api',
    '-X',
    'GET',
    `repos/${REPO}/issues/comments`,
    '-f',
    'per_page=100',
    '-f',
    `since=${since}`,
    '--paginate',
    '--jq',
    '.[] | select(.user.login == "expo-bot") | {head: .body[0:8], created_at, html_url}'
  );
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BotComment)
    .filter((c) => c.created_at >= since);
}

/** Quiet dispatches post no announce comment, but they ARE countable: the
 *  CLI starts them with workflow_dispatch, and unlike issue_comment (a run
 *  per repository comment, almost all skipped) such a run only exists when
 *  someone dispatched. */
async function countQuietDispatches(since: string): Promise<number> {
  return Number(
    await run(
      'gh',
      'api',
      '-X',
      'GET',
      `repos/${REPO}/actions/workflows/${WORKFLOW}/runs`,
      '-f',
      'event=workflow_dispatch',
      '-f',
      `created=>=${since}`,
      '-f',
      'per_page=1',
      '--jq',
      '.total_count'
    )
  );
}

// ---- token usage (`roundup --include-costs`) -------------------------------

/** $/MTok list rates. Cache pricing follows the API's multipliers: a
 *  5-minute cache write bills 1.25x input, a 1-hour write 2x, and a cache
 *  read 0.1x. Sonnet 5 is at its intro list price (through 2026-08-31),
 *  which covers every run this repo has made. */
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'claude-fable-5': { input: 10, output: 50 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-opus-4-7': { input: 5, output: 25 },
  'claude-opus-4-6': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 1, output: 5 },
};

type TokenUsage = {
  input: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  output: number;
};

const emptyUsage = (): TokenUsage => ({
  input: 0,
  cacheWrite5m: 0,
  cacheWrite1h: 0,
  cacheRead: 0,
  output: 0,
});

/** List-price dollars for one model's usage, or null for an unpriced model. */
function listCostUsd(model: string, u: TokenUsage): number | null {
  const p = MODEL_PRICES[model.replace(/-\d{8}$/, '')];
  if (!p) return null;
  return (
    (u.input * p.input +
      u.cacheWrite5m * 1.25 * p.input +
      u.cacheWrite1h * 2 * p.input +
      u.cacheRead * 0.1 * p.input +
      u.output * p.output) /
    1e6
  );
}

/** Runs that actually did agent work. A run is created for every repository
 *  comment, but the noise runs conclude `skipped`; routed runs conclude in
 *  one of these four states, each a separate server-side filter. */
async function listRoutedRunIds(since: string): Promise<number[]> {
  const lists = await Promise.all(
    ['success', 'failure', 'cancelled', 'timed_out'].map((s) =>
      run(
        'gh',
        'api',
        '-X',
        'GET',
        `repos/${REPO}/actions/workflows/${WORKFLOW}/runs`,
        '-f',
        `status=${s}`,
        '-f',
        `created=>=${since}`,
        '-f',
        'per_page=100',
        '--paginate',
        '--jq',
        '.workflow_runs[].id'
      )
    )
  );
  return lists.flatMap((raw) => raw.split('\n').filter(Boolean).map(Number));
}

type CostReport = {
  runsRouted: number;
  runsMeasured: number;
  runsWithoutArtifact: number;
  artifactsExpired: number;
  byModel: Map<string, TokenUsage>;
};

/** Sum API usage from each routed run's transcript artifact. Usage lines are
 *  deduped by API message id across ALL files: a streamed response repeats
 *  its id once per content block, and a resumed session replays earlier
 *  messages into its own transcript — either would double-count otherwise. */
async function collectTokenUsage(
  since: string,
  progress: (done: number, total: number) => void
): Promise<CostReport> {
  const runIds = await listRoutedRunIds(since);
  const report: CostReport = {
    runsRouted: runIds.length,
    runsMeasured: 0,
    runsWithoutArtifact: 0,
    artifactsExpired: 0,
    byModel: new Map(),
  };
  const seen = new Map<string, { model: string; u: TokenUsage }>();
  const dir = mkdtempSync(join(tmpdir(), 'verify-roundup-'));
  let done = 0;
  const worker = async (runId: number): Promise<void> => {
    const artRaw = await run(
      'gh',
      'api',
      '-X',
      'GET',
      `repos/${REPO}/actions/runs/${runId}/artifacts`,
      '--jq',
      '[.artifacts[] | select(.name | startswith("agent-command-run-log")) | {id, expired}]'
    );
    const arts = JSON.parse(artRaw) as { id: number; expired: boolean }[];
    const live = arts.filter((a) => !a.expired);
    if (arts.length === 0) {
      report.runsWithoutArtifact++;
      return;
    }
    if (live.length === 0) {
      report.artifactsExpired++;
      return;
    }
    for (const a of live) {
      const zip = join(dir, `${a.id}.zip`);
      await run('bash', '-c', `gh api repos/${REPO}/actions/artifacts/${a.id}/zip > '${zip}'`);
      let text = '';
      try {
        text = await run('unzip', '-p', zip, '*.jsonl');
      } catch {
        /* the zip held no transcript (findings-only salvage) */
      }
      rmSync(zip, { force: true });
      for (const line of text.split('\n')) {
        if (!line.includes('"usage"')) continue;
        let event: { message?: { id?: string; model?: string; usage?: Record<string, unknown> } };
        try {
          event = JSON.parse(line) as typeof event;
        } catch {
          continue;
        }
        const m = event.message;
        if (!m?.id || !m.model || !m.usage || m.model.startsWith('<')) continue;
        const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
        const output = num(m.usage['output_tokens']);
        const prev = seen.get(m.id);
        if (prev && prev.u.output >= output) continue;
        // Newer usage objects split cache writes by TTL; older ones carry one total.
        const cc = m.usage['cache_creation'] as Record<string, unknown> | undefined;
        seen.set(m.id, {
          model: m.model,
          u: {
            input: num(m.usage['input_tokens']),
            cacheWrite5m: cc
              ? num(cc['ephemeral_5m_input_tokens'])
              : num(m.usage['cache_creation_input_tokens']),
            cacheWrite1h: cc ? num(cc['ephemeral_1h_input_tokens']) : 0,
            cacheRead: num(m.usage['cache_read_input_tokens']),
            output,
          },
        });
      }
    }
    report.runsMeasured++;
  };
  // A small pool: each run is an artifact listing plus a zip download.
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(6, runIds.length) }, async () => {
      while (next < runIds.length) {
        const runId = runIds[next++]!;
        try {
          await worker(runId);
        } catch {
          report.runsWithoutArtifact++;
        }
        progress(++done, runIds.length);
      }
    })
  );
  rmSync(dir, { recursive: true, force: true });
  for (const { model, u } of seen.values()) {
    const agg = report.byModel.get(model) ?? emptyUsage();
    agg.input += u.input;
    agg.cacheWrite5m += u.cacheWrite5m;
    agg.cacheWrite1h += u.cacheWrite1h;
    agg.cacheRead += u.cacheRead;
    agg.output += u.output;
    report.byModel.set(model, agg);
  }
  return report;
}

const fmtTokens = (n: number): string =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `${(n / 1e3).toFixed(1)}k`
        : String(n);

const fmtUsd = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "expo/expo#48932 (pr)" from a comment's html_url, or null off-pattern. */
function commentThread(c: BotComment): { number: string; isPr: boolean } | null {
  const m = /\/(issues|pull)\/(\d+)#/.exec(c.html_url);
  return m ? { number: m[2]!, isPr: m[1] === 'pull' } : null;
}

type ThreadInfo = {
  state: 'MERGED' | 'OPEN' | 'CLOSED';
  headRefName?: string;
  mergedAt?: string | null;
  closedAt?: string | null;
};

/** State (and, for PRs, head branch) per thread number, one aliased GraphQL
 *  call per 100. The verified sections need this: their numbers come from
 *  comment URLs, not a search, and a PR's head branch is what excludes
 *  agent-authored targets. */
async function fetchThreadInfo(
  kind: 'pullRequest' | 'issue',
  numbers: string[]
): Promise<Map<string, ThreadInfo>> {
  const selection =
    kind === 'pullRequest' ? '{ state headRefName mergedAt closedAt }' : '{ state closedAt }';
  const info = new Map<string, ThreadInfo>();
  const [owner, name] = REPO.split('/');
  for (let i = 0; i < numbers.length; i += 100) {
    const fields = numbers
      .slice(i, i + 100)
      .map((n) => `t${n}: ${kind}(number: ${n}) ${selection}`)
      .join(' ');
    const raw = await run(
      'gh',
      'api',
      'graphql',
      '-f',
      `query=query { repository(owner: "${owner}", name: "${name}") { ${fields} } }`,
      '--jq',
      '.data.repository'
    );
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, ThreadInfo | null>)) {
      if (v) info.set(k.slice(1), v);
    }
  }
  return info;
}

async function showRoundup({ period, limit, json, costs }: RoundupOpts): Promise<void> {
  const DAYS: Record<RoundupPeriod, number | null> = { day: 1, week: 7, month: 30, all: null };
  const LABEL: Record<RoundupPeriod, string> = {
    day: 'last 24 hours',
    week: 'last 7 days',
    month: 'last 30 days',
    all: 'all agent work',
  };
  const days = DAYS[period];
  const since =
    days === null
      ? AGENT_WORK_EPOCH
      : new Date(Date.now() - days * 86_400_000).toISOString().replace(/\.\d{3}Z$/, 'Z');

  // JSON mode keeps stdout pure — the Spinner writes there even off-TTY.
  spinner = json ? null : new Spinner();
  spinner?.start(`collecting ${period === 'all' ? LABEL.all : `the ${LABEL[period]}`}`);
  // @ref LLP 0009#trigger-and-authority — commands are tallied from announce
  // comments, not workflow-run counts; runs are created for every comment.
  // `head:verify` scopes the PR sections to agent-work branches (verify/…);
  // the same login also opens docs-sync PRs and carries maintainer pushes.
  const [opened, merged, comments, quiet] = await Promise.all([
    searchBotPrs(`repo:${REPO} is:pr author:expo-bot head:verify created:>=${since}`),
    searchBotPrs(`repo:${REPO} is:pr author:expo-bot head:verify merged:>=${since}`),
    listBotComments(since),
    countQuietDispatches(since),
  ]).catch((e) => die(`could not collect the roundup: ${e instanceof Error ? e.message : e}`));

  // Distinct threads a 🔍 announce landed on: what GOT a verify run, as
  // opposed to the created/merged sections, which are PRs the agent MADE.
  // The announce timestamps ride along: they are when the runs happened.
  const announced = new Map<string, { isPr: boolean; verifiedAt: string[] }>();
  for (const c of comments) {
    if (!c.head.startsWith('🔍')) continue;
    const t = commentThread(c);
    if (t === null) continue;
    const entry = announced.get(t.number) ?? { isPr: t.isPr, verifiedAt: [] };
    entry.verifiedAt.push(c.created_at);
    announced.set(t.number, entry);
  }
  for (const entry of announced.values()) entry.verifiedAt.sort();
  const desc = (a: string, b: string) => Number(b) - Number(a);
  const verifiedPrNums = [...announced]
    .filter(([, a]) => a.isPr)
    .map(([n]) => n)
    .sort(desc);
  const verifiedIssueNums = [...announced]
    .filter(([, a]) => !a.isPr)
    .map(([n]) => n)
    .sort(desc);
  const [prInfo, issueInfo] = await Promise.all([
    fetchThreadInfo('pullRequest', verifiedPrNums),
    fetchThreadInfo('issue', verifiedIssueNums),
  ]).catch((e) =>
    die(`could not fetch verify-target states: ${e instanceof Error ? e.message : e}`)
  );

  const costReport = costs
    ? await collectTokenUsage(since, (done, total) => {
        if (done === 1 || done % 10 === 0 || done === total) {
          spinner?.set(`measuring token usage — ${done}/${total} routed runs`);
        }
      }).catch((e) => die(`could not measure token usage: ${e instanceof Error ? e.message : e}`))
    : null;
  spinner?.stop();

  const verifies = comments.filter((c) => c.head.startsWith('🔍')).length;
  const works = comments.filter((c) => c.head.startsWith('🤖')).length;
  const notices = comments.filter((c) => c.head.startsWith('⛔') || c.head.startsWith('⚠️')).length;
  const mergedCount = opened.items.filter((p) => p.merged_at !== null).length;
  const openCount = opened.items.filter((p) => p.merged_at === null && p.state === 'open').length;
  const closedCount = opened.items.filter((p) => p.merged_at === null && p.state !== 'open').length;
  // Agent-authored targets drop out here: a verify run on a verify/… PR is
  // already visible in the created section.
  const external = verifiedPrNums.filter((n) => {
    const p = prInfo.get(n);
    return p !== undefined && p.headRefName?.startsWith('verify') !== true;
  });

  const costSummary =
    costReport === null
      ? null
      : (() => {
          const totals = emptyUsage();
          const models: { model: string; u: TokenUsage; cost: number | null }[] = [];
          for (const [model, u] of costReport.byModel) {
            totals.input += u.input;
            totals.cacheWrite5m += u.cacheWrite5m;
            totals.cacheWrite1h += u.cacheWrite1h;
            totals.cacheRead += u.cacheRead;
            totals.output += u.output;
            models.push({ model, u, cost: listCostUsd(model, u) });
          }
          models.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
          return {
            totals,
            models,
            totalCost: models.reduce((s, m) => s + (m.cost ?? 0), 0),
            anyUnpriced: models.some((m) => m.cost === null),
          };
        })();

  if (json) {
    const searchPr = (p: RoundupPr) => ({
      number: p.number,
      title: p.title,
      state: p.merged_at !== null ? 'merged' : p.state,
      url: `https://github.com/${REPO}/pull/${p.number}`,
      createdAt: p.created_at,
      mergedAt: p.merged_at,
      closedAt: p.closed_at,
    });
    const verifiedPr = (n: string) => ({
      number: Number(n),
      url: `https://github.com/${REPO}/pull/${n}`,
      state: prInfo.get(n)?.state.toLowerCase() ?? null,
      mergedAt: prInfo.get(n)?.mergedAt ?? null,
      closedAt: prInfo.get(n)?.closedAt ?? null,
      verifiedAt: announced.get(n)!.verifiedAt,
    });
    const verifiedIssue = (n: string) => ({
      number: Number(n),
      url: `https://github.com/${REPO}/issues/${n}`,
      state: issueInfo.get(n)?.state.toLowerCase() ?? null,
      closedAt: issueInfo.get(n)?.closedAt ?? null,
      verifiedAt: announced.get(n)!.verifiedAt,
    });
    console.log(
      JSON.stringify(
        {
          period,
          since,
          generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
          commands: { verify: verifies, work: works, notices, quietDispatches: quiet },
          created: {
            total: opened.total,
            merged: mergedCount,
            open: openCount,
            closed: closedCount,
            pageCapped: opened.total > opened.items.length,
            prs: opened.items.map(searchPr),
          },
          merged: {
            total: merged.total,
            pageCapped: merged.total > merged.items.length,
            prs: merged.items.map(searchPr),
          },
          verified: { total: external.length, prs: external.map(verifiedPr) },
          issues: { total: verifiedIssueNums.length, issues: verifiedIssueNums.map(verifiedIssue) },
          ...(costReport && costSummary
            ? {
                tokens: {
                  runsRouted: costReport.runsRouted,
                  runsMeasured: costReport.runsMeasured,
                  runsWithoutArtifact: costReport.runsWithoutArtifact,
                  artifactsExpired: costReport.artifactsExpired,
                  byModel: Object.fromEntries(
                    costSummary.models.map((m) => [m.model, { ...m.u, listCostUsd: m.cost }])
                  ),
                  totals: {
                    ...costSummary.totals,
                    listCostUsd: costSummary.anyUnpriced ? null : costSummary.totalCost,
                  },
                },
              }
            : {}),
        },
        null,
        2
      )
    );
    return;
  }

  const span = `   ${since.slice(0, 10)} → today`;
  console.log(`\n${ui.accent(`agent-work roundup — ${LABEL[period]}`)}${ui.faint(span)}\n`);

  console.log(
    `  ${ui.mute('commands')}  ${verifies} verify · ${works} work · ${notices} refusal/warning notices · ${quiet} quiet dispatches`
  );
  console.log(
    `            ${ui.faint('comment commands from announces; quiet dispatches from workflow_dispatch runs')}`
  );

  const breakdown =
    opened.total > opened.items.length
      ? ` (state breakdown covers the newest ${opened.items.length})`
      : '';
  console.log(
    `\n  ${ui.mute('created')}   ${opened.total} PRs opened by agent commands: ` +
      `${ui.ok(`${mergedCount} merged`)} · ${ui.accent(`${openCount} open`)} · ${ui.mute(`${closedCount} closed`)}${ui.faint(breakdown)}`
  );
  const shown = opened.items.slice(0, limit);
  for (const p of shown) {
    const state =
      p.merged_at !== null
        ? ui.ok('merged')
        : p.state === 'open'
          ? ui.accent('open  ')
          : ui.mute('closed');
    console.log(
      `    ${state}  ${link(`#${p.number}`, `https://github.com/${REPO}/pull/${p.number}`)}  ${clip(p.title, 72)}`
    );
  }
  if (opened.total > shown.length) {
    // The search page holds 100, so a bigger --limit cannot list past that.
    const why = limit > opened.items.length ? 'one search page holds 100' : `--limit ${limit}`;
    console.log(ui.faint(`    … and ${opened.total - shown.length} more (${why})`));
  }

  const nums = merged.items
    .slice(0, limit)
    .map((p) => link(`#${p.number}`, `https://github.com/${REPO}/pull/${p.number}`))
    .join(' ');
  const overflow =
    merged.total > limit ? ui.faint(` … (${Math.min(limit, merged.items.length)} shown)`) : '';
  console.log(
    `\n  ${ui.mute('merged')}    ${merged.total} in the span${merged.total > 0 ? `: ${nums}` : ''}${overflow}`
  );

  const stateRows = (nums: string[], info: Map<string, ThreadInfo>, path: string): void => {
    const groups: [string, (s: string) => string][] = [
      ['MERGED', ui.ok],
      ['OPEN', ui.accent],
      ['CLOSED', ui.mute],
    ];
    for (const [state, paint] of groups) {
      const inState = nums.filter((n) => info.get(n)?.state === state);
      if (inState.length === 0) continue;
      const capped = inState
        .slice(0, limit)
        .map((n) => link(`#${n}`, `https://github.com/${REPO}/${path}/${n}`))
        .join(' ');
      const over = inState.length > limit ? ui.faint(` … (${limit} shown)`) : '';
      console.log(
        `    ${paint(state.toLowerCase().padEnd(6))}  ${inState.length}: ${capped}${over}`
      );
    }
  };

  console.log(`\n  ${ui.mute('verified')}  ${external.length} PRs by others got a verify run`);
  stateRows(external, prInfo, 'pull');

  console.log(`\n  ${ui.mute('issues')}    ${verifiedIssueNums.length} issues got a verify run`);
  stateRows(verifiedIssueNums, issueInfo, 'issues');

  if (costReport && costSummary) {
    const coverage = [
      `${costReport.runsMeasured} of ${costReport.runsRouted} routed runs measured`,
      costReport.artifactsExpired > 0
        ? `${costReport.artifactsExpired} expired (14-day retention)`
        : '',
      costReport.runsWithoutArtifact > 0
        ? `${costReport.runsWithoutArtifact} without a transcript`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    console.log(`\n  ${ui.mute('tokens')}    ${coverage}`);
    const usageRow = (u: TokenUsage): string =>
      `in ${fmtTokens(u.input)} · cache w ${fmtTokens(u.cacheWrite5m + u.cacheWrite1h)}` +
      ` · cache r ${fmtTokens(u.cacheRead)} · out ${fmtTokens(u.output)}`;
    for (const { model, u, cost } of costSummary.models) {
      const price = cost === null ? ui.faint('(no list price on file)') : `≈ ${fmtUsd(cost)}`;
      console.log(`    ${ui.mute(model.padEnd(18))}  ${usageRow(u)}  ${price}`);
    }
    console.log(
      `    ${ui.mute('total'.padEnd(18))}  ${usageRow(costSummary.totals)}` +
        `  ≈ ${fmtUsd(costSummary.totalCost)}${costSummary.anyUnpriced ? '+' : ''} ${ui.faint('at list API prices')}`
    );
  }

  console.log(
    `\n${ui.faint('created/merged count agent branches (verify/…); verified and issues count what the 🔍 commands targeted')}\n`
  );
}

type Job = {
  name: string;
  id: number;
  status: string;
  conclusion: string | null;
  steps: { name: string; status: string; started_at: string | null }[];
};

/**
 * OSC 8 hyperlink — what `terminal-link` does, without the dependency.
 * Terminals that do not understand the escape simply render the label, so
 * the number stays visible either way; piped output gets the bare URL,
 * because an escape sequence in a file is noise. Anything wrapped in this
 * must not be padded afterwards: the escapes count toward String.length and
 * would throw the columns out.
 */
function link(label: string, url: string): string {
  if (process.stdout.isTTY !== true) return `${label} (${url})`;
  return `\x1b]8;;${url}\x07${label}\x1b]8;;\x07`;
}

/** One line per run, so a long issue title must not wrap and break the shape. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Word-wrap plain text. Wrap before styling — a half-open OSC 8 leaks the rest of the line. */
function wrapText(text: string, width: number): string[] {
  if (width < 1) return [text];
  if (text.length <= width) return [text];
  const lines: string[] = [];
  let rest = text.trim();
  while (rest.length > width) {
    let cut = rest.lastIndexOf(' ', width);
    if (cut < 1) cut = width;
    lines.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) lines.push(rest);
  return lines.length > 0 ? lines : [text];
}

function die(message: string): never {
  spinner?.stop();
  console.error(`verify: ${message}`);
  process.exit(1);
}

/** Accept 48780, #48780, or https://github.com/expo/expo/issues/48780 (pull/ too). */
function parseTarget(raw: string): string {
  const s = raw.trim();
  const url = s.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(?:issues|pulls?)\/(\d+)(?:[/?#].*)?$/i
  );
  if (url) {
    const nwo = `${url[1]}/${url[2]}`;
    if (nwo.toLowerCase() !== REPO.toLowerCase()) {
      die(`that URL is ${nwo}#${url[3]}; this command only dispatches ${REPO}`);
    }
    return url[3]!;
  }
  const n = s.replace(/^#/, '');
  if (!/^\d+$/.test(n)) {
    die(`'${raw}' is not an issue/PR number or an ${REPO} URL (try --help)`);
  }
  return n;
}

/**
 * A single redrawing status line. Only when stdout is a TTY — piped into a
 * file or another process, the escape codes would be garbage, so it falls
 * back to printing each phase once.
 */
class Spinner {
  private static readonly FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private started = Date.now();
  private label = '';
  private readonly tty = process.stdout.isTTY === true;

  start(label: string): void {
    this.label = label;
    this.started = Date.now();
    if (!this.tty) {
      console.log(`  ${label}…`);
      return;
    }
    process.stdout.write('\x1b[?25l'); // hide cursor
    this.timer ??= setInterval(() => this.draw(), 80);
    this.draw();
  }

  /** Change the text without restarting the elapsed clock. */
  set(label: string): void {
    this.label = label;
    if (!this.tty) console.log(`  ${label}…`);
  }

  private draw(): void {
    const secs = Math.round((Date.now() - this.started) / 1000);
    const spin = Spinner.FRAMES[this.frame++ % Spinner.FRAMES.length];
    const age = secs >= 1 ? ` \x1b[2m${secs}s\x1b[0m` : '';
    process.stdout.write(`\r\x1b[2K  ${spin} ${this.label}${age}`);
  }

  /** Clear the line and optionally leave a final message in its place. */
  stop(final?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.tty) process.stdout.write('\r\x1b[2K\x1b[?25h'); // clear + show cursor
    if (final) console.log(final);
  }
}

let spinner: Spinner | null = null;
// Leaving a terminal with a hidden cursor is rude; restore it on Ctrl-C.
process.on('SIGINT', () => {
  spinner?.stop();
  process.exit(130);
});

/** Run a command, returning trimmed stdout. Throws with stderr on failure. */
async function run(...cmd: string[]): Promise<string> {
  try {
    const { stdout } = await spawnAsync(cmd[0]!, cmd.slice(1), { stdio: 'pipe' });
    return stdout.trim();
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string; status?: number | null };
    throw new Error(
      err.stderr?.trim() || err.stdout?.trim() || `${cmd[0]} exited ${err.status ?? '?'}`
    );
  }
}

const RUN_JSON = 'databaseId,status,conclusion,createdAt,updatedAt,event,displayTitle';

async function listRuns(
  limit: number,
  status?: string,
  workflow = WORKFLOW,
  event?: string
): Promise<Run[]> {
  const cmd = [
    'gh',
    'run',
    'list',
    '--repo',
    REPO,
    '--workflow',
    workflow,
    '--limit',
    String(limit),
    '--json',
    RUN_JSON,
  ];
  if (status) cmd.push('--status', status);
  if (event) cmd.push('--event', event);
  const raw = await run(...cmd).catch((e) =>
    die(`could not list runs: ${e instanceof Error ? e.message : e}`)
  );
  return JSON.parse(raw) as Run[];
}

const COMMENT_DONE = ['success', 'failure', 'cancelled', 'timed_out'] as const;

/** Recent verify commands only. GitHub lists by created-at, has no
 *  updated-at order, and filters by exactly one status per request. So:
 *  no status → in-flight runs only, one fetch per live status (exact, so
 *  a fresh completed run can never crowd an old live run out of the
 *  limit); `completed` → the dispatch stream plus comment *outcomes*
 *  (not `completed`, which is almost all skip-gates); any other status →
 *  both event streams for that status. Merged by last update. */
async function listVerifyRuns(limit: number, status?: string): Promise<Run[]> {
  const fetches: Promise<Run[]>[] = [];
  if (!status) {
    for (const s of LS_LIVE) fetches.push(listRuns(limit, s));
  } else if (status === 'completed') {
    fetches.push(listRuns(limit, status, WORKFLOW, 'workflow_dispatch'));
    for (const s of COMMENT_DONE) fetches.push(listRuns(limit, s, WORKFLOW, 'issue_comment'));
  } else {
    fetches.push(listRuns(limit, status, WORKFLOW, 'workflow_dispatch'));
    fetches.push(listRuns(limit, status, WORKFLOW, 'issue_comment'));
  }
  const batches = await Promise.all(fetches);
  const byId = new Map<number, Run>();
  for (const r of batches.flat()) byId.set(r.databaseId, r);
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, limit);
}

type Resolved = Run & {
  target: string | null;
  slot: string | null;
  what: string;
  kind: 'PR' | 'issue' | null;
  title: string;
  mins: number;
  step: string | null;
  stepMins: number | null;
  /** Command-job result when we have it. The workflow is continue-on-error
   *  so salvage/upload can run; `gh run list` then reports the run as
   *  success even when the agent job failed. */
  outcome: string | null;
  actor: string | null;
};

async function resolveRun(r: Run): Promise<Resolved> {
  let target: string | null = null;
  let slot: string | null = null;
  let step: string | null = null;
  let stepMins: number | null = null;
  let commandConclusion: string | null = null;
  let actor: string | null = null;
  try {
    const [jobsRaw, who] = await Promise.all([
      run(
        'gh',
        'api',
        `repos/${REPO}/actions/runs/${r.databaseId}/jobs`,
        '--jq',
        '[.jobs[] | {name, id, status, conclusion, steps: [.steps[] | {name, status, started_at}]}]'
      ),
      run(
        'gh',
        'api',
        `repos/${REPO}/actions/runs/${r.databaseId}`,
        '--jq',
        '.triggering_actor.login // .actor.login // empty'
      ).catch(() => ''),
    ]);
    actor = who || null;
    const jobs = JSON.parse(jobsRaw) as Job[];
    const vj = jobs.find((x) => COMMAND_JOB.has(x.name));
    commandConclusion = vj?.conclusion ?? null;
    const cur = vj?.steps.find((x) => x.status === 'in_progress');
    if (cur) {
      const idx = vj!.steps.findIndex((x) => x.name === cur.name) + 1;
      step = `${cur.name} (${idx}/${vj!.steps.length})`;
      if (cur.started_at) stepMins = Math.round((Date.now() - Date.parse(cur.started_at)) / 60000);
    }
    const slotJob = jobs.find((j) => SLOT_JOB.has(j.name) && j.status === 'completed');
    if (slotJob) {
      const log = await run('gh', 'api', `repos/${REPO}/actions/jobs/${slotJob.id}/logs`);
      const m = log.match(/target (\d+) -> slot (\d+)/);
      if (m) {
        target = m[1]!;
        slot = m[2]!;
      }
    }
  } catch {
    /* fall through to unknown */
  }

  let kind: 'PR' | 'issue' | null = null;
  let title = '';
  if (target) {
    try {
      const meta = JSON.parse(
        await run(
          'gh',
          'api',
          `repos/${REPO}/issues/${target}`,
          '--jq',
          '{isPR: (.pull_request != null), title}'
        )
      ) as { isPR: boolean; title: string };
      kind = meta.isPR ? 'PR' : 'issue';
      title = meta.title;
    } catch {
      /* leave blank; the caller falls back to displayTitle */
    }
  }
  const what = kind ? `${kind === 'PR' ? 'PR   ' : 'issue'}  ${clip(title, 58)}` : '';
  const end = r.status === 'completed' ? Date.parse(r.updatedAt) : Date.now();
  const mins = Math.round((end - Date.parse(r.createdAt)) / 60000);
  const outcome =
    commandConclusion === 'failure' ||
    commandConclusion === 'timed_out' ||
    commandConclusion === 'cancelled' ||
    commandConclusion === 'startup_failure'
      ? commandConclusion
      : r.conclusion;
  return { ...r, target, slot, what, kind, title, mins, step, stepMins, outcome, actor };
}

/** Newest run id for the workflow, or null when there are none yet. */
async function latestRunId(): Promise<string | null> {
  const id = await run(
    'gh',
    'run',
    'list',
    '--repo',
    REPO,
    '--workflow',
    WORKFLOW,
    '--limit',
    '1',
    '--json',
    'databaseId',
    '--jq',
    '.[0].databaseId // empty'
  ).catch(() => '');
  return id || null;
}

/** Colour when stdout is a TTY, or FORCE_COLOR=1. Honours NO_COLOR. */
const USE_COLOR =
  process.env.NO_COLOR !== '1' &&
  (process.stdout.isTTY === true || process.env.FORCE_COLOR === '1');

// Soft 256-colour tokens so status is readable on dark and light terminals
// without the vibrating 16-colour primaries. Must live above the top-level
// `await showDashboard()` — a const after that await is still in the TDZ
// when the renderer runs.
const ui = {
  faint: (s: string) => paint('38;5;240', s),
  mute: (s: string) => paint('38;5;245', s),
  ok: (s: string) => paint('38;5;114', s),
  bad: (s: string) => paint('38;5;203', s),
  warn: (s: string) => paint('38;5;215', s),
  accent: (s: string) => paint('38;5;111', s),
};

export default (program: Command) => {
  program
    .command('verify [args...]')
    .allowUnknownOption()
    .description(
      "Dispatch expo/expo's /verify workflow quietly, or inspect verification runs (dash / ls / roundup)."
    )
    .on('--help', () => {
      console.log();
      console.log(contextHelp(process.argv));
    })
    .asyncAction(actionAsync);
};

// commander's parsed args split flag values off unpredictably under
// allowUnknownOption, so the command re-reads the raw argv after its own
// name and keeps the grammar the standalone script had.
async function actionAsync(): Promise<void> {
  const idx = process.argv.indexOf('verify');
  await main(idx === -1 ? [] : process.argv.slice(idx + 1));
}

// Subcommand-aware help: commander intercepts --help before the action
// runs, so the right page is chosen from the raw argv here.
function contextHelp(argv: string[]): string {
  if (argv.includes('ls') || argv.includes('list')) return LS_HELP;
  if (argv.includes('roundup')) return ROUNDUP_HELP;
  if (argv.includes('d') || argv.includes('dash') || argv.includes('dashboard')) return DASH_HELP;
  return HELP;
}

async function main(args: string[]): Promise<void> {
  const wantsHelp = args.includes('-h') || args.includes('--help');

  // Checked before the general help, so `et verify ls --help` explains the
  // listing and what a slot is, rather than repeating the dispatch usage.
  if (args[0] === 'ls' || args[0] === 'list') {
    if (wantsHelp) {
      console.log(LS_HELP);
      return;
    }
    await listInFlight(parseLsArgs(args.slice(1)));
    return;
  }

  if (args[0] === 'roundup') {
    if (wantsHelp) {
      console.log(ROUNDUP_HELP);
      return;
    }
    await showRoundup(parseRoundupArgs(args.slice(1)));
    return;
  }

  if (args[0] === 'd' || args[0] === 'dash' || args[0] === 'dashboard') {
    if (wantsHelp) {
      console.log(DASH_HELP);
      return;
    }
    if (args.slice(1).some((a) => a !== '-h' && a !== '--help')) {
      die('dashboard takes no extra arguments (try --help)');
    }
    await showDashboard();
    return;
  }

  if (args.length === 0) {
    await showDashboard();
    return;
  }

  if (wantsHelp) {
    console.log(HELP);
    return;
  }

  await dispatchAsync(args);
}

function ageMins(iso: string): number {
  return Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
}

function paint(code: string, s: string): string {
  return USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s;
}

/** Visible columns, ignoring CSI colour and OSC 8 hyperlinks. */
function visibleWidth(s: string): number {
  return s.replace(/\x1b\]8;;[^\x07]*\x07/g, '').replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padVisible(s: string, width: number): string {
  const w = visibleWidth(s);
  if (w === width) return s;
  if (w < width) return s + ' '.repeat(width - w);
  return clipVisible(s, width);
}

function padStartVisible(s: string, width: number): string {
  const w = visibleWidth(s);
  if (w === width) return s;
  if (w < width) return ' '.repeat(width - w) + s;
  return clipVisible(s, width);
}

function clipVisible(s: string, width: number): string {
  if (visibleWidth(s) <= width) return s;
  // Strip markup, clip the readable text — wrapping a half-open OSC 8 would
  // leak the rest of the line as a link.
  const plain = s.replace(/\x1b\]8;;[^\x07]*\x07/g, '').replace(/\x1b\[[0-9;]*m/g, '');
  return clip(plain, width);
}

/** OSC 8 when the terminal can use it; never dumps the URL into the layout. */
function href(label: string, url: string): string {
  if (process.stdout.isTTY !== true) return label;
  return `\x1b]8;;${url}\x07${label}\x1b]8;;\x07`;
}

function dashIssue(target: string | null): string {
  if (!target) return ui.mute('#?');
  return href(`#${target}`, `https://github.com/${REPO}/issues/${target}`);
}

function dashRun(label: string, id: number): string {
  return href(label, `https://github.com/${REPO}/actions/runs/${id}`);
}

function actorLink(login: string | null, width = 16): string {
  const raw = login ? `@${login}` : '—';
  const label = clip(raw, width);
  const painted = login ? href(ui.mute(label), `https://github.com/${login}`) : ui.mute(label);
  return padVisible(painted, width);
}

function fmtAge(mins: number): string {
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  // Always `2h05m` so a column of mixed hours lines up; `2h` would
  // collapse to a different width than `2h25m`.
  return `${h}h${String(m).padStart(2, '0')}m`;
}

/** Ceiling to a short window label: `47m`, `6h`, `2d`. */
function fmtSpan(mins: number): string {
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const h = Math.ceil(mins / 60);
  if (h < 48) return `${h}h`;
  return `${Math.ceil(h / 24)}d`;
}

function parseStep(step: string | null): { name: string; at: number; of: number } | null {
  if (!step) return null;
  const m = step.match(/^(.*) \((\d+)\/(\d+)\)$/);
  if (!m) return { name: step, at: 0, of: 0 };
  return { name: m[1]!, at: Number(m[2]), of: Number(m[3]) };
}

/** Thin track. Filled units use the supplied painter. */
function track(filled: number, total: number, width: number, ink: (s: string) => string): string {
  if (total <= 0) return ui.faint('─'.repeat(width));
  const n = Math.max(0, Math.min(width, Math.round((filled / total) * width)));
  return ink('━'.repeat(n)) + ui.faint('─'.repeat(width - n));
}

function dashWidth(): number {
  const cols = process.stdout.columns ?? 80;
  // Leave 2 columns for the indent so an 80-wide tty does not wrap the box.
  // script(1) and some CI ttys report a toy width; don't collapse the card.
  const usable = (cols < 60 ? 72 : Math.min(84, cols)) - 2;
  return Math.max(54, usable);
}

type ForkInfo =
  | { kind: 'even' }
  | { kind: 'behind'; n: number }
  | { kind: 'ahead'; n: number }
  | { kind: 'diverged'; behind: number; ahead: number }
  | { kind: 'unknown' };

type SyncInfo =
  | { kind: 'ok' | 'fail' | 'running'; mins: number; id: number; label: string }
  | { kind: 'none' }
  | { kind: 'missing' };

async function showDashboard(): Promise<void> {
  const spin = new Spinner();
  spin.start('assembling dashboard');

  const [liveRaw, doneRaw, fork, sync] = await Promise.all([
    listVerifyRuns(30),
    listVerifyRuns(20, 'completed'),
    (async (): Promise<ForkInfo> => {
      try {
        const cmp = JSON.parse(
          await run(
            'gh',
            'api',
            `repos/${REPO}/compare/main...expo-bot:main`,
            '--jq',
            '{ahead_by,behind_by}'
          )
        ) as { ahead_by: number; behind_by: number };
        if (cmp.behind_by === 0 && cmp.ahead_by === 0) return { kind: 'even' };
        if (cmp.behind_by > 0 && cmp.ahead_by > 0) {
          return { kind: 'diverged', behind: cmp.behind_by, ahead: cmp.ahead_by };
        }
        if (cmp.behind_by > 0) return { kind: 'behind', n: cmp.behind_by };
        return { kind: 'ahead', n: cmp.ahead_by };
      } catch {
        return { kind: 'unknown' };
      }
    })(),
    (async (): Promise<SyncInfo> => {
      try {
        const rows = JSON.parse(
          await run(
            'gh',
            'run',
            'list',
            '--repo',
            REPO,
            '--workflow',
            SYNC_WORKFLOW,
            '--limit',
            '1',
            '--json',
            'status,conclusion,updatedAt,databaseId'
          )
        ) as {
          status: string;
          conclusion: string | null;
          updatedAt: string;
          databaseId: number;
        }[];
        const s = rows[0];
        if (!s) return { kind: 'none' };
        const mins = ageMins(s.updatedAt);
        if (s.status !== 'completed') {
          return { kind: 'running', mins, id: s.databaseId, label: s.status.replace('_', ' ') };
        }
        const fail =
          s.conclusion === 'failure' ||
          s.conclusion === 'timed_out' ||
          s.conclusion === 'startup_failure';
        return {
          kind: fail ? 'fail' : 'ok',
          mins,
          id: s.databaseId,
          label: s.conclusion ?? 'done',
        };
      } catch {
        return { kind: 'missing' };
      }
    })(),
  ]);

  // Titles need a resolve; the tally bar can stay on the unresolved rest.
  const preview = doneRaw.slice(0, 8);
  spin.set(
    `resolving ${liveRaw.length + preview.length} run${liveRaw.length + preview.length === 1 ? '' : 's'}`
  );
  const [live, recent] = await Promise.all([
    Promise.all(liveRaw.map(resolveRun)),
    Promise.all(preview.map(resolveRun)),
  ]);

  const counts = { success: 0, failure: 0, cancelled: 0, other: 0 };
  const seen = new Map(recent.map((r) => [r.databaseId, r.outcome]));
  for (const r of doneRaw) {
    const c = seen.get(r.databaseId) ?? r.conclusion;
    if (c === 'success') counts.success++;
    else if (c === 'failure' || c === 'timed_out' || c === 'startup_failure') {
      counts.failure++;
    } else if (c === 'cancelled') counts.cancelled++;
    else counts.other++;
  }

  spin.stop();
  renderDashboard({ live, done: doneRaw, recent, counts, fork, sync });
}

function forkLine(fork: ForkInfo): string {
  switch (fork.kind) {
    case 'even':
      return ui.ok('even with main');
    case 'behind':
      return ui.bad(`${fork.n} behind main`);
    case 'ahead':
      return ui.warn(`${fork.n} ahead of main`);
    case 'diverged':
      return ui.bad(`${fork.behind} behind, ${fork.ahead} ahead`);
    case 'unknown':
      return ui.mute('unknown');
  }
}

function syncLine(sync: SyncInfo): string {
  switch (sync.kind) {
    case 'ok':
      return `${dashRun(ui.ok('ok'), sync.id)}  ${ui.mute(`${fmtAge(sync.mins)} ago`)}`;
    case 'fail':
      return `${dashRun(ui.bad(sync.label), sync.id)}  ${ui.mute(`${fmtAge(sync.mins)} ago`)}`;
    case 'running':
      return `${dashRun(ui.warn(sync.label), sync.id)}  ${ui.mute(fmtAge(sync.mins))}`;
    case 'none':
      return ui.mute('no runs yet');
    case 'missing':
      return ui.mute('not on main');
  }
}

function renderDashboard(d: {
  live: Resolved[];
  done: Run[];
  recent: Resolved[];
  counts: { success: number; failure: number; cancelled: number; other: number };
  fork: ForkInfo;
  sync: SyncInfo;
}): void {
  const boxW = dashWidth();
  const inner = boxW - 4; // │␠ … ␠│
  const indent = '  ';

  // No target yet = slot job has not spoken (or never will: a findings
  // comment retriggers this workflow and skip-exits). Those flash as
  // `#?` + the issue title and look like a third verify.
  const known = d.live.filter((r) => r.target);
  const running = known.filter((r) => r.status === 'in_progress');
  const queued = known.filter((r) => r.status !== 'in_progress');
  const ordered = [
    ...running.sort((a, b) => b.mins - a.mins),
    ...queued.sort((a, b) => b.mins - a.mins),
  ];

  const card: string[] = [];
  if (ordered.length === 0) {
    card.push(ui.faint('none'));
  }
  for (const r of ordered) {
    const live = r.status === 'in_progress';
    const runUrl = `https://github.com/${REPO}/actions/runs/${r.databaseId}`;
    const dot = href(live ? ui.ok('●') : ui.warn('◌'), runUrl);
    const who = ui.accent(dashIssue(r.target));
    const run = dashRun(ui.accent(String(r.databaseId)), r.databaseId);
    const age = ui.mute(fmtAge(r.mins).padStart(4));
    const parsed = parseStep(r.step);
    let progress = live ? ui.faint('starting…') : ui.warn('queued');
    if (live && parsed && parsed.of > 0) {
      const bar = track(parsed.at, parsed.of, 10, ui.ok);
      progress = `${bar}  ${ui.mute(`${parsed.at}/${parsed.of}`)}`;
    }
    card.push(`${dot}  ${padVisible(who, 7)}  ${run}  ${actorLink(r.actor)}  ${age}  ${progress}`);
    const label = r.title || r.what || r.displayTitle;
    if (label) {
      for (const part of wrapText(label, inner - 3)) {
        card.push(`   ${href(ui.mute(part), runUrl)}`);
      }
    }
  }

  const capBits = [
    running.length ? `${running.length} running` : null,
    queued.length ? `${queued.length} queued` : null,
  ].filter((x): x is string => x !== null);
  const cap = capBits.length ? `in progress:  ${capBits.join(' · ')}` : 'in progress:';
  const rule = Math.max(1, boxW - 5 - visibleWidth(cap));
  const row = (line: string): string =>
    `${indent}${ui.faint('│ ')}${padVisible(line, inner)}${ui.faint(' │')}`;
  console.log();
  console.log(
    `${indent}${ui.faint('╭─ ')}${ui.mute(cap)}${ui.faint(' ' + '─'.repeat(rule) + '╮')}`
  );
  console.log(row(''));
  for (const line of card) console.log(row(line));
  console.log(row(''));
  const keyW = Math.max(visibleWidth(FORK), 4);
  const foot = [
    `${ui.mute(FORK.padEnd(keyW))}  ${forkLine(d.fork)}`,
    `${ui.mute('sync'.padEnd(keyW))}  ${syncLine(d.sync)}`,
  ];
  console.log(`${indent}${ui.faint('├' + '─'.repeat(boxW - 2) + '┤')}`);
  console.log(row(''));
  for (const line of foot) console.log(row(line));
  console.log(row(''));
  console.log(`${indent}${ui.faint('╰' + '─'.repeat(boxW - 2) + '╯')}`);

  if (d.done.length > 0) {
    console.log();
    const bits = [
      d.counts.success ? ui.ok(`${d.counts.success} passed`) : null,
      d.counts.failure ? ui.bad(`${d.counts.failure} failed`) : null,
      d.counts.cancelled ? ui.mute(`${d.counts.cancelled} cancelled`) : null,
      d.counts.other ? ui.warn(`${d.counts.other} other`) : null,
    ].filter((x): x is string => x !== null);
    const oldest = d.done[d.done.length - 1];
    const span = oldest ? fmtSpan(ageMins(oldest.updatedAt)) : null;
    const recentRows = d.recent.filter((r) => r.target);
    const recentLine = (
      mark: string,
      issue: string,
      run: string,
      actor: string,
      ago: string,
      took: string,
      title: string
    ): string =>
      `${indent}${mark}  ${padVisible(issue, 7)}  ${padVisible(run, 11)}  ${padVisible(actor, 16)}  ${padStartVisible(ago, 6)}  ${padStartVisible(took, 6)}  ${title}`;
    const capLeft = `${indent}${ui.mute(span ? `recent · ${span}` : 'recent')}`;
    const capRight = bits.join(ui.faint(' · '));
    const capGap = Math.max(
      2,
      boxW + indent.length - visibleWidth(capLeft) - visibleWidth(capRight)
    );
    console.log(`${capLeft}${' '.repeat(capGap)}${capRight}`);
    console.log();
    if (recentRows.length > 0) {
      console.log(ui.faint(recentLine(' ', 'issue', 'run', 'by', 'ago', 'took', 'title')));
      for (const r of recentRows) {
        const mark =
          r.outcome === 'success'
            ? ui.ok('✓')
            : r.outcome === 'cancelled'
              ? ui.mute('⊘')
              : ui.bad('✗');
        const runUrl = `https://github.com/${REPO}/actions/runs/${r.databaseId}`;
        const glyph = href(mark, runUrl);
        const label = r.title || r.what || r.displayTitle;
        const prefix = recentLine(
          glyph,
          ui.accent(dashIssue(r.target)),
          dashRun(ui.accent(String(r.databaseId)), r.databaseId),
          actorLink(r.actor),
          ui.mute(fmtAge(ageMins(r.updatedAt))),
          ui.mute(fmtAge(r.mins)),
          ''
        );
        const room = Math.max(12, boxW + indent.length - visibleWidth(prefix));
        console.log(prefix + href(ui.mute(clip(label, room)), runUrl));
      }
    }
  }

  console.log();
}

/**
 * What is currently running or queued, and what each run is for.
 *
 * A run does not advertise its target: `issue_comment` runs carry the issue
 * TITLE in display_title and dispatched runs carry the workflow name, and
 * neither exposes the number. The slot job does — it echoes
 * "target <n> -> slot <k>" — and it finishes in seconds while the command job
 * is still going, so its log is readable for the whole life of the run. That
 * is the only reliable source, so a run whose slot job has not finished yet is
 * reported honestly as unknown rather than guessed at from the title.
 */
async function listInFlight(opts: LsOpts): Promise<void> {
  const spin = new Spinner();
  spin.start('looking for verification runs');
  const selected = await listVerifyRuns(opts.limit, opts.status ?? undefined);
  const live = !opts.status || LS_LIVE.has(opts.status);

  if (selected.length === 0) {
    spin.stop(
      opts.status ? `no verification runs with status ${opts.status}` : 'no verifications in flight'
    );
    return;
  }

  spin.set(`resolving ${selected.length} run${selected.length === 1 ? '' : 's'}`);
  const resolved = await Promise.all(selected.map(resolveRun));

  spin.stop();
  if (live) {
    const busy = new Set(resolved.map((r) => r.slot).filter(Boolean));
    console.log(
      `${resolved.length} in flight · slots ${[...Array(SLOTS).keys()]
        .map((i) => (busy.has(String(i)) ? `\x1b[1m${i}\x1b[0m` : `\x1b[2m${i}\x1b[0m`))
        .join(' ')} (bold = busy)\n`
    );
  } else {
    console.log(`\x1b[2m${opts.status}\x1b[0m`);
  }

  // Longest-running first when watching live work: the run most likely to
  // need attention — or to be near its 150-minute cap — is at the top.
  const rows = live ? resolved.sort((a, b) => b.mins - a.mins) : resolved;
  for (const r of rows) {
    const age = `${r.mins}m`.padStart(4);
    // GitHub redirects /issues/<n> to the pull request when the number is one,
    // so a single URL shape works for both.
    const who = r.target
      ? link(`#${r.target}`, `https://github.com/${REPO}/issues/${r.target}`)
      : '#?????';
    const runLink = link(
      `run ${r.databaseId}`,
      `https://github.com/${REPO}/actions/runs/${r.databaseId}`
    );
    if (live) {
      const mark = r.status === 'in_progress' ? '●' : '◌';
      console.log(
        `  ${mark} ${r.status.replace('_', ' ').padEnd(11)} ${age}  ${who}  ${r.what || clip(r.displayTitle, 58)}`
      );
      const detail = r.step
        ? `${r.step}${r.stepMins !== null ? ` · ${r.stepMins}m in step` : ''}`
        : 'waiting for a free slot';
      const by = r.actor ? ` · ${link(`@${r.actor}`, `https://github.com/${r.actor}`)}` : '';
      console.log(`    \x1b[2m↳ ${detail} · slot ${r.slot ?? '?'}${by} · ${runLink}\x1b[0m`);
    } else {
      const mark =
        r.outcome === 'success'
          ? '\x1b[32m✓\x1b[0m'
          : r.outcome === 'cancelled'
            ? '\x1b[2m⊘\x1b[0m'
            : '\x1b[31m✗\x1b[0m';
      const by = r.actor ? link(`@${r.actor}`, `https://github.com/${r.actor}`) : '';
      console.log(
        `  ${mark} ${(r.outcome ?? '?').padEnd(11)} ${age}  ${who}  ${r.what || clip(r.displayTitle, 58)}`
      );
      console.log(`    \x1b[2m↳ ${by ? `${by} · ` : ''}${runLink}\x1b[0m`);
    }
  }
}

// Short names for the models people actually type; anything already shaped
// like a full id passes through so new releases need no code change here.
const MODEL_ALIASES: Record<string, string> = {
  fable: 'claude-fable-5',
  opus: 'claude-opus-5',
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5-20251001',
};

function resolveModel(name: string): string {
  const alias = MODEL_ALIASES[name.toLowerCase()];
  if (alias !== undefined) return alias;
  if (name.startsWith('claude-')) return name;
  die(`unknown model: ${name} (use ${Object.keys(MODEL_ALIASES).join('/')} or a full claude-* id)`);
}

async function dispatchAsync(args: string[]): Promise<void> {
  let target = '';
  // auto matches the comment path: an issue gets a fix attempt, a pull request
  // does not. Passing false here instead would mean `et verify <issue>` silently
  // behaved differently from commenting `/verify` on that same issue.
  let fix: 'auto' | 'yes' | 'no' = 'auto';
  let watch = false;
  let retry = false;
  let model: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (arg === '--fix') fix = 'yes';
    else if (arg === '--no-fix') fix = 'no';
    else if (arg === '--retry') retry = true;
    else if (arg === '--watch') watch = true;
    else if (arg === '--model') {
      const value = args[++i];
      if (value === undefined) die('--model needs a value (try --help)');
      model = resolveModel(value);
    } else if (arg.startsWith('--model=')) {
      model = resolveModel(arg.slice('--model='.length));
    } else if (MODEL_ALIASES[arg.slice(2)] !== undefined) {
      // Per-model shorthand, mirroring the comment path: --fable, --opus, …
      model = MODEL_ALIASES[arg.slice(2)];
    } else if (arg.startsWith('-')) die(`unknown flag: ${arg} (try --help)`);
    else target = parseTarget(arg);
  }

  if (!target) die('need an issue or pull request number (try --help)');

  spinner = new Spinner();

  // Fail with something actionable rather than a dispatch that vanishes.
  spinner.start('checking gh auth');
  try {
    await run('gh', 'auth', 'status');
  } catch {
    die('gh is not installed or not authenticated (try: gh auth login)');
  }

  spinner.set(`looking up ${REPO}#${target}`);
  let title: string;
  try {
    title = await run(
      'gh',
      'issue',
      'view',
      target,
      '-R',
      REPO,
      '--json',
      'title,state',
      '--jq',
      '"\\(.title)  [\\(.state)]"'
    );
  } catch {
    die(`${REPO}#${target} not found, or you cannot see it`);
  }

  spinner.stop();
  console.log(`→ ${REPO}#${target}  ${title}`);
  console.log(
    `  fix mode: ${fix}${model !== undefined ? ` · model: ${model}` : ''}${retry ? ' · retry: update previous findings comment' : ''} · quiet: no comments until findings`
  );

  // gh gives no run id back from a dispatch, so remember what was newest first.
  spinner.start('dispatching the workflow');
  const before = await latestRunId();

  try {
    await run(
      'gh',
      'workflow',
      'run',
      WORKFLOW,
      '--repo',
      REPO,
      '-f',
      `target=${target}`,
      '-f',
      `fix=${fix}`,
      // Only when asked: an older workflow without the input rejects it.
      ...(model !== undefined ? ['-f', `model=${model}`] : []),
      ...(retry ? ['-f', 'retry=true'] : [])
    );
  } catch (e) {
    die(
      `dispatch failed: ${e instanceof Error ? e.message : String(e)}\n` +
        '  (the workflow_dispatch trigger has to be on the default branch' +
        (model !== undefined
          ? ", and --model needs the workflow's `model` input to be on main"
          : '') +
        ')'
    );
  }

  // GitHub takes a few seconds to materialise the run, so this wait is the
  // normal case rather than a symptom — say so, or it reads as a hang.
  spinner.set('dispatched · waiting for GitHub to start the run');
  let runId: string | null = null;
  for (let i = 0; i < 20 && !runId; i++) {
    await sleep(3000);
    const candidate = await latestRunId();
    if (candidate && candidate !== before) runId = candidate;
  }

  if (!runId) {
    spinner.stop(
      `  dispatched, but no new run appeared within 60s — check\n` +
        `  https://github.com/${REPO}/actions/workflows/${WORKFLOW}`
    );
    return;
  }

  const url = `https://github.com/${REPO}/actions/runs/${runId}`;
  spinner.stop(`  ✓ running · ${url}`);

  if (watch) {
    // --exit-status makes gh exit non-zero on a failed run; that is information,
    // not a reason to stop, so it is swallowed and the outcome printed instead.
    await run('gh', 'run', 'watch', runId, '--repo', REPO, '--exit-status').catch(() => {});
    const conclusion = await run(
      'gh',
      'api',
      `repos/${REPO}/actions/runs/${runId}`,
      '--jq',
      '.conclusion'
    ).catch(() => 'unknown');
    console.log(`\nrun ${conclusion}`);
    const last = await run(
      'gh',
      'api',
      `repos/${REPO}/issues/${target}/comments`,
      '--jq',
      '.[-1] | "  \\(.user.login): \\(.body[0:300])"'
    ).catch(() => '  (could not read comments)');
    console.log(`latest comment on #${target}:\n${last}`);
  }
}
