it(`resolves a workflow extension`, () => {
  expect(require('../workflow').default).toContain('workflow.ios');
});
