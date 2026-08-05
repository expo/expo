import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.unstable_mockModule('~/ui/components/ExpoSkillsTable/data/expo-skills.json', () => ({
  default: {
    source: {
      repo: 'expo/skills',
      url: 'https://api.github.com/repos/expo/skills/contents/plugins/expo/skills',
      fetchedAt: '2026-01-01T00:00:00.000Z',
    },
    totalSkills: 4,
    skills: [
      {
        name: 'skill-with-code',
        category: 'framework',
        description:
          'Scaffold from the repo of ~70 `with-*` integrations (Stripe and more). Use when adapting canonical patterns.',
        githubUrl:
          'https://github.com/expo/skills/blob/main/plugins/expo/skills/skill-with-code/SKILL.md',
      },
      {
        name: 'skill-multi-sentence',
        category: 'eas',
        description: 'Build things quickly. Use this when the user asks for things.',
        githubUrl:
          'https://github.com/expo/skills/blob/main/plugins/expo/skills/skill-multi-sentence/SKILL.md',
      },
      {
        name: 'skill-single-sentence',
        category: 'framework',
        description: 'Set up a single thing.',
        githubUrl:
          'https://github.com/expo/skills/blob/main/plugins/expo/skills/skill-single-sentence/SKILL.md',
      },
      {
        name: 'skill-no-period',
        category: 'framework',
        description: 'Trailing period is missing',
        githubUrl:
          'https://github.com/expo/skills/blob/main/plugins/expo/skills/skill-no-period/SKILL.md',
      },
    ],
  },
}));

const { RelatedSkills } = await import('.');

describe('RelatedSkills', () => {
  it('renders a card per skill linking to its SKILL.md', () => {
    render(<RelatedSkills names={['skill-multi-sentence', 'skill-single-sentence']} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      'href',
      'https://github.com/expo/skills/blob/main/plugins/expo/skills/skill-multi-sentence/SKILL.md'
    );
    expect(screen.getByText('skill-multi-sentence')).toBeInTheDocument();
    expect(screen.getByText('skill-single-sentence')).toBeInTheDocument();
  });

  it('preserves the order of the names prop', () => {
    render(<RelatedSkills names={['skill-single-sentence', 'skill-multi-sentence']} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('skill-single-sentence');
    expect(links[1]).toHaveTextContent('skill-multi-sentence');
  });

  it('skips names that are not in the skills data', () => {
    render(<RelatedSkills names={['does-not-exist', 'skill-single-sentence']} />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByText('does-not-exist')).not.toBeInTheDocument();
  });

  it('renders nothing when no names match', () => {
    render(<RelatedSkills names={['does-not-exist']} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('truncates a multi-sentence description to its first sentence', () => {
    render(<RelatedSkills names={['skill-multi-sentence']} />);

    expect(screen.getByText('Build things quickly.')).toBeInTheDocument();
    expect(screen.queryByText(/Use this when the user asks/)).not.toBeInTheDocument();
  });

  it('keeps a single-sentence description intact', () => {
    render(<RelatedSkills names={['skill-single-sentence']} />);

    expect(screen.getByText('Set up a single thing.')).toBeInTheDocument();
  });

  it('adds a trailing period when the description has none', () => {
    render(<RelatedSkills names={['skill-no-period']} />);

    expect(screen.getByText('Trailing period is missing.')).toBeInTheDocument();
  });

  it('uses a custom description from the descriptions prop', () => {
    render(
      <RelatedSkills
        names={['skill-multi-sentence']}
        descriptions={{ 'skill-multi-sentence': 'Custom short line.' }}
      />
    );

    expect(screen.getByText('Custom short line.')).toBeInTheDocument();
    expect(screen.queryByText('Build things quickly.')).not.toBeInTheDocument();
  });

  it('renders backtick spans in a synced description as code', () => {
    const { container } = render(<RelatedSkills names={['skill-with-code']} />);

    const code = screen.getByText('with-*');
    expect(code.tagName).toBe('CODE');
    expect(container.textContent).not.toContain('`');
  });

  it('renders backtick spans in a custom description as code', () => {
    const { container } = render(
      <RelatedSkills
        names={['skill-single-sentence']}
        descriptions={{ 'skill-single-sentence': 'Configure `expo-observe` quickly.' }}
      />
    );

    const code = screen.getByText('expo-observe');
    expect(code.tagName).toBe('CODE');
    expect(container.textContent).not.toContain('`');
  });

  it('falls back to the first sentence for skills without a custom description', () => {
    render(
      <RelatedSkills
        names={['skill-multi-sentence', 'skill-single-sentence']}
        descriptions={{ 'skill-multi-sentence': 'Custom short line.' }}
      />
    );

    expect(screen.getByText('Custom short line.')).toBeInTheDocument();
    expect(screen.getByText('Set up a single thing.')).toBeInTheDocument();
  });
});
