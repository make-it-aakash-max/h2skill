import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTargetResolved,
  createMouseParticle,
  DARK_THEME_PALETTE,
  generateSlatConfigs,
  LIGHT_THEME_PALETTE,
} from './themeEffects.ts';

test('calculateTargetResolved resolves light, dark, and system accurately', () => {
  assert.equal(calculateTargetResolved('dark', false), 'dark');
  assert.equal(calculateTargetResolved('light', true), 'light');
  assert.equal(calculateTargetResolved('system', true), 'dark');
  assert.equal(calculateTargetResolved('system', false), 'light');
});

test('generateSlatConfigs creates alternating up/down crisscross configurations', () => {
  const configs = generateSlatConfigs(10, 'to-dark');
  assert.equal(configs.length, 10);

  // Check even slats slide down from top (-101%)
  assert.equal(configs[0].direction, 'down');
  assert.equal(configs[0].initialY, '-101%');
  assert.equal(configs[0].exitY, '101%');

  // Check odd slats slide up from bottom (101%)
  assert.equal(configs[1].direction, 'up');
  assert.equal(configs[1].initialY, '101%');
  assert.equal(configs[1].exitY, '-101%');

  // Check width and progressive left offset
  assert.equal(configs[0].leftPercent, 0);
  assert.equal(configs[1].leftPercent, 10);
  assert.equal(configs[9].leftPercent, 90);
  assert.ok(configs[0].widthPercent >= 10);

  // Check progressive delays
  assert.ok(configs[0].delay <= configs[1].delay);
  assert.ok(configs[1].delay <= configs[2].delay);
});

test('createMouseParticle produces valid particles adhering to theme palettes', () => {
  const darkParticle = createMouseParticle(100, 200, 2, -1, 'dark');
  assert.equal(darkParticle.x, 100);
  assert.equal(darkParticle.y, 200);
  assert.ok(darkParticle.size > 0);
  assert.ok(darkParticle.alpha > 0);
  assert.ok(DARK_THEME_PALETTE.includes(darkParticle.color));

  const lightParticle = createMouseParticle(50, 60, 0, 0, 'light');
  assert.ok(LIGHT_THEME_PALETTE.includes(lightParticle.color));
});
