import { expect } from '@jest/globals';
import jestAxe from 'jest-axe';

expect.extend(jestAxe.toHaveNoViolations);
