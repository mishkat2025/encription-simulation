// Diffie-Hellman key exchange. The board shows what Alice, Bob and an
// eavesdropper each know after every step.

import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Formula, PowTable } from '../components/MathTables';
import { PlayerControls } from '../components/PlayerControls';
import {
  Card,
  Chip,
  ErrorNote,
  LegendDot,
  NumberField,
  PageHeader,
  PresetButton,
  Tabs,
  cx,
  type Tone,
} from '../components/ui';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';
import { LabError, diffieHellman, discreteLogByTrial, orderOf, powTrace, type DiffieHellman } from './numberTheory';

const PRESETS = [
  { label: 'Small: p = 23, g = 7', p: '23', g: '7', a: '3', b: '6' },
  { label: 'Medium: p = 353, g = 3', p: '353', g: '3', a: '97', b: '233' },
  { label: 'Larger: p = 7919, g = 7', p: '7919', g: '7', a: '1234', b: '4321' },
];

type Party = 'alice' | 'public' | 'bob';

/** One value on the board: who knows it, and from which step on. */
interface Known {
  party: Party;
  label: string;
  value: number;
  tone: Tone;
  fromStep: number;
}

interface StepInfo {
  title: string;
  detail: ReactNode;
}

function buildBoard(x: DiffieHellman): { known: Known[]; steps: StepInfo[] } {
  const A = x.publicA.result;
  const B = x.publicB.result;
  const K = x.keyAlice.result;

  const known: Known[] = [
    ...(['alice', 'public', 'bob'] as const).flatMap((party) => [
      { party, label: 'prime p', value: x.p, tone: 'plain' as const, fromStep: 1 },
      { party, label: 'generator g', value: x.g, tone: 'plain' as const, fromStep: 1 },
    ]),
    { party: 'alice', label: 'private a', value: x.a, tone: 'key', fromStep: 2 },
    { party: 'bob', label: 'private b', value: x.b, tone: 'key', fromStep: 3 },
    { party: 'alice', label: 'A = gᵃ mod p', value: A, tone: 'plain', fromStep: 4 },
    { party: 'public', label: 'A, sent by Alice', value: A, tone: 'plain', fromStep: 4 },
    { party: 'bob', label: 'A, received', value: A, tone: 'plain', fromStep: 4 },
    { party: 'bob', label: 'B = gᵇ mod p', value: B, tone: 'plain', fromStep: 5 },
    { party: 'public', label: 'B, sent by Bob', value: B, tone: 'plain', fromStep: 5 },
    { party: 'alice', label: 'B, received', value: B, tone: 'plain', fromStep: 5 },
    { party: 'alice', label: 'key K = Bᵃ mod p', value: K, tone: 'cipher', fromStep: 6 },
    { party: 'bob', label: 'key K = Aᵇ mod p', value: K, tone: 'cipher', fromStep: 7 },
  ];

  const steps: StepInfo[] = [
    {
      title: 'Agree on a prime p and a generator g, in the open',
      detail: (
        <p className="m-0 text-sm text-ink-2">
          These two numbers are not secret. Alice and Bob can send them over the same channel Eve is listening to.
        </p>
      ),
    },
    {
      title: 'Alice picks a private number a',
      detail: <p className="m-0 text-sm text-ink-2">She never sends it to anyone, not even Bob.</p>,
    },
    {
      title: 'Bob picks a private number b',
      detail: <p className="m-0 text-sm text-ink-2">He keeps it to himself in the same way.</p>,
    },
    {
      title: 'Alice computes A and sends it to Bob',
      detail: (
        <div className="flex flex-col gap-3">
          <Formula>
            A = gᵃ mod p = {x.g}
            <sup>{x.a}</sup> mod {x.p} = <Chip tone="plain">{A}</Chip>
          </Formula>
          <PowTable trace={x.publicA} />
        </div>
      ),
    },
    {
      title: 'Bob computes B and sends it to Alice',
      detail: (
        <div className="flex flex-col gap-3">
          <Formula>
            B = gᵇ mod p = {x.g}
            <sup>{x.b}</sup> mod {x.p} = <Chip tone="plain">{B}</Chip>
          </Formula>
          <PowTable trace={x.publicB} />
        </div>
      ),
    },
    {
      title: "Alice combines Bob's B with her own private a",
      detail: (
        <div className="flex flex-col gap-3">
          <Formula>
            K = Bᵃ mod p = {B}
            <sup>{x.a}</sup> mod {x.p} = <Chip tone="cipher">{K}</Chip>
          </Formula>
          <PowTable trace={x.keyAlice} />
        </div>
      ),
    },
    {
      title: "Bob combines Alice's A with his own private b",
      detail: (
        <div className="flex flex-col gap-3">
          <Formula>
            K = Aᵇ mod p = {A}
            <sup>{x.b}</sup> mod {x.p} = <Chip tone="cipher">{x.keyBob.result}</Chip>
          </Formula>
          <PowTable trace={x.keyBob} />
        </div>
      ),
    },
    {
      title: 'Both hold the same key, and Eve does not',
      detail: (
        <div className="flex flex-col gap-2">
          <Formula>
            Bᵃ = (gᵇ)ᵃ = gᵃᵇ = (gᵃ)ᵇ = Aᵇ &nbsp; (all mod p)
          </Formula>
          <p className="m-0 text-sm text-ink-2">
            Eve saw p, g, A and B. To get K she needs a or b, which were never sent. Recovering a from A = gᵃ mod p is
            the discrete logarithm problem.
          </p>
        </div>
      ),
    },
  ];

  return { known, steps };
}

