// The page for one classical cipher: message and key on top, the step-by-step
// view below, and a "Break it" tab for the ciphers that have an attack.

import { useMemo, useState } from 'react';
import { AttackPanel } from './AttackPanel';
import { CopyIcon, SwapIcon } from './Icons';
import { KeyInputs } from './KeyInputs';
import { PlayerControls } from './PlayerControls';
import { GridView } from './views/GridView';
import { PermutationView } from './views/PermutationView';
import { PlayfairView } from './views/PlayfairView';
import { StripView } from './views/StripView';
import { Button, Card, ErrorNote, LegendDot, PageHeader, PresetButton, Tabs, cx, inputName, outputName } from './ui';
import type { Cipher, Example, KeyValues, Mode, Trace } from '../ciphers/types';
import { KeyError } from '../ciphers/util';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';

type Tab = 'steps' | 'attack';

export function CipherPage({ cipher }: { cipher: Cipher }) {
  const [mode, setMode] = useState<Mode>(cipher.examples[0].mode);
  const [text, setText] = useState(cipher.examples[0].text);
  const [keyValues, setKeyValues] = useState<KeyValues>(cipher.examples[0].key);
  const [tab, setTab] = useState<Tab>('steps');

  const loadExample = (example: Example) => {
    setMode(example.mode);
    setText(example.text);
    setKeyValues(example.key);
  };

  // Run the cipher. useMemo re-runs it only when one of its inputs changes.
  const result = useMemo<{ trace?: Trace; error?: string }>(() => {
    try {
      return { trace: cipher.run(text, keyValues, mode) };
    } catch (error) {
      if (error instanceof KeyError) return { error: error.message };
      throw error;
    }
  }, [cipher, text, keyValues, mode]);

  const { trace, error } = result;
  const player = usePlayer(trace?.steps.length ?? 0, trace);
  usePlayerKeys(player, tab === 'steps');

  const output = trace?.output ?? '';
  // How much of the output the steps so far have produced.
  const revealed = trace && player.step > 0 ? trace.steps[player.step - 1].out.length : 0;

  const swapToOutput = () => {
    setText(output);
    setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
  };

  return (
    <>
      <PageHeader
        tags={cipher.category ? [cipher.group, cipher.category] : [cipher.group]}
        title={cipher.name}
        aka={cipher.aka}
        summary={cipher.summary}
      />

      {cipher.attacks.length > 0 && (
        <Tabs
          tabs={[
            { id: 'steps', label: 'Step through' },
            { id: 'attack', label: 'Break it' },
          ]}
          current={tab}
          onChange={setTab}
        />
      )}

      {tab === 'attack' && cipher.attacks.length > 0 ? (
        <AttackPanel
          cipher={cipher}
          currentCiphertext={mode === 'encrypt' ? output : text}
          onStepThrough={(ciphertext, key) => {
            setMode('decrypt');
            setText(ciphertext.toUpperCase());
            setKeyValues(key);
            setTab('steps');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <Card
            title="Message and key"
            action={
              <div className="flex rounded-lg border border-line-strong p-0.5" role="group" aria-label="Direction">
                <ModeButton active={mode === 'encrypt'} onClick={() => setMode('encrypt')}>
                  Encrypt
                </ModeButton>
                <ModeButton active={mode === 'decrypt'} onClick={() => setMode('decrypt')}>
                  Decrypt
                </ModeButton>
              </div>
            }
          >
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                <span className={cx('h-2.5 w-2.5 rounded-sm', mode === 'encrypt' ? 'bg-plain' : 'bg-cipher')} />
                {inputName(mode)}
              </span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={2}
                maxLength={300}
                spellCheck={false}
                placeholder={mode === 'encrypt' ? 'Type a message to encrypt' : 'Paste ciphertext to decrypt'}
                className="w-full rounded-lg border border-line-strong bg-surface p-3 font-mono text-sm text-ink"
              />
            </label>
            <p className="mt-1 mb-4 text-xs text-ink-2">
              Only the letters a to z are used. Spaces, digits and punctuation are dropped, as in the lecture.
            </p>

            <KeyInputs
              params={cipher.params}
              values={keyValues}
              onChange={(id, value) => setKeyValues({ ...keyValues, [id]: value })}
            />
            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-xs font-medium text-ink-2">Examples from the lecture</p>
              <div className="flex flex-wrap gap-2">
                {cipher.examples.map((example) => (
                  <PresetButton key={example.label} onClick={() => loadExample(example)}>
                    {example.label}
                  </PresetButton>
                ))}
              </div>
            </div>
          </Card>

          {/* On small screens this card moves to the bottom of the page. */}
          <div className="order-last min-w-0 xl:order-none">
            <Card title="How it works">
              {cipher.formula && (
                <dl className="mb-4 space-y-1.5 rounded-lg bg-sunken p-3 font-mono text-sm">
                  <div className={cx('flex gap-3', mode !== 'encrypt' && 'text-muted')}>
                    <dt className="w-16 shrink-0 font-sans text-xs leading-5">Encrypt</dt>
                    <dd className="m-0">{cipher.formula.encrypt}</dd>
                  </div>
                  <div className={cx('flex gap-3', mode !== 'decrypt' && 'text-muted')}>
                    <dt className="w-16 shrink-0 font-sans text-xs leading-5">Decrypt</dt>
                    <dd className="m-0">{cipher.formula.decrypt}</dd>
                  </div>
                </dl>
              )}
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
                {cipher.howItWorks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </Card>
          </div>

          <div className="min-w-0 space-y-4 xl:col-span-2">
            <Card
              title="Step by step"
              action={
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <LegendDot tone="plain">Plaintext</LegendDot>
                  <LegendDot tone="key">Key</LegendDot>
                  <LegendDot tone="cipher">Ciphertext</LegendDot>
                </div>
              }
            >
              {trace && trace.steps.length > 0 ? (
                <div className="space-y-5">
                  <PlayerControls player={player} />
                  <div className="border-t border-line pt-5">
                    {trace.view === 'strip' && <StripView trace={trace} step={player.step} mode={mode} />}
                    {trace.view === 'playfair' && <PlayfairView trace={trace} step={player.step} mode={mode} />}
                    {trace.view === 'grid' && <GridView trace={trace} step={player.step} mode={mode} />}
                    {trace.view === 'permutation' && <PermutationView trace={trace} step={player.step} mode={mode} />}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-2">
                  {error ? 'Fix the key above to see the steps.' : 'Type a message above to see the steps.'}
                </p>
              )}
            </Card>

            <Card
              title={outputName(mode)}
              action={
                <div className="flex gap-2">
                  <Button onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>
                    <CopyIcon />
                    Copy
                  </Button>
                  <Button onClick={swapToOutput} disabled={!output}>
                    <SwapIcon />
                    {mode === 'encrypt' ? 'Decrypt this' : 'Encrypt this'}
                  </Button>
                </div>
              }
            >
              <p className="min-h-6 font-mono text-lg break-all">
                <span className="font-semibold text-ink">{output.slice(0, revealed)}</span>
                <span className="text-muted">{output.slice(revealed)}</span>
              </p>
              {output && revealed < output.length && (
                <p className="mt-2 text-xs text-ink-2">
                  The full answer is shown in grey. Letters turn solid as the steps reach them.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'h-8 rounded-md px-3 text-sm font-medium transition-colors',
        active ? 'bg-accent text-on-accent' : 'text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
