#!/usr/bin/env node
import { logErrorAndExit, runExpoFeedbackAsync } from './cli';

runExpoFeedbackAsync().catch(logErrorAndExit);