export function DiffieHellmanLab() {
  const [p, setP] = useState('23');
  const [g, setG] = useState('7');
  const [a, setA] = useState('3');
  const [b, setB] = useState('6');
  const [tab, setTab] = useState<'steps' | 'attack'>('steps');

  const { exchange, error } = useMemo(() => {
    try {
      return { exchange: diffieHellman(Number(p), Number(g), Number(a), Number(b)), error: undefined };
    } catch (caught) {
      if (caught instanceof LabError) return { exchange: undefined, error: caught.message };
      throw caught;
    }
  }, [p, g, a, b]);

  const board = useMemo(() => (exchange ? buildBoard(exchange) : undefined), [exchange]);
  const player = usePlayer(board?.steps.length ?? 0, board);
  usePlayerKeys(player, tab === 'steps');

  // How many of the p − 1 possible values the generator can reach.
  const order = exchange ? orderOf(exchange.g, exchange.p) : 0;
  const current = board && player.step > 0 ? board.steps[player.step - 1] : undefined;

  return (
    <>
      <PageHeader
        tags={['Public-key cryptography', 'Key exchange']}
        title="Diffie-Hellman key exchange"
        summary="Alice and Bob end up with the same secret key even though everything they send each other can be read by an eavesdropper. The key itself never travels over the channel."
      />

      <Tabs
        tabs={[
          { id: 'steps', label: 'Step through' },
          { id: 'attack', label: 'Break it' },
        ]}
        current={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Card title="Public numbers and private numbers">
          <div className="flex flex-wrap items-start gap-4">
            <NumberField label="Prime p" value={p} onChange={setP} tone="plain" />
            <NumberField label="Generator g" value={g} onChange={setG} tone="plain" />
            <NumberField label="Alice's private a" value={a} onChange={setA} />
            <NumberField label="Bob's private b" value={b} onChange={setB} />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          {exchange && (
            <p className="mt-3 mb-0 text-sm text-ink-2">
              {order === exchange.p - 1
                ? `g = ${exchange.g} is a primitive root of ${exchange.p}: its powers reach all ${order} possible values.`
                : `g = ${exchange.g} reaches only ${order} of the ${exchange.p - 1} possible values, which shrinks Eve's search. A primitive root is a better choice.`}
            </p>
          )}
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-ink-2">Examples</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  onClick={() => {
                    setP(preset.p);
                    setG(preset.g);
                    setA(preset.a);
                    setB(preset.b);
                  }}
                >
                  {preset.label}
                </PresetButton>
              ))}
            </div>
          </div>
        </Card>

        <div className="order-last min-w-0 xl:order-none">
          <Card title="How it works">
            <dl className="mb-4 space-y-1.5 rounded-lg bg-sunken p-3 font-mono text-sm">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-sans text-xs leading-5">Send</dt>
                <dd className="m-0">A = gᵃ mod p, B = gᵇ mod p</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-sans text-xs leading-5">Key</dt>
                <dd className="m-0">K = Bᵃ mod p = Aᵇ mod p</dd>
              </div>
            </dl>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
              <li>Raising g to a power mod p is fast. Going backwards, from the result to the power, is slow.</li>
              <li>Each side sends only its result, never its private number.</li>
              <li>Each side raises what it received to its own private number. Both arrive at g to the power a × b.</li>
              <li>
                The exchange does not prove who is on the other end. Without authentication, an attacker in the middle
                can run one exchange with each side.
              </li>
            </ol>
          </Card>
        </div>

        <div className="min-w-0 xl:col-span-2">
          {!exchange || !board ? (
            <Card>
              <p className="text-sm text-ink-2">Fix the values above to continue.</p>
            </Card>
          ) : tab === 'steps' ? (
            <Card
              title="Step by step"
              action={
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <LegendDot tone="plain">Public</LegendDot>
                  <LegendDot tone="key">Private</LegendDot>
                  <LegendDot tone="cipher">Shared key</LegendDot>
                </div>
              }
            >
              <div className="flex flex-col gap-5">
                <PlayerControls player={player} />

                <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
                  <Column title="Alice" known={board.known} party="alice" step={player.step} />
                  <Column title="Public channel" note="Eve sees all of this" known={board.known} party="public" step={player.step} />
                  <Column title="Bob" known={board.known} party="bob" step={player.step} />
                </div>

                <div className="min-h-24 rounded-lg bg-sunken p-4">
                  {current ? (
                    <div className="flex flex-col gap-3">
                      <h3 className="m-0 text-sm font-semibold text-ink">
                        Step {player.step}: {current.title}
                      </h3>
                      {current.detail}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-ink-2">
                      Press play, or step forward, to watch each side build the key.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <DiffieHellmanAttack exchange={exchange} />
          )}
        </div>
      </div>
    </>
  );
}

