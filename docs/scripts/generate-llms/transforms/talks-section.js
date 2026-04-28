/**
 * Adds an "Additional Resources" section to llms.txt with content that doesn't
 * live in the docs nav: conference talks, podcasts, live streams, and YouTube
 * tutorials. The source of truth is `public/static/talks.ts` (consumed by the
 * /additional-resources page). We transpile it to `talks.js` at generation
 * time so this script can `import` it without a TypeScript runtime.
 *
 * Isolated from llms-txt.js so the talks list can grow (more types, different
 * URL shapes) without touching the orchestrator script.
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const TALKS_TS_PATH = path.join(process.cwd(), 'public/static/talks.ts');
const TALKS_JS_PATH = path.join(process.cwd(), 'scripts/generate-llms/talks.js');

function generateVideoUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function processTalks(talks, type = 'video') {
  return talks.map(talk => {
    if (type === 'podcast' && talk.link) {
      return {
        title: talk.title,
        url: talk.link,
      };
    }

    return {
      title: talk.title,
      url: talk.videoId ? generateVideoUrl(talk.videoId) : '',
    };
  });
}

function compileTalksFile() {
  const inputFileContent = fs.readFileSync(TALKS_TS_PATH, 'utf8');
  const outputFileContent = ts.transpileModule(inputFileContent, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
  }).outputText;

  fs.writeFileSync(TALKS_JS_PATH, outputFileContent, 'utf8');
  console.log(` \x1b[1m\x1b[32m✓\x1b[0m Successfully compiled talks.ts to talks.js`);
}

export async function buildTalksSections() {
  compileTalksFile();
  const { TALKS, PODCASTS, LIVE_STREAMS, YOUTUBE_VIDEOS } = await import('../talks.js');
  return [
    {
      title: 'Conference Talks',
      items: processTalks(TALKS),
      groups: [],
      sections: [],
    },
    {
      title: 'Podcasts',
      items: processTalks(PODCASTS, 'podcast'),
      groups: [],
      sections: [],
    },
    {
      title: 'Live Streams',
      items: processTalks(LIVE_STREAMS),
      groups: [],
      sections: [],
    },
    {
      title: 'YouTube Tutorials',
      items: processTalks(YOUTUBE_VIDEOS),
      groups: [],
      sections: [],
    },
  ];
}
