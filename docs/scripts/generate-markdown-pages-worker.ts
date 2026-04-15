/**
 * Worker thread for generate-markdown-pages.ts.
 * Receives { type: 'task', htmlPath } messages, converts HTML → Markdown, writes .md file.
 * Sends back { type: 'result', htmlPath, status, warnings? } messages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

import {
  checkMarkdownQuality,
  convertMdxInstructionToMarkdown,
  convertHtmlToMarkdown,
  extractFrontmatter,
  findMdxSource,
  type ResolvedMdxImport,
} from './generate-markdown-pages-utils.ts';
import { SCENE_PAGES } from './scene-page-manifest.ts';

const outDir: string = workerData.outDir;
const pagesDir: string = workerData.pagesDir;
const SCENE_MODE_HEADING = '## How would you like to develop?';
const NEXT_STEP_HEADING = '## Next step';

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function getFirstH2Heading(markdown: string): string | null {
  const match = markdown.match(/^##\s+.+$/m);
  return match ? match[0].trim() : null;
}

function shiftHeadingLevels(markdown: string, levelOffset: number): string {
  const lines = markdown.split('\n');
  let inFence = false;

  return lines
    .map(line => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }

      if (inFence) {
        return line;
      }

      const headingMatch = line.match(/^(\s*)(#{1,6})(\s+.*)$/);
      if (!headingMatch) {
        return line;
      }

      const indent = headingMatch[1];
      const heading = headingMatch[2];
      const suffix = headingMatch[3];
      const nextLevel = Math.min(6, heading.length + levelOffset);
      return `${indent}${'#'.repeat(nextLevel)}${suffix}`;
    })
    .join('\n');
}

function findSceneSectionStart(
  markdown: string,
  defaultHeading: string | null,
  nextStepIdx: number
): number {
  if (defaultHeading) {
    const withLeadingNewline = `\n${defaultHeading}`;
    let byHeading = markdown.indexOf(withLeadingNewline);
    if (byHeading === -1 && markdown.startsWith(defaultHeading)) {
      byHeading = 0;
    }
    if (byHeading !== -1 && (nextStepIdx === -1 || byHeading < nextStepIdx)) {
      return byHeading;
    }
  }

  const modeHeadingIdx = markdown.indexOf(SCENE_MODE_HEADING);
  if (modeHeadingIdx === -1) {
    return -1;
  }

  const headingRegex = /\n##\s+.+/g;
  headingRegex.lastIndex = modeHeadingIdx + SCENE_MODE_HEADING.length;
  const sceneHeadingMatch = headingRegex.exec(markdown);
  if (!sceneHeadingMatch) {
    return -1;
  }
  if (nextStepIdx !== -1 && sceneHeadingMatch.index >= nextStepIdx) {
    return -1;
  }
  return sceneHeadingMatch.index;
}

function injectSceneVariants(
  baseMarkdown: string,
  sceneSections: string[],
  defaultHeading: string | null
) {
  if (sceneSections.length === 0) {
    return baseMarkdown;
  }

  const nextStepNeedle = `\n${NEXT_STEP_HEADING}`;
  const nextStepIdx = baseMarkdown.indexOf(nextStepNeedle);
  const sceneStartIdx = findSceneSectionStart(baseMarkdown, defaultHeading, nextStepIdx);
  const sceneBlock = sceneSections.join('\n\n---\n\n');

  if (sceneStartIdx !== -1 && nextStepIdx !== -1 && sceneStartIdx < nextStepIdx) {
    const before = baseMarkdown.slice(0, sceneStartIdx).trimEnd();
    const after = baseMarkdown.slice(nextStepIdx).trimStart();
    return `${before}\n\n${sceneBlock}\n\n${after}`;
  }

  if (sceneStartIdx !== -1 && nextStepIdx === -1) {
    const before = baseMarkdown.slice(0, sceneStartIdx).trimEnd();
    return `${before}\n\n${sceneBlock}\n`;
  }

  if (nextStepIdx !== -1) {
    const before = baseMarkdown.slice(0, nextStepIdx).trimEnd();
    const after = baseMarkdown.slice(nextStepIdx).trimStart();
    return `${before}\n\n${sceneBlock}\n\n${after}`;
  }

  return `${baseMarkdown.trimEnd()}\n\n${sceneBlock}\n`;
}

parentPort!.on('message', (msg: { type: string; htmlPath?: string }) => {
  if (msg.type === 'done') {
    process.exit(0);
  }

  if (msg.type === 'task') {
    const htmlPath = msg.htmlPath!;
    const relHtmlPath = toPosixPath(path.relative(outDir, htmlPath));
    const html = fs.readFileSync(htmlPath, 'utf-8');
    let markdown = convertHtmlToMarkdown(html);

    const scenePage = SCENE_PAGES.find(page => page.htmlPath === relHtmlPath);
    if (scenePage) {
      const sceneSections: string[] = [];
      let defaultVariantHeading: string | null = null;

      for (const variant of scenePage.variants) {
        const absoluteMdxPath = path.join(process.cwd(), variant.mdxPath);
        if (!fs.existsSync(absoluteMdxPath)) {
          continue;
        }

        const mdxContent = fs.readFileSync(absoluteMdxPath, 'utf-8');
        const variantMarkdown = convertMdxInstructionToMarkdown(
          mdxContent,
          (importPath, fromPath): ResolvedMdxImport | null => {
            const basePath = fromPath ? path.dirname(fromPath) : path.dirname(absoluteMdxPath);
            const resolvedPath = path.resolve(basePath, importPath);
            if (!resolvedPath.endsWith('.mdx') || !fs.existsSync(resolvedPath)) {
              return null;
            }
            return {
              content: fs.readFileSync(resolvedPath, 'utf-8'),
              resolvedPath,
            };
          },
          {
            fromPath: absoluteMdxPath,
            visitedPaths: new Set([absoluteMdxPath]),
          }
        ).trim();

        if (!variantMarkdown) {
          continue;
        }

        defaultVariantHeading ??= getFirstH2Heading(variantMarkdown);

        const nestedMarkdown = shiftHeadingLevels(variantMarkdown, 1);
        sceneSections.push(`## ${variant.heading}\n\n${nestedMarkdown}`);
      }

      markdown = injectSceneVariants(markdown, sceneSections, defaultVariantHeading);
    }

    // Prepend frontmatter from the MDX source file if available
    const mdxPath = findMdxSource(htmlPath, outDir, pagesDir);
    if (mdxPath) {
      const frontmatter = extractFrontmatter(mdxPath);
      if (frontmatter) {
        markdown = frontmatter + '\n' + markdown;
      }
    }

    const warnings = checkMarkdownQuality(markdown, relHtmlPath);

    const mdPath = path.join(path.dirname(htmlPath), 'index.md');
    fs.writeFileSync(mdPath, markdown);

    parentPort!.postMessage({
      type: 'result',
      htmlPath,
      status: 'generated',
      warnings: warnings.length > 0 ? warnings.map(w => `${relHtmlPath}: ${w}`) : undefined,
    });
  }
});
