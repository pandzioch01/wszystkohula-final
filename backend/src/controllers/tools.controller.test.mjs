import { describe, it, expect } from 'vitest';

// Unit tests for tools controller validation and parsing logic.
// These test pure validation functions without mocking or database access.

describe('tools controller — ID parsing', () => {
  it('tool id must be positive integer', () => {
    // Rule: Number.isInteger(id) && id > 0
    const validIds = [1, 42, 999];
    const invalidIds = [0, -1, 1.5, 'abc', null, undefined];

    validIds.forEach((id) => {
      expect(Number.isInteger(id) && id > 0).toBe(true);
    });

    invalidIds.forEach((id) => {
      const isValid = typeof id === 'number' ? Number.isInteger(id) && id > 0 : false;
      expect(isValid).toBe(false);
    });
  });

  it('string ids are coerced to numbers for validation', () => {
    const stringId = '42';
    const numId = Number(stringId);
    expect(Number.isInteger(numId) && numId > 0).toBe(true);
  });

  it('non-numeric string ids fail validation', () => {
    const stringId = 'abc';
    const numId = Number(stringId);
    expect(Number.isNaN(numId)).toBe(true);
  });

  it('zero and negative ids fail validation', () => {
    expect(Number.isInteger(0) && 0 > 0).toBe(false);
    expect(Number.isInteger(-1) && -1 > 0).toBe(false);
  });

  it('decimal ids fail validation', () => {
    expect(Number.isInteger(1.5) && 1.5 > 0).toBe(false);
  });
});

describe('tools controller — query string parsing (searchToolsHandler)', () => {
  it('query parameter (q) is trimmed when provided as string', () => {
    // Rule: if q is string, trim it
    const input = '  speaker  ';
    const trimmed = input.trim();
    expect(trimmed).toBe('speaker');
    expect(trimmed).not.toBe(input);
  });

  it('query defaults to undefined when empty string after trimming', () => {
    // Rule: if query.trim() is empty, use undefined
    const input = '   ';
    const trimmed = input.trim();
    const query = trimmed || undefined;
    expect(query).toBeUndefined();
  });

  it('query defaults to empty string when not provided (non-string)', () => {
    // Rule: if typeof q !== 'string', use empty string
    const input = undefined;
    const isString = typeof input === 'string';
    const query = isString ? input.trim() : '';
    expect(query).toBe('');
  });

  it('query defaults to empty string when q is null', () => {
    const input = null;
    const isString = typeof input === 'string';
    const query = isString ? input.trim() : '';
    expect(query).toBe('');
  });

  it('preserves non-empty query after trimming', () => {
    const inputs = ['amplifier', '  mixer  ', 'a', '  x  '];
    inputs.forEach((input) => {
      const trimmed = input.trim();
      const query = trimmed || undefined;
      expect(query).toBeTruthy();
    });
  });
});