function Column({
  title,
  note,
  known,
  party,
  step,
}: {
  title: string;
  note?: string;
  known: Known[];
  party: Party;
  step: number;
}) {
  const visible = known.filter((item) => item.party === party && item.fromStep <= step);
  return (
    <div className="min-h-40 rounded-lg border border-line p-3">
      <h3 className="m-0 text-sm font-semibold text-ink">{title}</h3>
      <p className="m-0 mb-3 min-h-4 text-xs text-ink-2">{note ?? 'knows:'}</p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {visible.map((item) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, x: party === 'bob' ? 12 : party === 'alice' ? -12 : 0, y: party === 'public' ? -8 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cx(
              'flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs',
              item.fromStep === step ? 'bg-sunken text-ink' : 'text-ink-2',
            )}
          >
            <span>{item.label}</span>
            <Chip tone={item.tone}>{item.value}</Chip>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const SHOWN_TRIES = 40;

function DiffieHellmanAttack({ exchange }: { exchange: DiffieHellman }) {
  const { p, g } = exchange;
  const A = exchange.publicA.result;
  const B = exchange.publicB.result;
  const found = discreteLogByTrial(g, A, p)!;
  const hidden = found.tried.length - SHOWN_TRIES;
  const shown = hidden > 0 ? found.tried.slice(-SHOWN_TRIES) : found.tried;
  const key = powTrace(B, found.x, p);

  return (
    <Card title="Eve's attack: find the private number by trial">
      <p className="mb-4 text-sm leading-relaxed text-ink-2">
        Eve recorded p = {p}, g = {g}, A = {A} and B = {B}. She needs an exponent x with {g}
        <sup>x</sup> mod {p} = {A}. With a prime this small she tries x = 1, 2, 3 ... until one fits.
      </p>

      <ol className="m-0 list-none space-y-4 p-0 text-sm">
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">
            1. Try every exponent ({found.tried.length.toLocaleString()} {found.tried.length === 1 ? 'try' : 'tries'})
          </h3>
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {hidden > 0 && <span className="px-1 py-0.5 text-ink-2">{hidden.toLocaleString()} earlier tries, then</span>}
            {shown.map((entry) => (
              <span
                key={entry.x}
                className={
                  entry.x === found.x
                    ? 'rounded border border-key bg-key-soft px-1.5 py-0.5 font-semibold text-ink'
                    : 'rounded border border-line px-1.5 py-0.5 text-muted'
                }
              >
                {g}
                <sup>{entry.x}</sup> = {entry.value}
              </span>
            ))}
          </div>
        </li>
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">2. An exponent that works is found</h3>
          <Formula>
            x = <Chip tone="key">{found.x}</Chip>
          </Formula>
          {found.x !== exchange.a && (
            <p className="mt-2 mb-0 text-sm text-ink-2">
              Alice actually chose {exchange.a}, but {found.x} gives the same A, so it produces the same key.
            </p>
          )}
        </li>
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">3. Compute the shared key, exactly as Alice would</h3>
          <Formula>
            K = B<sup>x</sup> mod p = {B}
            <sup>{found.x}</sup> mod {p} = <Chip tone="cipher">{key.result}</Chip>
          </Formula>
        </li>
      </ol>

      <div className="mt-5 rounded-lg bg-sunken p-4 text-sm leading-relaxed text-ink-2">
        <p className="m-0">
          Real exchanges use a prime of 2048 bits or more, or elliptic curves. Trying exponents one by one is then out
          of the question, and no efficient method for the discrete logarithm is known for well-chosen parameters.
        </p>
      </div>
    </Card>
  );
}
