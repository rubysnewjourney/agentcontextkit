import { describe, expect, it } from 'vitest';

describe('demo', () => {
  it('has a placeholder assertion', () => {
    expect('repobrief').toContain('brief');
  });
});
