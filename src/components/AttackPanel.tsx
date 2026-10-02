// The "Break it" tab: Eve has only the ciphertext and tries to recover the
// plaintext, by brute force or by counting letters.

import { useMemo, useState } from 'react';
import {
  ENGLISH_FREQUENCY,
  bestCandidate,
  bruteForce,
  guessAdditiveKey,
  letterCounts,
  type BruteForceTarget,
  type Candidate,
} from '../attacks/attacks';
import type { AttackKind, Cipher, KeyValues } from '../ciphers/types';
import { ALPHABET, letter, lettersOnly, two } from '../ciphers/util';
import { FrequencyChart } from './FrequencyChart';
import { CheckIcon } from './Icons';
import { Button, Card, cx } from './ui';

const ATTACK_NAMES: Record<AttackKind, string> = {
  brute: 'Brute-force attack',
  frequency: 'Statistical attack',
};

/** Extra ciphertexts from the lecture, offered as one-click samples. */
const LECTURE_CIPHERTEXTS: Record<string, { label: string; text: string }[]> = {
  additive: [{ label: 'Example 3.5', text: 'UVACLYFZLJBYL' }],
};

interface Props {
  cipher: Cipher;
  /** The ciphertext currently on the "Step through" tab, if there is one. */
  currentCiphertext: string;
  /** Opens the "Step through" tab, decrypting this ciphertext with this key. */
  onStepThrough: (ciphertext: string, key: KeyValues) => void;
}

export function AttackPanel({ cipher, currentCiphertext, onStepThrough }: Props) {
  const sample = useMemo(
    () => (cipher.attackSample ? cipher.run(cipher.attackSample.text, cipher.attackSample.key, 'encrypt').output : ''),
    [cipher],
  );
  const [ciphertext, setCiphertext] = useState(sample);
  const [kind, setKind] = useState<AttackKind>(cipher.attacks[0]);
  const letters = lettersOnly(ciphertext);

  return (
    <div className="space-y-4">
      <Card title="Intercepted ciphertext">
        <textarea
          value={ciphertext}
          onChange={(event) => setCiphertext(event.target.value)}
          rows={3}
          maxLength={600}
          spellCheck={false}
          aria-label="Ciphertext to attack"
          className="w-full rounded-lg border border-line-strong bg-sunken p-3 font-mono text-sm text-ink"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => setCiphertext(sample)}>Sample message</Button>
          {(LECTURE_CIPHERTEXTS[cipher.id] ?? []).map((example) => (
            <Button key={example.label} onClick={() => setCiphertext(example.text)}>
              {example.label}
            </Button>
          ))}
          {currentCiphertext && (
            <Button onClick={() => setCiphertext(currentCiphertext)}>Use the ciphertext from Step through</Button>
          )}
          <span className="ml-auto text-xs text-ink-2 tabular-nums">{letters.length} letters</span>
        </div>
      </Card>

      {cipher.attacks.length > 1 && (
        <div className="flex gap-2" role="tablist">
          {cipher.attacks.map((attack) => (
            <button
              key={attack}
              type="button"
              role="tab"
              aria-selected={kind === attack}
              onClick={() => setKind(attack)}
              className={cx(
                'h-9 rounded-lg border px-3 text-sm font-medium transition-colors',
                kind === attack ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface text-ink hover:bg-sunken',
              )}
            >
              {ATTACK_NAMES[attack]}
            </button>
          ))}
        </div>
      )}

      {letters.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-2">Enter some ciphertext to attack.</p>
        </Card>
      ) : kind === 'brute' ? (
        <BruteForce cipherId={cipher.id as BruteForceTarget} ciphertext={letters} onStepThrough={onStepThrough} />
      ) : (
        <FrequencyAttack cipher={cipher} ciphertext={letters} onStepThrough={onStepThrough} />
      )}
    </div>
  );
}

/* ---------- brute force ---------- */

const VISIBLE_ROWS = 15;

