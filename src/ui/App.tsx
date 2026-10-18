import { useState } from 'react';
import { IconButton, TabItem, Tabs, TextS } from '@salutejs/plasma-web/css';
import {
  IconContrast1Outline,
  IconStarLightOutline,
  IconSunOutline,
} from '@salutejs/plasma-icons/24';
import { DepositCalculator } from './deposit/DepositCalculator';
import { LoanCalculator } from './loan/LoanCalculator';
import { useTheme } from './common/useTheme';
import type { Theme } from './common/theme';

type Tab = 'loan' | 'deposit';

const TABS: { value: Tab; label: string }[] = [
  { value: 'loan', label: 'Кредит' },
  { value: 'deposit', label: 'Вклад' },
];

const THEME_NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const THEME_LABEL: Record<Theme, string> = {
  auto: 'Тема: системная',
  light: 'Тема: светлая',
  dark: 'Тема: тёмная',
};
const THEME_ICON: Record<Theme, JSX.Element> = {
  auto: <IconContrast1Outline color="inherit" />,
  light: <IconSunOutline color="inherit" />,
  dark: <IconStarLightOutline color="inherit" />,
};

export function App() {
  const [tab, setTab] = useState<Tab>('loan');
  const [theme, setTheme] = useTheme();

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ₽
          </span>
          <span className="brand-name">Калькулятор кредита и вклада</span>
        </div>
        <Tabs className="tabs" view="divider" size="m" aria-label="Калькулятор">
          {TABS.map((t, index) => (
            <TabItem
              key={t.value}
              view="divider"
              size="m"
              selected={tab === t.value}
              aria-selected={tab === t.value}
              itemIndex={index}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </TabItem>
          ))}
        </Tabs>
        <IconButton
          className="theme-toggle"
          view="clear"
          size="m"
          onClick={() => setTheme(THEME_NEXT[theme])}
          aria-label={THEME_LABEL[theme]}
          title={THEME_LABEL[theme]}
        >
          {THEME_ICON[theme]}
        </IconButton>
      </header>
      {/* Both panels stay mounted so switching tabs keeps what the user typed. */}
      <main>
        <div role="tabpanel" hidden={tab !== 'loan'}>
          <LoanCalculator />
        </div>
        <div role="tabpanel" hidden={tab !== 'deposit'}>
          <DepositCalculator />
        </div>
      </main>
      <footer className="footer">
        <TextS color="var(--text-tertiary)">
          Расчёты в decimal с округлением до копейки. Результат носит информационный характер.
          Интерфейс построен на открытой дизайн-системе Plasma.
        </TextS>
      </footer>
    </div>
  );
}
