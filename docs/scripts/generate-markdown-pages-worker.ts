/**
 * Worker thread for generate-markdown-pages.ts.
 * Receives { type: 'task', htmlPath } messages, converts HTML → Markdown, writes .md file.
 * Sends back { type: 'result', htmlPath, status, warnings? } messages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

import {
  buildFeedbackSection,
  buildPageSpecificNote,
  shouldAppendAgentInstructions,
  urlPathFromHtmlPath,
  wrapAgentInstructions,
} from './agent-instructions.ts';
import { buildNavigationSection } from './docs-navigation.ts';
import {
  checkMarkdownQuality,
  convertMdxInstructionToMarkdown,
  convertHtmlToMarkdown,
  extractFrontmatter,
  findMdxSource,
  injectSceneVariants,
  type ResolvedMdxImport,
} from './generate-markdown-pages-utils.ts';
import { SCENE_PAGES } from './scene-page-manifest.ts';

const outDir: string = workerData.outDir;
const pagesDir: string = workerData.pagesDir;

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

parentPort!.on('message', (msg: { type: string; htmlPath?: string }) => {
  if (msg.type === 'done') {
    process.exit(0);
  }

  if (msg.type === 'task') {
    const htmlPath = msg.htmlPath!;
    const relHtmlPath = toPosixPath(path.relative(outDir, htmlPath));
    const html = fs.readFileSync(htmlPath, 'utf-8');
    let markdown = convertHtmlToMarkdown(html);

    const sceneWarnings: string[] = [];
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

      const sceneResult = injectSceneVariants(
        markdown,
        sceneSections,
        defaultVariantHeading,
        scenePage.endHeading ?? null
      );
      markdown = sceneResult.markdown;
      if (sceneResult.warning) {
        sceneWarnings.push(sceneResult.warning);
      }
    }

    const warnings = [...sceneWarnings, ...checkMarkdownQuality(markdown, relHtmlPath)];

    const mdxPath = findMdxSource(htmlPath, outDir, pagesDir);
    const frontmatter = mdxPath ? extractFrontmatter(mdxPath) : null;
    const pathname = urlPathFromHtmlPath(relHtmlPath);
    const instructionSections: string[] = [];
    if (shouldAppendAgentInstructions(markdown)) {
      instructionSections.push(buildFeedbackSection(pathname));
    }
    const navigationSection = buildNavigationSection(pathname);
    if (navigationSection) {
      instructionSections.push(navigationSection);
    }
    const agentInstructions =
      instructionSections.length > 0 ? wrapAgentInstructions(instructionSections) : null;
    const pageNote = buildPageSpecificNote(pathname);

    const parts: string[] = [];
    if (frontmatter) {
      parts.push(frontmatter);
    }
    if (pageNote) {
      parts.push(pageNote);
    }
    if (agentInstructions) {
      parts.push(agentInstructions);
    }
    parts.push(markdown);
    markdown = parts.join('\n');

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
