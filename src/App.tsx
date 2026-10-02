// The whole page. It holds the app's state (which cipher, the message, the
// key, encrypt or decrypt) and passes it down to the components that draw it.

import { useEffect, useMemo, useState } from 'react';
import { AttackPanel } from './components/AttackPanel';
import { CopyIcon, MoonIcon, SunIcon, SwapIcon } from './components/Icons';
import { KeyInputs } from './components/KeyInputs';
import { PlayerControls } from './components/PlayerControls';
import { Sidebar } from './components/Sidebar';
import { GridView } from './components/views/GridView';
import { PermutationView } from './components/views/PermutationView';
import { PlayfairView } from './components/views/PlayfairView';
import { StripView } from './components/views/StripView';
import { Button, Card, LegendDot, cx, inputName, outputName } from './components/ui';
import { ciphers, findCipher } from './ciphers';
import type { Cipher, Example, KeyValues, Mode, Trace } from './ciphers/types';
import { KeyError } from './ciphers/util';
import { usePlayer } from './hooks/usePlayer';

type Tab = 'steps' | 'attack';

/** The cipher named in the address bar (for example #vigenere), or the first one. */
const cipherFromAddress = () => findCipher(window.location.hash.slice(1)) ?? ciphers[0];

export default function App() {
  const [cipher, setCipher] = useState<Cipher>(cipherFromAddress);
  const [mode, setMode] = useState<Mode>(cipher.examples[0].mode);
  const [text, setText] = useState(cipher.examples[0].text);
  const [keyValues, setKeyValues] = useState<KeyValues>(cipher.examples[0].key);
  const [tab, setTab] = useState<Tab>('steps');

  const loadExample = (example: Example) => {
    setMode(example.mode);
    setText(example.text);
    setKeyValues(example.key);
  };

  // The sidebar links change the address (#affine, #playfair ...). Listening for
  // that change means the browser's back and forward buttons work too.
  useEffect(() => {
    const onAddressChange = () => {
      const next = cipherFromAddress();
      setCipher(next);
      loadExample(next.examples[0]);
      setTab('steps');
    };
    window.addEventListener('hashchange', onAddressChange);
    return () => window.removeEventListener('hashchange', onAddressChange);
  }, []);

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

  // Keyboard shortcuts: arrows to step, space to play or pause.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (tab !== 'steps' || target.closest('input, textarea, select, button, summary')) return;
      if (event.key === 'ArrowRight') player.next();
      else if (event.key === 'ArrowLeft') player.previous();
      else if (event.key === ' ') {
        event.preventDefault();
        player.toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const output = trace?.output ?? '';
  // How much of the output the steps so far have produced.
  const revealed = trace && player.step > 0 ? trace.steps[player.step - 1].out.length : 0;

  const swapToOutput = () => {
    setText(output);
    setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Sidebar current={cipher} />

        <main className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
              <span className="rounded-full border border-line-strong px-2.5 py-0.5">{cipher.group}</span>
              {cipher.category && (
                <span className="rounded-full border border-line-strong px-2.5 py-0.5">{cipher.category}</span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{cipher.name}</h1>
            {cipher.aka && <p className="mt-1 text-sm text-ink-2">Also called: {cipher.aka}</p>}
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-2">{cipher.summary}</p>
          </div>

          {cipher.attacks.length > 0 && (
            <div className="flex gap-1 border-b border-line" role="tablist">
              <TabButton active={tab === 'steps'} onClick={() => setTab('steps')}>
                Step through
              </TabButton>
              <TabButton active={tab === 'attack'} onClick={() => setTab('attack')}>
                Break it
              </TabButton>
            </div>
          )}

          {tab === 'attack' && cipher.attacks.length > 0 ? (
            // key={cipher.id} gives each cipher its own fresh copy of the panel.
            <AttackPanel
              key={cipher.id}
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
                {error && (
                  <p role="alert" className="mt-3 rounded-lg border border-danger px-3 py-2 text-sm text-ink">
                    {error}
                  </p>
                )}

                <div className="mt-5 border-t border-line pt-4">
                  <p className="mb-2 text-xs font-medium text-ink-2">Examples from the lecture</p>
                  <div className="flex flex-wrap gap-2">
                    {cipher.examples.map((example) => (
                      <button
                        key={example.label}
                        type="button"
                        onClick={() => loadExample(example)}
                        className="rounded-full border border-line-strong px-3 py-1 text-left text-xs text-ink transition-colors hover:bg-sunken"
                      >
                        {example.label}
                      </button>
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
                        {trace.view === 'permutation' && (
                          <PermutationView trace={trace} step={player.step} mode={mode} />
                        )}
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
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pt-4 pb-10 text-xs leading-relaxed text-ink-2">
        A study companion for traditional symmetric-key ciphers. These ciphers are for learning only: every one of them
        can be broken, and none should be used to protect real data.
      </footer>
    </div>
  );
}

function Header() {
  const [dark, setDark] = useState(() => {
    const saved = document.documentElement.dataset.theme;
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked (private windows). The theme still changes for this visit.
    }
    setDark(!dark);
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <a href="#additive" className="flex items-center gap-3 text-ink no-underline">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            <span className="block text-base leading-tight font-semibold">CipherLab</span>
            <span className="block text-xs text-ink-2">Classical ciphers, one step at a time</span>
          </span>
        </a>
        <Button onClick={toggleTheme} label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </header>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        active ? 'border-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
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
        active ? 'bg-ink text-page' : 'text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
