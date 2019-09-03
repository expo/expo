Cypress.Commands.add('matchesBaselineScreenshot', (name, { viewports = ['mobile', 'desktop'], selector = 'body' } = {}) => {
  const viewportPresets = {
    mobile: 'iphone-6',
    tablet: 'ipad-2',
    desktop: 'macbook-15'
  };

  viewports.forEach((viewport) => {
    cy.viewport(viewportPresets[viewport])
      .wait(400) // avoid capturing resize flickers
      .get(selector)
      .then(() => {
        cy.matchImageSnapshot(`${name}-${viewport}`);
      });
  });
})
