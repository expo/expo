/**
 * Dispatch expo/expo's `/verify` workflow quietly.
 *
 *   et verify                  status (in flight, recent, fork)
 *   et verify status           same
 *   et verify dispatch 48780   same as `et verify 48780`
 *   et verify 48780            fix mode follows the comment path (issue yes, PR no)
 *   et verify '#48780'         same; quote the # or the shell eats it
 *   et verify https://github.com/expo/expo/issues/48780
 *   et verify 48780 --fix      force a fix pull request attempt
 *   et verify 48780 --no-fix   force report-only
 *   et verify 48780 --retry    update the thread's previous findings comment in place
 *   et verify 48780 --watch    dispatch, then follow it until it finishes
 *   et verify 48780 --runner eas   run on EAS Workflows instead of GHA
 *
 * Why this exists rather than commenting `/verify` on the thread: the comment
 * path posts an eyes reaction and a "started" comment, and on a failure a
 * "did not finish" notice. Every one of those reaches the inbox of everyone
 * subscribed to a stranger's pull request. The dispatch path posts nothing
 * until the findings themselves, so a run that finds nothing leaves no trace.
 *
 * The command keeps its own argument grammar (subcommands + flags), so it is
 * registered with allowUnknownOption and parses the raw argv itself.
 *
 * Since the @expo/verify engine cutover (expo-sandbox-mcp LLP 0020), dispatch,
 * status, and ls are thin delegations to `npx @expo/verify` running against this
 * repo's .expo-agents/verify/ profile — the engine is where run resolution and dispatch
 * live now, shared by every repo that adopts it. Only `roundup` (expo policy:
 * emoji conventions, verify/ branch scoping, cost tables) still runs here.
 */

import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
// Used only by `roundup --include-costs` (transcript artifacts land in a
// temp dir on their way through unzip).
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getExpoRepositoryRootDir } from '../Directories';

const REPO = 'expo/expo';
// Quiet dispatch targets the thin @expo/verify runner (expo-sandbox-mcp
// LLP 0020 P1c cutover). The comment path (/verify in a thread) still runs
// agent-commands.yml until the gate ports into the engine; to dispatch the
// legacy pipeline manually: gh workflow run agent-commands.yml -f target=N.
const WORKFLOW = 'verify.yml';
const HELP = `verify — dispatch expo/expo's /verify workflow without commenting on the thread

  et verify                    status (in flight, recent, fork)
  et verify status             same
  et verify dispatch <n>       same as \`et verify <n>\`
  et verify <n>                issue or PR number (also '#<n>' — quote it — or an expo/expo issue/PR URL)
  et verify <n> --fix          force a fix pull request attempt
  et verify <n> --no-fix       force report-only
  et verify <n> --retry        re-run and UPDATE the thread's latest findings
                            comment in place instead of posting a new one
                            (falls back to a new comment if none exists;
                            same flag works in comments: "/verify --retry")
  et verify <n> --watch        follow the run until it finishes
  et verify <n> --runner eas   run on EAS Workflows instead of GitHub Actions
                            (the engine's --runner; also --dry-run for a shadow run)
  et verify <n> --model fable  override the agent model for this run
                            (fable/opus/sonnet/haiku, or a full claude-* id;
                            default: the workflow's VERIFY_MODEL var, else opus)
  et verify <n> --fable        shorthand for --model fable (also --opus,
                            --sonnet, --haiku; same flags work in comments:
                            "/verify --fable")
  et verify ls                 what is in flight, and which issue/PR each run is for
  et verify roundup            digest of recent agent activity (commands, PRs, comments)
  et verify roundup --period day|week|month|all [--limit n]
                            span for the digest (default week; see verify roundup --help)

Posts nothing to the thread until the findings themselves.`;

const LS_HELP = `verify ls — verifications currently running or queued

  et verify ls                 one line per in-flight run: state, age, title, URL

The title carries the target ("verify #48780 — actor") for runs dispatched
since the @expo/verify cutover; older runs show the bare workflow name.

Capacity is enforced server-side now: the scoped-token mint holds one slot
per target (a second dispatch for a target with a run in flight is refused)
and caps runs deployment-wide, sized to the sandbox pool. There is no
per-slot concurrency group anymore. Runs appear here within seconds of
dispatch; \`et verify status\` shows recent finished runs too.`;

const STATUS_HELP = `verify status — one screen to see if verification is healthy

  et verify
  et verify status

Shows every run still in flight (and any that are queued), a tally plus the
latest finished runs (skipped comment-gate jobs hidden), how far
expo-bot/expo is behind expo/expo main, and the last fork-sync job if that
workflow exists. In flight and recent runs come from the engine (\`verify status\`).`;

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

function die(message: string): never {
  spinner?.stop();
  console.error(`verify: ${message}`);
  process.exit(1);
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
      "Dispatch expo/expo's /verify workflow quietly, or inspect verification runs (status / ls / roundup)."
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
  if (argv.includes('status')) return STATUS_HELP;
  return HELP;
}

// The engine that owns dispatch/status/ls now: @expo/verify, pinned to the
// same version the repo's verify.yml runs (expo-sandbox-mcp LLP 0020 / the
// engine's LLP 0001). et verify keeps its entry point and grammar; these
// subcommands exec the engine with the repo's .expo-agents/verify/ profile. roundup
// stays native here — it is expo policy (emoji conventions, branch scoping,
// cost tables) the engine has not absorbed yet.
const ENGINE_VERSION = process.env.VERIFY_ENGINE_VERSION || '0.10.2';

async function delegateToEngine(engineArgs: string[]): Promise<never> {
  // The profile's home is .expo-agents/verify/ (engine 0.9.0); the engine itself
  // falls back to a legacy .verify/, and so does this.
  const root = getExpoRepositoryRootDir();
  const configDir =
    ['.expo-agents/verify', '.verify']
      .map((dir) => join(root, dir))
      .find((dir) => existsSync(join(dir, 'config.jsonc'))) ?? join(root, '.expo-agents/verify');
  const result = await spawnAsync(
    'npx',
    [
      '--yes',
      '-p',
      `@expo/verify@${ENGINE_VERSION}`,
      'verify',
      ...engineArgs,
      '--config-dir',
      configDir,
    ],
    { stdio: 'inherit' }
  ).catch((error: { status?: number }) => ({ status: error.status ?? 1 }));
  process.exit(result.status ?? 0);
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
    await delegateToEngine(['ls']);
  }

  if (args[0] === 'roundup') {
    if (wantsHelp) {
      console.log(ROUNDUP_HELP);
      return;
    }
    await showRoundup(parseRoundupArgs(args.slice(1)));
    return;
  }

  if (args[0] === 'status') {
    if (wantsHelp) {
      console.log(STATUS_HELP);
      return;
    }
    if (args.slice(1).some((a) => a !== '-h' && a !== '--help')) {
      die('status takes no extra arguments (try --help)');
    }
    await delegateToEngine(['status']);
  }

  if (args.length === 0) {
    await delegateToEngine(['status']);
  }

  if (wantsHelp) {
    console.log(HELP);
    return;
  }

  // Dispatch grammar is identical between et verify and the engine
  // (target forms, --fix/--no-fix, --retry, --watch, --model/shorthands),
  // so argv passes through; the engine's target parser refuses non-expo
  // URLs exactly as parseTarget() did. `et verify dispatch <n>` and
  // `et verify <n>` are the same command.
  const dispatchArgs = args[0] === 'dispatch' ? args.slice(1) : args;
  await delegateToEngine(['dispatch', ...dispatchArgs]);
}

function paint(code: string, s: string): string {
  return USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s;
}
