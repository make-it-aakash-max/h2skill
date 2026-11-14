import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGuestSession,
  deserializeGuestSession,
  serializeGuestSession,
} from './guestSession.ts';

test('buildGuestSession creates pre-loaded CS demo guest targeting chosen career', () => {
  const session = buildGuestSession({
    guestName: 'Alex Rivera',
    targetCareerId: 'full-stack-dev',
    role: 'student',
    preset: 'demo',
    weeklyHours: 14,
  });

  assert.equal(session.account.isGuest, true);
  assert.equal(session.account.isPreview, true);
  assert.equal(session.account.role, 'student');
  assert.equal(session.workspace.profile.name, 'Alex Rivera');
  assert.equal(session.workspace.profile.weeklyHoursAvailable, 14);
  assert.equal(session.workspace.analysis.targetRoleId, 'full-stack-dev');
  assert.equal(session.workspace.agentTrace.length, 5);
  assert.ok(session.workspace.roadmap.length > 0);
});

test('buildGuestSession creates fresh blank-slate guest for Data Engineer', () => {
  const session = buildGuestSession({
    guestName: 'Jordan Chen',
    targetCareerId: 'data-engineer',
    role: 'student',
    preset: 'fresh',
  });

  assert.equal(session.workspace.profile.name, 'Jordan Chen');
  assert.equal(session.workspace.profile.organization, 'Guest Sandbox');
  assert.equal(session.workspace.profile.skills.length, 1);
  assert.equal(session.workspace.analysis.targetRoleId, 'data-engineer');
  assert.ok(session.workspace.analysis.missingCount >= 3);
});

test('buildGuestSession supports admin and owner guest preview roles', () => {
  const adminSession = buildGuestSession({
    guestName: 'Faculty Guest',
    targetCareerId: 'ml-engineer',
    role: 'admin',
    preset: 'demo',
  });
  assert.equal(adminSession.account.role, 'admin');
  assert.ok(adminSession.account.displayName.includes('Admin Guest'));

  const ownerSession = buildGuestSession({
    guestName: 'Dean Guest',
    targetCareerId: 'frontend-architect',
    role: 'owner',
    preset: 'demo',
  });
  assert.equal(ownerSession.account.role, 'owner');
  assert.ok(ownerSession.account.displayName.includes('Owner Guest'));
});

test('serializeGuestSession and deserializeGuestSession roundtrip cleanly and reject invalid JSON', () => {
  const original = buildGuestSession({
    guestName: 'Sam Patel',
    targetCareerId: 'full-stack-dev',
    role: 'student',
    preset: 'demo',
  });

  const serialized = serializeGuestSession(original);
  const restored = deserializeGuestSession(serialized);
  assert.ok(restored);
  assert.equal(restored.workspace.profile.name, 'Sam Patel');
  assert.equal(restored.account.isGuest, true);

  assert.equal(deserializeGuestSession(null), null);
  assert.equal(deserializeGuestSession('{broken-json'), null);
  assert.equal(deserializeGuestSession(JSON.stringify({ foo: 'bar' })), null);
});
