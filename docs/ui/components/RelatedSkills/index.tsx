import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';

import { BoxLink } from '~/ui/components/BoxLink';
import expoSkillsData from '~/ui/components/ExpoSkillsTable/data/expo-skills.json';
import { renderDescription } from '~/ui/components/utils/renderDescription';

type Skill = {
  name: string;
  category: string;
  description: string;
  githubUrl: string;
};

type RelatedSkillsProps = {
  names: string[];
  descriptions?: Record<string, string>;
};

function firstSentence(description: string) {
  const [sentence] = description.split('. ');
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

export function RelatedSkills({ names, descriptions }: RelatedSkillsProps) {
  const skills = names
    .map(name => (expoSkillsData.skills as Skill[]).find(skill => skill.name === name))
    .filter((skill): skill is Skill => skill !== undefined);

  return (
    <>
      {skills.map(skill => (
        <BoxLink
          key={skill.name}
          title={skill.name}
          description={renderDescription(
            descriptions?.[skill.name] ?? firstSentence(skill.description)
          )}
          href={skill.githubUrl}
          Icon={GithubIcon}
        />
      ))}
    </>
  );
}