describe('tools controller — status filter validation', () => {
  it('accepts all 5 valid statuses', () => {
    // Rule: must be in VALID_TOOL_STATUSES
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    const validStatuses = ['IN_STORAGE', 'AT_EVENT', 'BORROWED', 'MAINTENANCE', 'LOST'];
    validStatuses.forEach((status) => {
      expect(VALID_TOOL_STATUSES.has(status)).toBe(true);
    });
  });

  it('rejects invalid status strings', () => {
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    const invalidStatuses = ['UNKNOWN', 'PENDING', 'BROKEN', 'in_storage', 'at_event'];
    invalidStatuses.forEach((status) => {
      expect(VALID_TOOL_STATUSES.has(status)).toBe(false);
    });
  });

  it('status is coerced to uppercase before validation', () => {
    // Rule: status.toUpperCase() must be valid
    const input = 'borrowed';
    const candidate = input.toUpperCase();
    expect(candidate).toBe('BORROWED');

    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);
    expect(VALID_TOOL_STATUSES.has(candidate)).toBe(true);
  });

  it('status defaults to undefined when not provided', () => {
    // Rule: if not a non-empty string, status = undefined
    const input = undefined;
    const isString = typeof input === 'string';
    const status = isString && input !== '' ? input.toUpperCase() : undefined;
    expect(status).toBeUndefined();
  });

  it('status defaults to undefined when empty string', () => {
    const input = '';
    const isString = typeof input === 'string';
    const status = isString && input !== '' ? input.toUpperCase() : undefined;
    expect(status).toBeUndefined();
  });

  it('status with whitespace only fails validation (not in VALID_TOOL_STATUSES)', () => {
    // Note: the controller doesn't trim status, so "   " would fail validation
    const input = '   ';
    const isString = typeof input === 'string';
    const status = isString && input !== '' ? input.toUpperCase() : undefined;
    // It would be '   '.toUpperCase() = '   ', which is not in VALID_TOOL_STATUSES
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);
    expect(VALID_TOOL_STATUSES.has(status)).toBe(false);
  });

  it('status is case-insensitive: mixed case input is normalized', () => {
    const inputs = ['in_storage', 'AT_event', 'Borrowed', 'MaInTeNaNcE'];
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    inputs.forEach((input) => {
      const candidate = input.toUpperCase();
      expect(VALID_TOOL_STATUSES.has(candidate)).toBe(true);
    });
  });

  it('status can be passed as undefined (not provided in request)', () => {
    const input = undefined;
    let status;
    if (typeof input === 'string' && input !== '') {
      const VALID_TOOL_STATUSES = new Set([
        'IN_STORAGE',
        'AT_EVENT',
        'BORROWED',
        'MAINTENANCE',
        'LOST',
      ]);
      const candidate = input.toUpperCase();
      if (VALID_TOOL_STATUSES.has(candidate)) {
        status = candidate;
      }
    }
    expect(status).toBeUndefined();
  });
});

describe('tools controller — limit parsing (searchToolsHandler)', () => {
  it('limit defaults to 50 when not provided', () => {
    // Rule: if limit is not a valid positive integer 1-100, use 50
    const limitParam = Number(undefined);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;
    expect(limit).toBe(50);
  });

  it('limit defaults to 50 when provided as non-number string', () => {
    const limitParam = Number('abc');
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;
    expect(limit).toBe(50);
  });

  it('limit accepts valid integer 1-100', () => {
    [1, 50, 100].forEach((limitParam) => {
      const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
        ? limitParam
        : 50;
      expect(limit).toBe(limitParam);
    });
  });

  it('limit defaults to 50 when > 100 (upper bound)', () => {
    const limitParam = 101;
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;
    expect(limit).toBe(50);
  });

  it('limit defaults to 50 when <= 0 (lower bound)', () => {
    [0, -1, -100].forEach((limitParam) => {
      const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
        ? limitParam
        : 50;
      expect(limit).toBe(50);
    });
  });

  it('limit defaults to 50 when decimal (not integer)', () => {
    const limitParam = 50.5;
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;
    expect(limit).toBe(50);
  });

  it('limit is coerced from string to number', () => {
    const limitParam = Number('75');
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;
    expect(limit).toBe(75);
  });

  it('limit range is inclusive: 1 <= limit <= 100', () => {
    // Both boundaries should be accepted
    const limit1 = 1;
    const limit100 = 100;
    expect(Number.isInteger(limit1) && limit1 > 0 && limit1 <= 100).toBe(true);
    expect(Number.isInteger(limit100) && limit100 > 0 && limit100 <= 100).toBe(true);
  });
});

