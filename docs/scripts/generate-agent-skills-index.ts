import frontmatter from 'front-matter';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_PATH = '/.well-known/agent-skills';
const SKILLS_DIRECTORY = path.join(process.cwd(), 'out', PUBLIC_PATH);
const INDEX_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const skills = fs
  .readdirSync(SKILLS_DIRECTORY, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()
  .map(directoryName => {
    const skillFile = fs.readFileSync(path.join(SKILLS_DIRECTORY, directoryName, 'SKILL.md'));
    const { attributes } = frontmatter<{ name: string; description: string }>(
      skillFile.toString('utf8')
    );

    return {
      name: attributes.name,
      type: 'skill-md',
      description: attributes.description,
      url: `${PUBLIC_PATH}/${directoryName}/SKILL.md`,
      digest: `sha256:${createHash('sha256').update(skillFile).digest('hex')}`,
    };
  });

fs.writeFileSync(
  path.join(SKILLS_DIRECTORY, 'index.json'),
  JSON.stringify({ $schema: INDEX_SCHEMA, skills }, null, 2) + '\n'
);

console.log(`Generated ${path.relative(process.cwd(), SKILLS_DIRECTORY)}/index.json`);
