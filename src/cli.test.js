import { test } from 'node:test';
import assert from 'node:assert/strict';

import { main } from './cli.js';
import { defaultConfig } from './config.js';

// 부수효과 의존성을 모두 가짜로 채운 deps 를 만든다. 각 테스트는 필요한 것만 override.
function makeDeps(overrides = {}) {
  return {
    load: async () => ({ config: defaultConfig(), invalidSteps: [] }),
    save: async (sel) => ({
      ...defaultConfig(),
      selection: { ...defaultConfig().selection, ...sel },
    }),
    promptSelections: async () => ({}),
    buildArgs: () => [],
    run: async () => 0,
    ...overrides,
  };
}

test('main 은 config 서브커맨드면 전체 단계 메뉴 → 저장만 하고 실행하지 않는다', async () => {
  const events = [];
  const deps = makeDeps({
    load: async () => {
      events.push('load');
      return { config: defaultConfig(), invalidSteps: [] };
    },
    promptSelections: async (_opts, _cur, steps) => {
      events.push(['prompt', steps]);
      return { mode: 'auto', model: 'opus', effort: 'high' };
    },
    save: async (sel) => {
      events.push(['save', sel]);
      return { ...defaultConfig(), selection: sel };
    },
    run: async () => {
      events.push('run');
      return 0;
    },
  });

  const code = await main(['config'], deps);

  assert.equal(code, 0);
  assert.deepEqual(events, [
    'load',
    ['prompt', ['mode', 'model', 'effort']],
    ['save', { mode: 'auto', model: 'opus', effort: 'high' }],
  ]);
  assert.ok(!events.includes('run'));
});

test('main 은 selection 이 유효하면 메뉴 없이 바로 claude 를 실행하고 종료코드를 전파한다', async () => {
  const events = [];
  const deps = makeDeps({
    load: async () => ({ config: defaultConfig(), invalidSteps: [] }),
    promptSelections: async () => {
      events.push('prompt');
      return {};
    },
    buildArgs: (_sel, _opts, passthrough) => {
      events.push(['buildArgs', passthrough]);
      return ['ASSEMBLED'];
    },
    run: async (args) => {
      events.push(['run', args]);
      return 7;
    },
  });

  const code = await main(['hello'], deps);

  assert.equal(code, 7);
  assert.ok(!events.includes('prompt'));
  assert.deepEqual(events, [
    ['buildArgs', ['hello']],
    ['run', ['ASSEMBLED']],
  ]);
});

test('main 은 일부 단계가 무효면 그 단계만 메뉴 → 저장 후 실행한다', async () => {
  const events = [];
  const deps = makeDeps({
    load: async () => ({ config: defaultConfig(), invalidSteps: ['model'] }),
    promptSelections: async (_opts, _cur, steps) => {
      events.push(['prompt', steps]);
      return { model: 'sonnet' };
    },
    save: async (sel) => {
      events.push(['save', sel]);
      return { ...defaultConfig(), selection: { ...defaultConfig().selection, ...sel } };
    },
    buildArgs: () => ['ASSEMBLED'],
    run: async () => {
      events.push('run');
      return 0;
    },
  });

  const code = await main([], deps);

  assert.equal(code, 0);
  assert.deepEqual(events[0], ['prompt', ['model']]);
  assert.equal(events[1][0], 'save');
  assert.ok(events.includes('run'));
});
