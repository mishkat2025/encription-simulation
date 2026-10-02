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

      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:py-8">
        <Sidebar current={topic} />

        {/* key={topic.id} gives every topic a fresh page, so no state leaks from one to the next. */}
        <main key={topic.id} className="min-w-0 space-y-5">
          {topic.render()}
        </main>
      </div>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-[90rem] px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          CS² for Everyone: computer science concept simulations. The classical ciphers here can all be broken, and the
          modern algorithms are shown with small numbers so the steps fit on a page. None of it should protect real
          data.
        </p>
      </footer>
    </div>
  );
}

function Header({ currentArea }: { currentArea: AreaId }) {
  // Dark is the default. index.html applies a saved choice before the page paints.
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme !== 'light');

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
    <header className="sticky top-0 z-20 border-b border-line bg-header/90 text-on-header backdrop-blur-md">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-8 gap-y-2 px-4 sm:px-6">
        <a href={`#${topics[0].id}`} className="flex items-center gap-3 py-3 text-on-header no-underline">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span>
            <span className="block text-[15px] leading-tight font-bold tracking-tight">CS² for Everyone</span>
            <span className="block text-xs text-muted">Computer science, one step at a time</span>
          </span>
        </a>

        {/* On a phone the area links drop to their own row under the logo. */}
        <nav aria-label="Areas" className="order-last -mb-px flex w-full gap-6 sm:order-none sm:w-auto sm:self-stretch">
          {areas.map((area) => (
            <a
              key={area.id}
              href={`#${firstTopic(area.id).id}`}
              aria-current={area.id === currentArea ? 'true' : undefined}
              className={cx(
                'flex items-center border-b-2 py-3 text-sm font-medium no-underline transition-colors',
                area.id === currentArea
                  ? 'border-accent-ink text-on-header'
                  : 'border-transparent text-muted hover:text-on-header',
              )}
            >
              {area.name}
            </a>
          ))}
        </nav>

        <div className="ml-auto py-3">
          <Button onClick={toggleTheme} label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
