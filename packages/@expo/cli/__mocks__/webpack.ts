const webpack = jest.fn();

// @ts-expect-error
webpack.ProgressPlugin = jest.fn();

export default webpack;
