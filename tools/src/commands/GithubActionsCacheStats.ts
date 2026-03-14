import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

export default (program: Command) => {
  program
    .command('github-actions-cache-stats')
    .alias('gacs')
    .description('Prints cache stats for GitHub Actions caching.')
    .option('-s, --sort <type>', 'Sort by: key, size, created, accessed', 'key')
    .option('-r, --ref <filter>', 'Filter by git ref (branch/tag)')
    .option('--highlight-once', 'Highlight caches accessed only at creation time')
    .option('--accessed-older-than <days>', 'Filter caches accessed older than X days')
    .option('--created-older-than <days>', 'Filter caches created older than X days')
    .option('--group-by-ref', 'Group by ref')
    .asyncAction(actionAsync);
};

type Options = {
  sort?: SortType;
  ref?: string;
  highlightOnce?: boolean;
  groupByRef?: boolean;
  accessedOlderThan?: string;
  createdOlderThan?: string;
};

type SortType = 'key' | 'size' | 'created' | 'accessed';

type CacheResponse = {
  total_count: number;
  actions_caches: CacheInfo[];
};

type CacheInfo = {
  id: number;
  key: string;
  ref: string;
  created_at: string;
  last_accessed_at: string;
  size_in_bytes: number;
};

type ProcessedCache = {
  key: string;
  ref: string;
  createdAt: string;
  lastAccessed: string;
  isOnce: boolean;
  sizeBytes: number;
  sizeMb: number;
  rawLastAccessed: Date;
  rawCreatedAt: Date;
};

