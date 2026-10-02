// RSA with small numbers: key generation, encryption and decryption as a
// sequence of steps, then Eve's attack by factoring n.

import { useMemo, useState } from 'react';
import { EuclidTable, Formula, PowTable } from '../components/MathTables';
import { PlayerControls } from '../components/PlayerControls';
import { StepTimeline, type TimelineStep } from '../components/StepTimeline';
import { Card, Chip, ErrorNote, LegendDot, NumberField, PageHeader, PresetButton, Tabs } from '../components/ui';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';
import { LabError, factorByTrialDivision, isPrime, powTrace, rsaKeys, validExponents } from './numberTheory';

const PRESETS = [
  { label: 'Small: p = 7, q = 11', p: '7', q: '11', e: '13', m: '5' },
  { label: 'Classic: p = 61, q = 53', p: '61', q: '53', e: '17', m: '65' },
  { label: 'Larger: p = 397, q = 401', p: '397', q: '401', e: '343', m: '1314' },
];

/** Runs the whole of RSA for the given inputs. */
function runRsa(p: number, q: number, e: number, m: number) {
  const keys = rsaKeys(p, q, e);
  if (!Number.isInteger(m) || m < 0 || m >= keys.n) {
    throw new LabError(`The message must be a whole number from 0 to ${keys.n - 1} (smaller than n).`);
  }
  const encryption = powTrace(m, keys.e, keys.n);
  const decryption = powTrace(encryption.result, keys.d, keys.n);
  return { keys, m, encryption, decryption };
}

export function RsaLab() {
  const [p, setP] = useState('7');
  const [q, setQ] = useState('11');
  const [e, setE] = useState('13');
  const [m, setM] = useState('5');
  const [tab, setTab] = useState<'steps' | 'attack'>('steps');

  const { result, error } = useMemo(() => {
    try {
      return { result: runRsa(Number(p), Number(q), Number(e), Number(m)), error: undefined };
    } catch (caught) {
      if (caught instanceof LabError) return { result: undefined, error: caught.message };
      throw caught;
    }
  }, [p, q, e, m]);

  // Suggest public exponents once p and q are valid, even if e is not yet.
  const suggestions = useMemo(() => {
    const [P, Q] = [Number(p), Number(q)];
    return isPrime(P) && isPrime(Q) && P !== Q ? validExponents((P - 1) * (Q - 1), 6) : [];
  }, [p, q]);

  const steps = result ? buildSteps(result) : [];
  const player = usePlayer(steps.length, result);
  usePlayerKeys(player, tab === 'steps');

  return (
    <>
      <PageHeader
        tags={['Cryptography', 'Public-key cryptography', 'Asymmetric']}
        title="RSA"
        summary="Bob publishes a key that anyone can use to encrypt, and keeps a second key that only he can decrypt with. The two keys are linked by two secret primes, and the security rests on how hard it is to factor their product."
      />

      <Tabs
        tabs={[
          { id: 'steps', label: 'Step through' },
          { id: 'attack', label: 'Break it' },
        ]}
        current={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-1 gap-5">
        <Card title="Primes, exponent and message">
          <div className="flex flex-wrap items-start gap-5">
            <NumberField label="Prime p" value={p} onChange={setP} />
            <NumberField label="Prime q" value={q} onChange={setQ} />
            <NumberField
              label="Public exponent e"
              value={e}
              onChange={setE}
              help={suggestions.length > 0 ? `Valid choices include ${suggestions.join(', ')}.` : undefined}
            />
            <NumberField label="Message M" value={m} onChange={setM} tone="plain" help="A number smaller than n." />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-ink-2">Examples</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  onClick={() => {
                    setP(preset.p);
                    setQ(preset.q);
                    setE(preset.e);
                    setM(preset.m);
                  }}
                >
                  {preset.label}
                </PresetButton>
              ))}
            </div>
          </div>
        </Card>

        <div className="order-last min-w-0">
          <Card title="How it works" bodyClassName="lg:flex lg:items-start lg:gap-10">
            <dl className="mb-5 shrink-0 space-y-2 rounded-xl border border-line bg-sunken p-4 font-mono text-sm lg:mb-0 lg:w-96">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-sans text-xs leading-5">Encrypt</dt>
                <dd className="m-0">C = Mᵉ mod n</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-sans text-xs leading-5">Decrypt</dt>
                <dd className="m-0">M = Cᵈ mod n</dd>
              </div>
            </dl>
            <ol className="m-0 max-w-3xl flex-1 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2 marker:font-semibold marker:text-accent-ink">
              <li>Bob picks two primes and multiplies them to get n. Multiplying is easy; undoing it is hard.</li>
              <li>He picks a public exponent e and computes the matching private exponent d.</li>
              <li>The public key is (e, n). Anyone can encrypt with it.</li>
              <li>Only d undoes the encryption, and finding d needs the primes, which Bob never shares.</li>
            </ol>
          </Card>
        </div>

        <div className="min-w-0">
          {!result ? (
            <Card>
              <p className="text-sm text-ink-2">Fix the values above to continue.</p>
            </Card>
          ) : tab === 'steps' ? (
            <Card
              title="Step by step"
              action={
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <LegendDot tone="plain">Message</LegendDot>
                  <LegendDot tone="key">Key values</LegendDot>
                  <LegendDot tone="cipher">Ciphertext</LegendDot>
                </div>
              }
            >
              <div className="sticky top-14 z-10 -mx-1 mb-4 border-b border-line bg-surface px-1 py-3">
                <PlayerControls player={player} />
              </div>
              <StepTimeline steps={steps} step={player.step} />
            </Card>
          ) : (
            <RsaAttack result={result} />
          )}
        </div>
      </div>
    </>
  );
}

