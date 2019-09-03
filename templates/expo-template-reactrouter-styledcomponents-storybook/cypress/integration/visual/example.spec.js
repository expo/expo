context('Visual Regression', () => {
  it('renders as expected', () => {
    cy.visit('/');
    cy.matchesBaselineScreenshot('sample-test');
  });
});
