import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_SIGNALS, filterDemoSignals } from '@/lib/mockSignals';

describe('Auth and Demo System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides realistic demo signals for surveillance', () => {
    expect(DEMO_SIGNALS.length).toBeGreaterThan(0);
    const p1Signals = filterDemoSignals({ priority: ['P1'] });
    expect(p1Signals.length).toBeGreaterThan(0);
    expect(p1Signals.every(s => s.priority === 'P1')).toBe(true);
  });

  it('filters demo signals by country', () => {
    const rwandaSignals = filterDemoSignals({ country: 'Rwanda' });
    expect(rwandaSignals.length).toBeGreaterThan(0);
    expect(rwandaSignals[0].location_country).toBe('Rwanda');
  });

  it('filters demo signals by status', () => {
    const validatedSignals = filterDemoSignals({ status: ['validated'] });
    expect(validatedSignals.length).toBeGreaterThan(0);
    expect(validatedSignals.every(s => s.status === 'validated')).toBe(true);
  });
});
