import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';

function loanPanel() {
  return screen.getAllByRole('tabpanel', { hidden: true })[0]!;
}

function fill(label: string, value: string) {
  fireEvent.change(within(loanPanel()).getByLabelText(label), { target: { value } });
}

describe('App', () => {
  it('starts with empty fields, no errors and result blocks filled with dashes', () => {
    render(<App />);
    const panel = within(loanPanel());
    expect((panel.getByLabelText('Сумма кредита') as HTMLInputElement).value).toBe('');
    expect(panel.queryByText('Введите число')).toBeNull();
    expect(panel.getByText('Ежемесячный платёж')).toBeTruthy();
    expect(panel.getByText('График платежей')).toBeTruthy();
    expect(panel.getAllByText('—').length).toBeGreaterThan(5);
    expect(panel.queryByText('₽', { exact: false, selector: '.stat-value' })).toBeNull();
  });

  it('calculates once amount, rate and term are entered', () => {
    render(<App />);
    fill('Сумма кредита', '3 000 000');
    fill('Ставка', '16,5');
    fill('Срок', '20');
    expect(within(loanPanel()).getAllByText('42 867,02 ₽').length).toBeGreaterThan(0);
  });

  it('shows a validation error for a negative amount', () => {
    render(<App />);
    fill('Сумма кредита', '-5');
    const panel = within(loanPanel());
    expect(panel.getByText('От 1 до 1 000 000 000 ₽')).toBeTruthy();
    expect(panel.getByLabelText('Сумма кредита').getAttribute('aria-invalid')).toBe('true');
    expect(panel.getAllByText('—').length).toBeGreaterThan(5);
  });

  it('ignores an added early repayment until it is filled in', () => {
    render(<App />);
    fill('Сумма кредита', '3 000 000');
    fill('Ставка', '16,5');
    fill('Срок', '20');
    fireEvent.click(within(loanPanel()).getByText('Добавить досрочное погашение'));
    expect(within(loanPanel()).getAllByText('42 867,02 ₽').length).toBeGreaterThan(0);
    expect(within(loanPanel()).queryByText('Введите число')).toBeNull();
  });

  it('keeps form state when switching tabs', () => {
    render(<App />);
    fill('Сумма кредита', '1 000 000');
    fireEvent.click(screen.getByRole('tab', { name: 'Вклад' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Кредит' }));
    expect((within(loanPanel()).getByLabelText('Сумма кредита') as HTMLInputElement).value).toBe(
      '1 000 000',
    );
  });
});
