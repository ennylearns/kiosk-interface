import { describe, it, expect } from 'vitest';
import { parseLocationQuery } from './locationParser';

describe('parseLocationQuery', () => {
  it('returns the ID of an exact match by name', () => {
    const result = parseLocationQuery('take me to AFIT Gate please');
    expect(result).toBe('main_gate');
  });

  it('returns null if no location matches', () => {
    const result = parseLocationQuery('Some unknown place');
    expect(result).toBeNull();
  });

  it('returns the ID of a match by keyword', () => {
    const result = parseLocationQuery('I am looking for the afit library');
    expect(result).toBe('library');
  });

  it('returns the ID of a match with a typo', () => {
    const result = parseLocationQuery('take me to civil enginearing'); // Typo in engineering
    expect(result).toBe('civil_engineering_department');
  });
});
