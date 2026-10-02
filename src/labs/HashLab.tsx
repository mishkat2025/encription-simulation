// SHA-256: the digest of a message, the avalanche effect, and a walk through
// the 64 rounds that produce it.

import { useMemo, useState, type ReactNode } from 'react';
import { PlayerControls } from '../components/PlayerControls';
import { Card, LegendDot, PageHeader, cx } from '../components/ui';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';
import { bitDifference, hex, sha256, type Sha256Trace } from './sha256';

const WORD_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** The digest split into its eight 32-bit words, so it wraps cleanly on small screens. */
function Digest({ words, compareTo }: { words: number[]; compareTo?: number[] }) {
  return (
    <p className="m-0 flex flex-wrap gap-x-2 gap-y-1 font-mono text-sm text-ink sm:text-base">
      {words.map((word, i) => {
        const digits = hex(word).split('');
        const other = compareTo ? hex(compareTo[i]) : undefined;
        return (
          <span key={i}>
            {digits.map((digit, j) => (
              <span key={j} className={other && other[j] !== digit ? 'rounded-sm bg-cipher-soft font-semibold' : undefined}>
                {digit}
              </span>
            ))}
          </span>
        );
      })}
    </p>
  );
}

export function HashLab() {
  const [message, setMessage] = useState('hello');
  const [other, setOther] = useState('hellp');

  const trace = useMemo(() => sha256(message), [message]);
  const otherTrace = useMemo(() => sha256(other), [other]);
  const difference = bitDifference(trace.words, otherTrace.words);

  const player = usePlayer(trace.blocks.length * 64, trace);
  usePlayerKeys(player);

  return (
    <>
      <PageHeader
        tags={['Hash functions', 'SHA-2 family']}
        title="SHA-256 hashing"
        summary="A hash function turns a message of any length into a fixed-size fingerprint. It has no key and cannot be run backwards. SHA-256 always gives 256 bits, shown here as 64 hex digits."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Card title="Message and digest">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
              <span className="h-2.5 w-2.5 rounded-sm bg-plain" />
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              maxLength={200}
              spellCheck={false}
              className="w-full rounded-lg border border-line-strong bg-surface p-3 font-mono text-sm text-ink"
            />
          </label>
          <div className="mt-4 rounded-lg bg-sunken p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
              <span>SHA-256 digest</span>
              <span className="tabular-nums">
                {trace.padded.messageLength} {trace.padded.messageLength === 1 ? 'byte' : 'bytes'} in, always 32 bytes
                out
              </span>
            </div>
            <Digest words={trace.words} />
          </div>
          <p className="mt-3 mb-0 text-xs text-ink-2">
            Every character is hashed, including spaces and capital letters. Try an empty message, or a very long one:
            the digest stays the same length.
          </p>
        </Card>

        <div className="order-last min-w-0 xl:order-none">
          <Card title="How it works">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
              <li>The same message always gives the same digest.</li>
              <li>Changing any part of the message changes about half of the digest's bits.</li>
              <li>From a digest, there is no practical way to find a message that produces it.</li>
              <li>Nobody has found two different messages with the same SHA-256 digest.</li>
              <li>
                Inside, the message is padded, cut into 512-bit blocks, and each block is mixed into eight 32-bit words
                over 64 rounds.
              </li>
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-2">
          <Card title="Avalanche effect: change one letter">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                <span className="h-2.5 w-2.5 rounded-sm bg-plain" />
                Second message
              </span>
              <input
                type="text"
                value={other}
                onChange={(event) => setOther(event.target.value)}
                maxLength={200}
                spellCheck={false}
                className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 font-mono text-sm text-ink"
              />
            </label>

            <div className="mt-4 grid gap-3 text-xs text-ink-2">
              <div>
                <div className="mb-1">Digest of the first message</div>
                <Digest words={trace.words} />
              </div>
              <div>
                <div className="mb-1">Digest of the second message (changed digits are marked)</div>
                <Digest words={otherTrace.words} compareTo={trace.words} />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold text-ink">
                  {difference.count} of 256 bits differ ({Math.round((difference.count / 256) * 100)}%)
                </p>
                <div className="flex gap-4">
                  <LegendDot tone="cipher">Bit changed</LegendDot>
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                    <span className="h-2.5 w-2.5 rounded-sm border border-line-strong" />
                    Same
                  </span>
                </div>
              </div>
              {/* 256 bits, 32 per row: one row for each word of the digest */}
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: 'repeat(32, minmax(0, 1fr))', maxWidth: '40rem' }}
                role="img"
                aria-label={`${difference.count} of 256 digest bits differ between the two messages`}
              >
                {difference.changed.map((changed, i) => (
                  <span
                    key={i}
                    className={cx(
                      'aspect-square rounded-[2px] transition-colors duration-300',
                      changed ? 'bg-cipher' : 'border border-line',
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 mb-0 text-sm text-ink-2">
                {message === other
                  ? 'The two messages are identical, so the digests are too.'
                  : 'A good hash spreads every small change across the whole digest. About half the bits flipping is what a random result would look like.'}
              </p>
            </div>
          </Card>

          <Card
            title="Inside SHA-256"
            action={
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <LegendDot tone="plain">Message</LegendDot>
                <LegendDot tone="key">Marker</LegendDot>
                <LegendDot tone="cipher">Length</LegendDot>
              </div>
            }
          >
            <Rounds trace={trace} step={player.step} controls={<PlayerControls player={player} />} />
          </Card>
        </div>
      </div>
    </>
  );
}

function Rounds({ trace, step, controls }: { trace: Sha256Trace; step: number; controls: ReactNode }) {
  const blockCount = trace.blocks.length;
  // Step 1 is round 1 of block 1, step 65 is round 1 of block 2, and so on.
  const blockIndex = step === 0 ? 0 : Math.floor((step - 1) / 64);
  const roundIndex = step === 0 ? -1 : (step - 1) % 64;
  const block = trace.blocks[blockIndex];
  const round = roundIndex >= 0 ? block.rounds[roundIndex] : undefined;
  const blockDone = roundIndex === 63;
  const allDone = blockDone && blockIndex === blockCount - 1;

  const { bytes, messageLength } = trace.padded;
  const blockBytes = Array.from(bytes.slice(blockIndex * 64, blockIndex * 64 + 64));
  const byteClass = (position: number) => {
    if (position < messageLength) return 'border-plain bg-plain-soft text-ink';
    if (position === messageLength) return 'border-key bg-key-soft text-ink';
    if (position >= bytes.length - 8) return 'border-cipher bg-cipher-soft text-ink';
    return 'border-line text-muted';
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="m-0 mb-1 text-sm font-semibold text-ink">
          1. Padding: block {blockIndex + 1} of {blockCount}
        </h3>
        <p className="m-0 mb-3 text-sm text-ink-2">
          The message bytes are followed by a marker byte (80), zeros, and the message length in bits, so the total is
          a multiple of 64 bytes.
        </p>
        <div className="grid grid-cols-8 gap-0.5 font-mono text-[11px] sm:grid-cols-16 sm:text-xs" style={{ maxWidth: '36rem' }}>
          {blockBytes.map((byte, i) => (
            <span key={i} className={cx('rounded border py-0.5 text-center', byteClass(blockIndex * 64 + i))}>
              {byte.toString(16).padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <h3 className="m-0 mb-1 text-sm font-semibold text-ink">2. The 64 rounds</h3>
        <p className="m-0 mb-4 text-sm text-ink-2">
          Eight working words, a to h, start as the hash so far. Each round computes two new words (a and e) from all
          eight plus one piece of the message, and shifts the others along.
        </p>
        {controls}

        <div className="mt-5 rounded-lg bg-sunken p-4">
          {round ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                <span className="font-semibold text-ink">
                  Block {blockIndex + 1}, round {roundIndex + 1} of 64
                </span>
                <span className="font-mono text-ink-2">
                  message word W = {hex(round.w)}
                </span>
                <span className="font-mono text-ink-2">constant K = {hex(round.k)}</span>
              </div>

              <div className="scroll-thin overflow-x-auto">
                <table className="border-collapse font-mono text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="pr-3 text-left font-sans text-xs font-normal text-ink-2" />
                      {WORD_NAMES.map((name) => (
                        <th key={name} className="px-1.5 pb-1 text-center font-semibold text-ink">
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th className="pr-3 text-left font-sans text-xs font-normal whitespace-nowrap text-ink-2">before</th>
                      {round.before.map((word, i) => (
                        <td key={i} className="px-1.5 py-1 text-ink-2">
                          {hex(word)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th className="pr-3 text-left font-sans text-xs font-normal whitespace-nowrap text-ink-2">after</th>
                      {round.after.map((word, i) => (
                        <td key={i} className="px-1.5 py-1">
                          {/* a and e are newly computed; the rest are copies of their left neighbour */}
                          <span
                            className={cx(
                              'rounded px-1 py-0.5',
                              i === 0 || i === 4 ? 'border border-cipher bg-cipher-soft font-semibold text-ink' : 'text-ink',
                            )}
                          >
                            {hex(word)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 font-mono text-xs leading-relaxed text-ink-2 sm:text-sm">
                <p className="m-0">T1 = h + Σ1(e) + Ch(e, f, g) + K + W = {hex(round.t1)}</p>
                <p className="m-0">T2 = Σ0(a) + Maj(a, b, c) = {hex(round.t2)}</p>
                <p className="m-0">
                  new a = T1 + T2 &nbsp;·&nbsp; new e = d + T1 &nbsp;·&nbsp; b, c, d, f, g, h take the old a, b, c, e,
                  f, g
                </p>
              </div>

              {blockDone && (
                <div className="border-t border-line pt-4">
                  <p className="m-0 mb-2 text-sm text-ink">
                    {allDone
                      ? 'Last round done. Adding a to h to the hash so far gives the digest:'
                      : 'Block done. a to h are added to the hash so far, and the next block starts from this:'}
                  </p>
                  <Digest words={block.hashAfter} />
                </div>
              )}
            </div>
          ) : (
            <p className="m-0 text-sm text-ink-2">
              Press play, or step forward, to watch the eight words change round by round. Try a faster speed: there
              are {blockCount * 64} rounds.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
