const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');

function loadTsCommonJsModule(tsFilePath) {
  const typescript = require('typescript');
  const source = fs.readFileSync(tsFilePath, 'utf8');

  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      strict: true,
      esModuleInterop: true,
    },
    fileName: tsFilePath,
    reportDiagnostics: false,
  });

  const module = { exports: {} };
  const requireFromFile = Module.createRequire(tsFilePath);
  const wrapped = Module.wrap(outputText);
  const script = new vm.Script(wrapped, { filename: tsFilePath });
  const fn = script.runInThisContext();
  fn(module.exports, requireFromFile, module, tsFilePath, path.dirname(tsFilePath));
  return module.exports;
}

const calculatorPath = path.join(__dirname, '..', 'lib', '531-calculator.ts');
const {
  calculateTrainingMax,
  roundWeight,
  calculateWeight,
  generate531Program,
  generateFullProgram,
} = loadTsCommonJsModule(calculatorPath);

test('calculateTrainingMax rounds 90% of 1RM', () => {
  assert.equal(calculateTrainingMax(200), 180);
  assert.equal(calculateTrainingMax(101), 91);
});

test('roundWeight rounds to nearest 2.5 below 100', () => {
  assert.equal(roundWeight(42.1), 42.5);
  assert.equal(roundWeight(72), 72.5);
  assert.equal(roundWeight(73.74), 72.5);
});

test('roundWeight rounds to nearest 5 at or above 100', () => {
  assert.equal(roundWeight(100), 100);
  assert.equal(roundWeight(102), 100);
  assert.equal(roundWeight(103), 105);
  assert.equal(roundWeight(117), 115);
});

test('calculateWeight applies rounding to training max percentage', () => {
  assert.equal(calculateWeight(180, 65), 115);
  assert.equal(calculateWeight(180, 75), 135);
  assert.equal(calculateWeight(180, 85), 155);
});

test('generate531Program returns 4 weeks with expected structure', () => {
  const weeks = generate531Program(200);
  assert.equal(weeks.length, 4);
  assert.deepEqual(
    weeks.map((w) => w.week),
    [1, 2, 3, 4]
  );

  assert.deepEqual(
    weeks[0].sets.map((s) => [s.reps, s.percentage, s.weight]),
    [
      ['5', 65, 115],
      ['5', 75, 135],
      ['5+', 85, 155],
    ]
  );

  assert.deepEqual(
    weeks[3].sets.map((s) => [s.reps, s.percentage, s.weight]),
    [
      ['5', 40, 72.5],
      ['5', 50, 90],
      ['5', 60, 110],
    ]
  );
});

test('generateFullProgram generates per-exercise training max and weeks', () => {
  const program = generateFullProgram([
    { name: 'Squat', oneRepMax: 300 },
    { name: 'Bench', oneRepMax: 200 },
  ]);

  assert.equal(program.length, 2);
  assert.equal(program[0].name, 'Squat');
  assert.equal(program[0].trainingMax, calculateTrainingMax(300));
  assert.equal(program[0].weeks.length, 4);
  assert.equal(program[1].name, 'Bench');
  assert.equal(program[1].trainingMax, calculateTrainingMax(200));
});