function BruteForce({
  cipherId,
  ciphertext,
  onStepThrough,
}: {
  cipherId: BruteForceTarget;
  ciphertext: string;
  onStepThrough: Props['onStepThrough'];
}) {
  const [showAll, setShowAll] = useState(false);
  const candidates = useMemo(() => bruteForce(cipherId, ciphertext), [cipherId, ciphertext]);
  const best = bestCandidate(candidates);

  // A short key list is shown in key order, the way Eve would try them.
  // A long one is sorted so the most English-looking results come first.
  const long = candidates.length > 30;
  const ordered = long ? [...candidates].sort((a, b) => a.score - b.score) : candidates;
  const rows = long && !showAll ? ordered.slice(0, VISIBLE_ROWS) : ordered;

  return (
    <Card title={`Brute-force attack: all ${candidates.length} keys`}>
      <p className="mb-4 text-sm leading-relaxed text-ink-2">
        The key domain is so small that Eve can decrypt the message with every possible key and look for the one that
        reads as English. The fit column measures how far each result is from normal English letter frequencies (χ²,
        lower is closer), and the closest one is marked.
        {long && ' The results are sorted with the closest first.'}
      </p>

      <div className="scroll-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-2">
              <th className="border-b border-line py-2 pr-4 font-medium">Key</th>
              <th className="border-b border-line py-2 pr-4 font-medium">Decryption</th>
              <th className="border-b border-line py-2 pr-4 text-right font-medium whitespace-nowrap">Fit (χ²)</th>
              <th className="border-b border-line py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((candidate) => (
              <CandidateRow
                key={candidate.keyLabel}
                candidate={candidate}
                isBest={candidate === best}
                onStepThrough={() => onStepThrough(ciphertext, candidate.key)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {long && (
        <div className="mt-3">
          <Button onClick={() => setShowAll(!showAll)}>
            {showAll ? `Show the closest ${VISIBLE_ROWS}` : `Show all ${candidates.length} keys`}
          </Button>
        </div>
      )}

      {ciphertext.length < 12 && (
        <p className="mt-4 text-sm text-ink-2">
          This message is very short, so the marked result may be wrong. Read down the list for the one that makes
          sense.
        </p>
      )}
    </Card>
  );
}

function CandidateRow({
  candidate,
  isBest,
  onStepThrough,
}: {
  candidate: Candidate;
  isBest: boolean;
  onStepThrough: () => void;
}) {
  return (
    <tr className={cx(isBest && 'bg-plain-soft')}>
      <td className="border-b border-line py-1.5 pr-4 pl-2 font-mono whitespace-nowrap tabular-nums">
        {candidate.keyLabel}
      </td>
      <td className="max-w-0 w-full border-b border-line py-1.5 pr-4">
        <div className="flex items-center gap-2">
          <span className={cx('truncate font-mono', isBest ? 'font-semibold text-ink' : 'text-ink-2')}>
            {candidate.plaintext}
          </span>
          {isBest && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-plain bg-surface px-2 py-0.5 text-xs font-medium text-ink">
              <CheckIcon />
              Best match
            </span>
          )}
        </div>
      </td>
      <td className="border-b border-line py-1.5 pr-4 text-right text-ink-2 tabular-nums">
        {Number.isFinite(candidate.score) ? Math.round(candidate.score).toLocaleString() : '-'}
      </td>
      <td className="border-b border-line py-1.5 pr-2 text-right whitespace-nowrap">
        {isBest && (
          <button type="button" onClick={onStepThrough} className="text-xs font-medium text-ink underline underline-offset-2">
            Step through
          </button>
        )}
      </td>
    </tr>
  );
}

/* ---------- statistical attack ---------- */

