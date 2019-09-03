context('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  })

  it('has a navigation with 2 items', () => {
    cy
      .get('.css-view-1dbjc4n .sc-AykKC')
      .find('a')
      .as('navItems')
      .should('have.length', 2);
  });
});
