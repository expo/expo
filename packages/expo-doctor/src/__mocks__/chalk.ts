// Mocking chalk to return unstyled strings makes it easier to test text output
// explainDependencies uses chalk's inline styling, hence the need to mock it as a function
// and a set of member functions.

type ChalkMock = jest.Mock<string, [string]> & {
  green?: jest.Mock<string, [string]>;
  red?: jest.Mock<string, [string]>;
  yellow?: jest.Mock<string, [string]>;
  underline?: jest.Mock<string, [string]>;
  bold?: jest.Mock<string, [string]>;
};

const green = jest.fn((str) => str);
const red = jest.fn((str) => str);
const yellow = jest.fn((str) => str);
const underline = jest.fn((str) => str);
const bold = jest.fn((str) => str);

const chalk: ChalkMock = jest.fn((str) => str);
chalk.green = green;
chalk.red = red;
chalk.yellow = yellow;
chalk.underline = underline;
chalk.bold = bold;

export default chalk;
