// The frame around every page: header, sidebar and footer. It reads the topic
// from the address bar (for example #vigenere or #quick-sort) and shows it.

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { Button, cx } from './components/ui';
import { areas, findTopic, firstTopic, topics, type AreaId } from './topics';

/** The topic named in the address bar, or the first one when there is none. */
const topicFromAddress = () => findTopic(window.location.hash.slice(1)) ?? topics[0];

export default function App() {
  const [topic, setTopic] = useState(topicFromAddress);

  // The sidebar links change the address. Listening for that change means the
  // browser's back and forward buttons work too.
  useEffect(() => {
    const onAddressChange = () => {
      setTopic(topicFromAddress());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onAddressChange);
    return () => window.removeEventListener('hashchange', onAddressChange);
  }, []);

  return (
    <div className="min-h-screen">
      <Header currentArea={topic.area} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Sidebar current={topic} />

        {/* key={topic.id} gives every topic a fresh page, so no state leaks from one to the next. */}
        <main key={topic.id} className="min-w-0 space-y-4">
          {topic.render()}
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pt-4 pb-10 text-xs leading-relaxed text-ink-2">
        CS² for Everyone: computer science concept simulations. The classical ciphers here can all be broken, and the
        modern algorithms are shown with small numbers so the steps fit on a page. None of it should protect real
        data.
      </footer>
    </div>
  );
}

function Header({ currentArea }: { currentArea: AreaId }) {
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
    <header className="bg-header text-on-header">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <a href={`#${topics[0].id}`} className="flex items-center gap-3 text-on-header no-underline">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            <span className="block text-base leading-tight font-semibold">CS² for Everyone</span>
            <span className="block text-xs text-on-header/70">Computer science concepts, one step at a time</span>
          </span>
        </a>

        {/* On a phone the area links drop to their own row under the logo. */}
        <nav aria-label="Areas" className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
          {areas.map((area) => (
            <a
              key={area.id}
              href={`#${firstTopic(area.id).id}`}
              aria-current={area.id === currentArea ? 'true' : undefined}
              className={cx(
                'rounded-lg px-3 py-1.5 text-sm no-underline transition-colors',
                area.id === currentArea ? 'bg-on-header/15 font-semibold text-on-header' : 'text-on-header/70 hover:text-on-header',
              )}
            >
              {area.name}
            </a>
          ))}
        </nav>

        <div className="ml-auto">
          <Button onClick={toggleTheme} label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
