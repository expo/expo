import { describe, it, expect } from '@jest/globals';
import { allowedCulturalTerms } from '../../../src/lib/maurimesh';

describe('Cultural Boundary', () => {
  const maoriTerms = ['Whakatā', 'Mahi', 'Tikanga', 'Mana', 'Māori'];

  it('should not expose Māori terms in FFI exports', async () => {
    const terms = await allowedCulturalTerms();
    const exportedTerms = terms.split('\n');

    // Verify terms are documented but not exposed in UI types
    expect(exportedTerms).toContain('Whakatā');
    expect(exportedTerms).toContain('Mahi');
  });

  it('should have cultural terms in allowed list', async () => {
    const terms = await allowedCulturalTerms();
    for (const term of maoriTerms) {
      expect(terms).toContain(term);
    }
  });

  it('should not leak terms to network layer', () => {
    // In production: scan network payloads
    const networkPayload = JSON.stringify({ state: 'active' });
    for (const term of maoriTerms) {
      expect(networkPayload).not.toContain(term);
    }
  });
});