type RsaResult = ReturnType<typeof runRsa>;

function buildSteps({ keys, m, encryption, decryption }: RsaResult): TimelineStep[] {
  const { p, q, n, phi, e, d } = keys;
  const c = encryption.result;
  return [
    {
      title: 'Pick two prime numbers',
      actor: 'Bob',
      visibility: 'private',
      content: (
        <Formula>
          p = <Chip tone="key">{p}</Chip> &nbsp; q = <Chip tone="key">{q}</Chip>
        </Formula>
      ),
    },
    {
      title: 'Multiply them to get the modulus n',
      actor: 'Bob',
      visibility: 'public',
      content: (
        <Formula>
          n = p × q = {p} × {q} = <Chip tone="key">{n}</Chip>
        </Formula>
      ),
    },
    {
      title: 'Compute φ(n)',
      actor: 'Bob',
      visibility: 'private',
      content: (
        <div className="flex flex-col gap-2">
          <Formula>
            φ(n) = (p − 1) × (q − 1) = {p - 1} × {q - 1} = <Chip tone="key">{phi}</Chip>
          </Formula>
          <p className="m-0 text-sm text-ink-2">
            This is easy for Bob because he knows p and q. Without them, nobody can compute it from n.
          </p>
        </div>
      ),
    },
    {
      title: 'Choose the public exponent e',
      actor: 'Bob',
      visibility: 'public',
      content: (
        <Formula>
          e = <Chip tone="key">{e}</Chip> &nbsp; with 1 &lt; e &lt; {phi} and gcd({e}, {phi}) = 1
        </Formula>
      ),
    },
    {
      title: 'Find the private exponent d',
      actor: 'Bob',
      visibility: 'private',
      content: (
        <div className="flex flex-col gap-3">
          <Formula>
            d = e⁻¹ mod φ(n) = {e}⁻¹ mod {phi} = <Chip tone="key">{d}</Chip>
          </Formula>
          <EuclidTable trace={keys.inverse} modulus={phi} />
          <Formula>
            Check: {e} × {d} = {e * d} = {Math.floor((e * d) / phi)} × {phi} + 1
          </Formula>
        </div>
      ),
    },
    {
      title: 'Publish the public key, keep the private key',
      actor: 'Bob',
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-line px-3 py-2.5">
            <div className="text-xs text-ink-2">Public key (e, n): anyone may see it</div>
            <Formula>
              ({e}, {n})
            </Formula>
          </div>
          <div className="rounded-lg border border-line px-3 py-2.5">
            <div className="text-xs text-ink-2">Private key d: only Bob has it</div>
            <Formula>{d}</Formula>
          </div>
        </div>
      ),
    },
    {
      title: "Encrypt with Bob's public key",
      actor: 'Alice',
      content: (
        <div className="flex flex-col gap-3">
          <Formula>
            C = Mᵉ mod n = <Chip tone="plain">{m}</Chip>
            <sup> {e}</sup> mod {n} = <Chip tone="cipher">{c}</Chip>
          </Formula>
          <PowTable trace={encryption} />
        </div>
      ),
    },
    {
      title: 'Decrypt with the private key',
      actor: 'Bob',
      content: (
        <div className="flex flex-col gap-3">
          <Formula>
            M = Cᵈ mod n = <Chip tone="cipher">{c}</Chip>
            <sup> {d}</sup> mod {n} = <Chip tone="plain">{decryption.result}</Chip>
          </Formula>
          <PowTable trace={decryption} />
          <p className="m-0 text-sm text-ink-2">Bob gets back the message Alice started with.</p>
        </div>
      ),
    },
  ];
}

