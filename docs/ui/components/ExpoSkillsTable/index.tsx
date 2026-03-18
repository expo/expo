import { Cell, Row, Table } from '~/ui/components/Table';
import { A, CODE } from '~/ui/components/Text';
import { renderDescription } from '~/ui/components/utils/renderDescription';

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