function FrequencyAttack({
  cipher,
  ciphertext,
  onStepThrough,
}: {
  cipher: Cipher;
  ciphertext: string;
  onStepThrough: Props['onStepThrough'];
}) {
  const counts = letterCounts(ciphertext);
  const total = ciphertext.length;
  const shares = counts.map((count) => (count / total) * 100);
  const yMax = Math.max(15, Math.ceil(Math.max(...shares, ...ENGLISH_FREQUENCY) / 5) * 5);
  const topLetter = counts.indexOf(Math.max(...counts));

  // Ciphertext letters from most to least common, leaving out letters that never appear.
  const ranked = counts
    .map((count, i) => ({ count, i }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <Card title="Statistical attack: count the letters">
      <p className="mb-5 text-sm leading-relaxed text-ink-2">
        A monoalphabetic cipher always replaces a letter with the same ciphertext letter, so the letter frequencies of
        the language survive encryption. In English, e is the most common letter by a wide margin. Compare the shape of
        the two charts.
      </p>

      <div className="flex flex-col gap-7">
        <FrequencyChart
          title="Typical English"
          subtitle="Share of each letter in ordinary English text"
          labels={ALPHABET.split('')}
          values={ENGLISH_FREQUENCY}
          tone="plain"
          yMax={yMax}
          highlight={4}
        />
        <FrequencyChart
          title="This ciphertext"
          subtitle={`Share of each letter in the ${total} letters intercepted`}
          labels={ALPHABET.toUpperCase().split('')}
          values={shares}
          counts={counts}
          tone="cipher"
          yMax={yMax}
          highlight={topLetter}
        />
      </div>

      <div className="mt-6 rounded-lg bg-sunken p-4 text-sm leading-relaxed text-ink">
        {cipher.id === 'additive' ? (
          <AdditiveConclusion ciphertext={ciphertext} onStepThrough={onStepThrough} />
        ) : (
          <>
            <p>
              Most common ciphertext letters:{' '}
              <span className="font-mono font-semibold">
                {ranked
                  .slice(0, 8)
                  .map((entry) => letter(entry.i).toUpperCase())
                  .join(' ')}
              </span>
              . Most common English letters: <span className="font-mono font-semibold">e t a o i n s h</span>.
            </p>
            <p className="mt-2 text-ink-2">
              Start by guessing that {letter(topLetter).toUpperCase()} stands for e, then use common short words (the,
              and, to, of) to work out the rest of the table. The order rarely matches exactly, which is why this
              attack takes some trial and error, but it is far faster than trying 26! keys.
            </p>
          </>
        )}
      </div>

      {total < 40 && (
        <p className="mt-4 text-sm text-ink-2">
          This message has only {total} letters. Frequencies are unreliable in short messages, so the most common letter
          may not be e.
        </p>
      )}
    </Card>
  );
}

function AdditiveConclusion({
  ciphertext,
  onStepThrough,
}: {
  ciphertext: string;
  onStepThrough: Props['onStepThrough'];
}) {
  const guess = guessAdditiveKey(ciphertext);
  if (!guess) return null;
  const top = letter(guess.topLetter).toUpperCase();
  const agrees = guess.keyFromE === guess.bestFitKey;

  return (
    <>
      <p>
        The most common ciphertext letter is <span className="font-mono font-semibold">{top}</span> ({guess.topCount}{' '}
        {guess.topCount === 1 ? 'time' : 'times'}). If {top} stands for e, the key is{' '}
        <span className="font-mono">
          ({two(guess.topLetter)} − 04) mod 26 = <span className="font-semibold">{guess.keyFromE}</span>
        </span>
        .
      </p>
      {agrees ? (
        <p className="mt-2 text-ink-2">Comparing all 26 letters with English gives the same key.</p>
      ) : (
        <p className="mt-2 text-ink-2">
          Comparing all 26 letters with English suggests key {guess.bestFitKey} instead. In this message the most
          common letter is probably not e, which happens with short texts.
        </p>
      )}
      <div className="mt-3">
        <Button onClick={() => onStepThrough(ciphertext, { k: String(agrees ? guess.keyFromE : guess.bestFitKey) })}>
          Decrypt with key {agrees ? guess.keyFromE : guess.bestFitKey}
        </Button>
      </div>
    </>
  );
}
