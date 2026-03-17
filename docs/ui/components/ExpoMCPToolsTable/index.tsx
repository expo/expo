import { Fragment } from 'react';

import { Cell, Row, Table } from '~/ui/components/Table';
import { CODE } from '~/ui/components/Text';

import mcpData from './data/expo-mcp-tools.json';

type MCPTool = {
  name: string;
  description: string;
  examplePrompt: string;
  availability: string;
  requirements?: string;
};

type MCPPrompt = {
  name: string;
  description: string;
  availability: string;
  requirements?: string;
};

type MCPData = {
  tools: MCPTool[];
  prompts: MCPPrompt[];
};

const data: MCPData = mcpData;

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

function formatAvailability(tool: { availability: string; requirements?: string }) {
  if (tool.requirements) {
    return `${tool.availability} (${tool.requirements})`;
  }
  return tool.availability;
}

export function ExpoMCPToolsTable() {
  return (
    <Table headers={['Tool', 'Description', 'Example Prompt', 'Availability']}>
      {data.tools.map(tool => (
        <Row key={tool.name}>
          <Cell>
            <CODE>{tool.name}</CODE>
          </Cell>
          <Cell>{renderDescription(tool.description)}</Cell>
          <Cell>"{tool.examplePrompt}"</Cell>
          <Cell>{formatAvailability(tool)}</Cell>
        </Row>
      ))}
    </Table>
  );
}

export function ExpoMCPPromptsTable() {
  return (
    <Table headers={['Prompt', 'Description', 'Availability']}>
      {data.prompts.map(prompt => (
        <Row key={prompt.name}>
          <Cell>
            <CODE>{prompt.name}</CODE>
          </Cell>
          <Cell>{renderDescription(prompt.description)}</Cell>
          <Cell>{formatAvailability(prompt)}</Cell>
        </Row>
      ))}
    </Table>
  );
}