async function actionAsync(options: Options) {
  try {
    const rawCaches = await fetchAllCaches();
    console.log('\n');
    let data = processRawData(rawCaches);
    data = filterCacheData(data, options);
    data = sortCacheData(data, options.sort);
    displayResults(data, options);
    printSummary(data, options.highlightOnce);
    process.exit(0);
  } catch (error: any) {
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}

async function fetchAllCaches(): Promise<CacheInfo[]> {
  const allCaches: CacheInfo[] = [];
  let page = 1;
  const GITHUB_API_PER_PAGE_LIMIT = 100;

  console.log(chalk.cyan(`Fetching cache data...`));

  let totalCount = 0;
  while (true) {
    const result = await spawnAsync('gh', [
      'api',
      `/repos/expo/expo/actions/caches?page=${page}&per_page=${GITHUB_API_PER_PAGE_LIMIT}`,
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
    ]);

    const parsed: CacheResponse = JSON.parse(result.stdout);
    totalCount = parsed.total_count;
    const newItems = parsed.actions_caches;
    if (!newItems || newItems.length === 0) {
      break;
    }
    allCaches.push(...newItems);

    process.stdout.write(`\rCollected ${allCaches.length} of ${totalCount}...`);
    page++;
    if (allCaches.length >= totalCount) {
      break;
    }
  }

  // Remove potential duplicates - There might be a race condition when the same cache is returned on two different pages due to new caches being created during pagination.
  const idCacheMap = new Map(allCaches.map((item) => [item.id, item]));
  return Array.from(idCacheMap.values());
}

function processRawData(rawCaches: CacheInfo[]): ProcessedCache[] {
  return rawCaches.map((i) => {
    const formattedCreated = i.created_at.replace('T', ' ').substring(0, 16);
    const formattedAccessed = i.last_accessed_at.replace('T', ' ').substring(0, 16);
    const isOnce = formattedCreated === formattedAccessed;

    return {
      key: i.key,
      ref: i.ref,
      createdAt: formattedCreated,
      lastAccessed: formattedAccessed,
      rawLastAccessed: new Date(i.last_accessed_at),
      rawCreatedAt: new Date(i.created_at),
      isOnce,
      sizeBytes: i.size_in_bytes,
      sizeMb: parseFloat((i.size_in_bytes / (1024 * 1024)).toFixed(2)),
    };
  });
}

function filterCacheData(data: ProcessedCache[], options: Options): ProcessedCache[] {
  let filtered = data;

  if (options.ref) {
    const refFilter = options.ref;
    console.log(chalk.cyan(`Filtering caches by ref: ${refFilter}...`));
    filtered = filtered.filter((c) => c.ref.includes(refFilter));
  }

  if (options.accessedOlderThan) {
    const days = parseInt(options.accessedOlderThan, 10);
    console.log(chalk.cyan(`Filtering caches accessed older than ${days} days...`));

    if (!isNaN(days)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((c) => c.rawLastAccessed < cutoffDate);
    } else {
      console.log(
        chalk.yellow(`Invalid number of days: ${options.accessedOlderThan}. Skipping filter.`)
      );
    }
  }

  if (options.createdOlderThan) {
    const days = parseInt(options.createdOlderThan, 10);
    console.log(chalk.cyan(`Filtering caches created older than ${days} days...`));

    if (!isNaN(days)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((c) => c.rawCreatedAt < cutoffDate);
    } else {
      console.log(
        chalk.yellow(`Invalid number of days: ${options.createdOlderThan}. Skipping filter.`)
      );
    }
  }

  return filtered;
}

function sortCacheData(data: ProcessedCache[], sortType?: SortType): ProcessedCache[] {
  return data.sort((a, b) => {
    switch (sortType) {
      case 'size':
        return b.sizeBytes - a.sizeBytes;
      case 'created':
        return b.createdAt.localeCompare(a.createdAt);
      case 'accessed':
        return b.lastAccessed.localeCompare(a.lastAccessed);
      default:
        return a.key.localeCompare(b.key);
    }
  });
}

function displayResults(data: ProcessedCache[], options: Options) {
  if (options.groupByRef) {
    displayGroupedByRef(data, options.highlightOnce);
  } else {
    displayList(data, options.highlightOnce);
  }
}

function displayGroupedByRef(data: ProcessedCache[], highlightOnce?: boolean) {
  const grouped = data.reduce((acc: Record<string, ProcessedCache[]>, curr: ProcessedCache) => {
    const groupKey = curr.ref || 'unknown';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(curr);
    return acc;
  }, {});

  Object.keys(grouped).forEach((refKey) => {
    const groupItems = grouped[refKey];
    const groupSize = groupItems
      .reduce((acc: number, curr: ProcessedCache) => acc + curr.sizeMb, 0)
      .toFixed(2);

    console.log(
      chalk.bold.magenta(`\nRef: ${refKey} `) +
        chalk.gray(`(${groupItems.length} items, ${groupSize} MB)`)
    );
    displayList(groupItems, highlightOnce);
  });
}

function displayList(data: ProcessedCache[], highlightOnce?: boolean) {
  if (data.length === 0) {
    console.log(chalk.gray('No caches found.'));
    return;
  }

  // 40 is max width for the column and 3 is padding for "..." when truncating long keys
  const keyWidth = Math.min(Math.max(...data.map((d) => d.key.length)) + 3, 40);
  const refWidth = Math.min(Math.max(...data.map((d) => d.ref.length)) + 3, 40);
  const dateWidth = 16 + 2; // "YYYY-MM-DD HH:MM" + padding
  const sizeWidth = 10 + 2; // "XXXX.XX MB" + padding

  const header =
    'KEY'.padEnd(keyWidth) +
    'REF'.padEnd(refWidth) +
    'CREATED'.padEnd(dateWidth) +
    'ACCESSED'.padEnd(dateWidth) +
    'SIZE'.padStart(sizeWidth);

  console.log(chalk.bold.gray(header));
  console.log(chalk.gray('-'.repeat(header.length)));

  data.forEach((item) => {
    const displayKey =
      item.key.length > keyWidth - 3 ? item.key.substring(0, keyWidth - 4) + '...' : item.key;

    const displayRef =
      item.ref.length > refWidth - 3 ? item.ref.substring(0, refWidth - 4) + '...' : item.ref;

    const row =
      displayKey.padEnd(keyWidth) +
      displayRef.padEnd(refWidth) +
      item.createdAt.padEnd(dateWidth) +
      item.lastAccessed.padEnd(dateWidth) +
      (item.sizeMb.toFixed(2) + ' MB').padStart(sizeWidth);

    if (highlightOnce && item.isOnce) {
      console.log(chalk.yellow(row));
    } else {
      console.log(row);
    }
  });
}

function printSummary(data: ProcessedCache[], highlightOnce?: boolean) {
  const totalMB = data.reduce((acc, curr) => acc + curr.sizeMb, 0);
  const onceCount = data.filter((d) => d.isOnce).length;

  console.log(
    chalk.bold(`\nTOTAL: ${data.length} caches | Combined Size: ${totalMB.toFixed(2)} MB`)
  );

  if (highlightOnce) {
    console.log(
      chalk.yellow(`Found ${onceCount} caches accessed strictly within the creation minute.`)
    );
  }
}