const SHOWN_DIVISORS = 60;

function RsaAttack({ result }: { result: RsaResult }) {
  const { keys, m, encryption } = result;
  const c = encryption.result;
  const factors = factorByTrialDivision(keys.n)!;
  const hidden = factors.tried.length - SHOWN_DIVISORS;
  const shown = hidden > 0 ? factors.tried.slice(-SHOWN_DIVISORS) : factors.tried;
  const recovered = rsaKeys(factors.p, factors.q, keys.e);

  return (
    <Card title="Eve's attack: factor n">
      <p className="mb-4 text-sm leading-relaxed text-ink-2">
        Eve sees only what is public: the key ({keys.e}, {keys.n}) and the ciphertext {c}. If she can split n back into
        its two primes, she can repeat Bob's key generation and get d. With an n this small, she simply tries every
        divisor.
      </p>

      <ol className="m-0 list-none space-y-4 p-0 text-sm">
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">
            1. Divide n by 2, 3, 4 ... ({factors.tried.length.toLocaleString()}{' '}
            {factors.tried.length === 1 ? 'try' : 'tries'})
          </h3>
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {hidden > 0 && <span className="px-1 py-0.5 text-ink-2">{hidden.toLocaleString()} earlier tries, then</span>}
            {shown.map((divisor) => (
              <span
                key={divisor}
                className={
                  divisor === factors.p
                    ? 'rounded border border-key bg-key-soft px-1.5 py-0.5 font-semibold text-ink'
                    : 'rounded border border-line px-1.5 py-0.5 text-muted'
                }
              >
                {divisor}
                {divisor === factors.p && ' divides n'}
              </span>
            ))}
          </div>
        </li>
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">2. The primes are found</h3>
          <Formula>
            {keys.n} = <Chip tone="key">{factors.p}</Chip> × <Chip tone="key">{factors.q}</Chip>
          </Formula>
        </li>
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">3. Rebuild the private key</h3>
          <Formula>
            φ(n) = {factors.p - 1} × {factors.q - 1} = {recovered.phi}, &nbsp; d = {keys.e}⁻¹ mod {recovered.phi} ={' '}
            <Chip tone="key">{recovered.d}</Chip>
          </Formula>
        </li>
        <li>
          <h3 className="m-0 mb-2 text-sm font-semibold text-ink">4. Decrypt the message</h3>
          <Formula>
            M = <Chip tone="cipher">{c}</Chip>
            <sup> {recovered.d}</sup> mod {keys.n} = <Chip tone="plain">{m}</Chip>
          </Formula>
        </li>
      </ol>

      <div className="mt-5 rounded-lg bg-sunken p-4 text-sm leading-relaxed text-ink-2">
        <p className="m-0">
          Real RSA uses an n of 2048 bits, about 617 decimal digits. Trial division would need around 10³⁰⁸ tries, and
          the best factoring methods known are still far too slow. Real systems also add random padding before
          encrypting, because the plain formula shown here always turns the same message into the same ciphertext.
        </p>
      </div>
    </Card>
  );
}
