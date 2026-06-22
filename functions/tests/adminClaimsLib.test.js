import { describe, it, expect, vi } from 'vitest';
import { grantAdminClaim, revokeAdminClaim } from '../lib/adminClaims.js';

function makeAuth({ user, notFound = false } = {}) {
  return {
    getUserByEmail: vi.fn(async () => {
      if (notFound) {
        const e = new Error('no user');
        e.code = 'auth/user-not-found';
        throw e;
      }
      return user;
    }),
    setCustomUserClaims: vi.fn(async () => {}),
  };
}

describe('grantAdminClaim', () => {
  it('sets admin:true on a user that lacks it, preserving other claims', async () => {
    const auth = makeAuth({ user: { uid: 'u1', customClaims: { foo: 1 } } });
    const res = await grantAdminClaim('Jane@PCPGA.org ', auth);
    expect(res).toMatchObject({ status: 'granted', uid: 'u1', email: 'jane@pcpga.org' });
    expect(auth.getUserByEmail).toHaveBeenCalledWith('jane@pcpga.org');
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith('u1', { foo: 1, admin: true });
  });

  it('is a no-op when the user is already an admin', async () => {
    const auth = makeAuth({ user: { uid: 'u1', customClaims: { admin: true } } });
    const res = await grantAdminClaim('jane@pcpga.org', auth);
    expect(res.status).toBe('noop');
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('returns pending (no throw) when no Auth user exists yet', async () => {
    const auth = makeAuth({ notFound: true });
    const res = await grantAdminClaim('newbie@pcpga.org', auth);
    expect(res).toMatchObject({ status: 'pending', reason: 'no-auth-user' });
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('skips an empty email', async () => {
    const auth = makeAuth({ user: {} });
    const res = await grantAdminClaim('  ', auth);
    expect(res.status).toBe('skipped');
    expect(auth.getUserByEmail).not.toHaveBeenCalled();
  });
});

describe('revokeAdminClaim', () => {
  it('removes admin while keeping other claims', async () => {
    const auth = makeAuth({ user: { uid: 'u1', customClaims: { admin: true, foo: 2 } } });
    const res = await revokeAdminClaim('jane@pcpga.org', auth);
    expect(res.status).toBe('revoked');
    expect(auth.setCustomUserClaims).toHaveBeenCalledWith('u1', { foo: 2 });
  });

  it('is a no-op when the user was never an admin', async () => {
    const auth = makeAuth({ user: { uid: 'u1', customClaims: {} } });
    const res = await revokeAdminClaim('jane@pcpga.org', auth);
    expect(res.status).toBe('noop');
    expect(auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('is a no-op (no throw) when the Auth user is already gone', async () => {
    const auth = makeAuth({ notFound: true });
    const res = await revokeAdminClaim('ghost@pcpga.org', auth);
    expect(res.status).toBe('noop');
  });
});
