import { Cell, Row, Table } from '~/ui/components/Table';
import { CODE } from '~/ui/components/Text';
import { renderDescription } from '~/ui/components/utils/renderDescription';

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
          <Cell>{renderDescription(formatAvailability(tool))}</Cell>
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
          <Cell>{renderDescription(formatAvailability(prompt))}</Cell>
        </Row>
      ))}
    </Table>
  );
}
