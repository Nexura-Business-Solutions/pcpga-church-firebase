import { describe, it, expect, vi, beforeEach } from 'vitest';

// Handlers route to the lib helpers; mock the lib so we test wiring only.
// (Pure grant/revoke logic is covered in adminClaimsLib.test.js — it can't live
// here because vi.mock of this module is hoisted above every import.)
vi.mock('../lib/adminClaims.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    grantAdminClaim: vi.fn(async () => ({ status: 'granted' })),
    revokeAdminClaim: vi.fn(async () => ({ status: 'revoked' })),
  };
});

import { grantAdminClaim, revokeAdminClaim } from '../lib/adminClaims.js';
import { onAdminWrittenHandler, onAuthUserCreatedHandler } from '../adminClaims.js';

beforeEach(() => {
  grantAdminClaim.mockClear();
  revokeAdminClaim.mockClear();
});

describe('onAdminWrittenHandler', () => {
  it('grants when a doc is created', async () => {
    await onAdminWrittenHandler({
      params: { email: 'jane@pcpga.org' },
      data: { before: { exists: false }, after: { exists: true } },
    });
    expect(grantAdminClaim).toHaveBeenCalledWith('jane@pcpga.org');
    expect(revokeAdminClaim).not.toHaveBeenCalled();
  });

  it('grants when a doc is updated (e.g. role change)', async () => {
    await onAdminWrittenHandler({
      params: { email: 'jane@pcpga.org' },
      data: { before: { exists: true }, after: { exists: true } },
    });
    expect(grantAdminClaim).toHaveBeenCalledWith('jane@pcpga.org');
  });

  it('revokes when a doc is deleted', async () => {
    await onAdminWrittenHandler({
      params: { email: 'jane@pcpga.org' },
      data: { before: { exists: true }, after: { exists: false } },
    });
    expect(revokeAdminClaim).toHaveBeenCalledWith('jane@pcpga.org');
    expect(grantAdminClaim).not.toHaveBeenCalled();
  });
});

describe('onAuthUserCreatedHandler', () => {
  const dbWith = (exists) => ({
    collection: () => ({ doc: () => ({ get: async () => ({ exists }) }) }),
  });

  it('grants when the new user is in the admins collection', async () => {
    const res = await onAuthUserCreatedHandler({ email: 'Jane@pcpga.org' }, dbWith(true));
    expect(grantAdminClaim).toHaveBeenCalledWith('jane@pcpga.org');
    expect(res.status).toBe('granted');
  });

  it('does nothing for a non-admin user', async () => {
    const res = await onAuthUserCreatedHandler({ email: 'rando@gmail.com' }, dbWith(false));
    expect(grantAdminClaim).not.toHaveBeenCalled();
    expect(res.status).toBe('noop');
  });

  it('skips a user with no email', async () => {
    const res = await onAuthUserCreatedHandler({ email: '' }, dbWith(true));
    expect(res.status).toBe('skipped');
  });
});