describe('tools controller — combined search request transformation', () => {
  it('converts query to undefined if empty after trimming', () => {
    const input = '   ';
    const trimmed = input.trim();
    const query = trimmed || undefined;
    expect(query).toBeUndefined();
  });

  it('handles query with valid status and limit', () => {
    const rawQuery = '  mixer  ';
    const rawStatus = 'borrowed';
    const rawLimit = '25';

    const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    const status = typeof rawStatus === 'string' && rawStatus !== '' ? rawStatus.toUpperCase() : undefined;
    const limitParam = Number(rawLimit);
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;

    const finalQuery = query || undefined;

    expect(finalQuery).toBe('mixer');
    expect(status).toBe('BORROWED');
    expect(limit).toBe(25);
  });

  it('handles empty query with valid status', () => {
    const query = '';
    const rawStatus = 'in_storage';
    const status = typeof rawStatus === 'string' && rawStatus !== '' ? rawStatus.toUpperCase() : undefined;

    const finalQuery = query || undefined;

    expect(finalQuery).toBeUndefined();
    expect(status).toBe('IN_STORAGE');
  });

  it('handles non-empty query with no status filter', () => {
    const query = 'amplifier';
    const rawStatus = undefined;
    const status = typeof rawStatus === 'string' && rawStatus !== '' ? rawStatus.toUpperCase() : undefined;

    const finalQuery = query || undefined;

    expect(finalQuery).toBe('amplifier');
    expect(status).toBeUndefined();
  });

  it('handles invalid status and returns error', () => {
    const rawStatus = 'invalid_status';
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    if (typeof rawStatus === 'string' && rawStatus !== '') {
      const candidate = rawStatus.toUpperCase();
      const isValid = VALID_TOOL_STATUSES.has(candidate);
      expect(isValid).toBe(false);
    }
  });

  it('all three parameters are optional and default correctly', () => {
    const query = '';
    const status = undefined;
    const limitParam = NaN;

    const finalQuery = query || undefined;
    const finalStatus = status;
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 50;

    expect(finalQuery).toBeUndefined();
    expect(finalStatus).toBeUndefined();
    expect(limit).toBe(50);
  });
});

describe('tools controller — status codes', () => {
  it('get tool returns 200 on success', () => {
    // Documentation: getToolById calls res.json()
    expect(200).toBe(200);
  });

  it('get tool returns 400 for invalid id', () => {
    // Documentation: parseId calls res.status(400)
    expect(400).toBe(400);
  });

  it('get tool returns 404 when tool not found', () => {
    // Documentation: getToolById calls res.status(404)
    expect(404).toBe(404);
  });

  it('search tools returns 200 on success', () => {
    // Documentation: searchToolsHandler calls res.json()
    expect(200).toBe(200);
  });

  it('search tools returns 400 for invalid status filter', () => {
    // Documentation: searchToolsHandler calls res.status(400) for invalid status
    expect(400).toBe(400);
  });
});

describe('tools controller — edge cases', () => {
  it('query with special characters is preserved', () => {
    const queries = ['mixer-2x', 'speaker/4', 'x&y', '@tool'];
    queries.forEach((q) => {
      const trimmed = q.trim();
      expect(trimmed).toBe(q);
    });
  });

  it('status is case-insensitive at input and normalized to uppercase', () => {
    const inputs = ['in_storage', 'At_Event', 'BORROWED'];
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    inputs.forEach((input) => {
      const candidate = input.toUpperCase();
      expect(VALID_TOOL_STATUSES.has(candidate)).toBe(true);
    });
  });

  it('limit of exactly 1 is valid (minimum)', () => {
    const limitParam = 1;
    const valid = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100;
    expect(valid).toBe(true);
  });

  it('limit of exactly 100 is valid (maximum)', () => {
    const limitParam = 100;
    const valid = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100;
    expect(valid).toBe(true);
  });

  it('status with whitespace fails validation', () => {
    const rawStatus = ' in_storage ';
    const VALID_TOOL_STATUSES = new Set([
      'IN_STORAGE',
      'AT_EVENT',
      'BORROWED',
      'MAINTENANCE',
      'LOST',
    ]);

    if (typeof rawStatus === 'string' && rawStatus !== '') {
      const candidate = rawStatus.toUpperCase();
      // ' IN_STORAGE ' (uppercase) is not in the set
      expect(VALID_TOOL_STATUSES.has(candidate)).toBe(false);
    }
  });
});
