import { Fragment } from 'react';

import { Cell, Row, Table } from '~/ui/components/Table';
import { A, CODE } from '~/ui/components/Text';

import expoSkillsData from './data/expo-skills.json';

type Skill = {
  name: string;
  description: string;
  githubUrl: string;
};

type ExpoSkillsData = {
  skills: Skill[];
};

const data: ExpoSkillsData = expoSkillsData;

/**
 * Renders inline backtick-wrapped text as <CODE> elements.
 */
function renderDescription(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <CODE key={i}>{part.slice(1, -1)}</CODE>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ExpoSkillsTable() {
  return (
    <Table headers={['Skill', 'Description']}>
      {data.skills.map(skill => (
        <Row key={skill.name}>
          <Cell>
            <A href={skill.githubUrl}>
              <CODE>{skill.name}</CODE>
            </A>
          </Cell>
          <Cell>{renderDescription(skill.description)}</Cell>
        </Row>
      ))}
    </Table>
  );
}
