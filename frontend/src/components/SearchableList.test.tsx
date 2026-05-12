import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableList } from './SearchableList';

interface Item {
  id: number;
  name: string;
}

const items: Item[] = [
  { id: 1, name: 'Anna' },
  { id: 2, name: 'Bob' },
];

function renderList(overrides: Partial<React.ComponentProps<typeof SearchableList<Item>>> = {}) {
  return render(
    <SearchableList<Item>
      items={items}
      isLoading={false}
      error={null}
      searchValue=""
      onSearchChange={vi.fn()}
      getItemId={(i) => i.id}
      renderItem={(i) => <span>{i.name}</span>}
      renderDetail={(id) => <div data-testid="detail">id: {id}</div>}
      {...overrides}
    />,
  );
}

describe('<SearchableList>', () => {
  it('renders every item', () => {
    renderList();
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the detail panel only after selecting an item', async () => {
    const user = userEvent.setup();
    renderList();

    expect(screen.queryByTestId('detail')).not.toBeInTheDocument();

    await user.click(screen.getByText('Anna'));

    expect(screen.getByTestId('detail')).toHaveTextContent('id: 1');
  });

  it('forwards typed input via onSearchChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderList({ onSearchChange });

    await user.type(screen.getByPlaceholderText('Search…'), 'a');

    // userEvent.type fires once per character; just verify it was called.
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('shows the loading state', () => {
    renderList({ isLoading: true, items: undefined });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows the empty message when items is an empty array', () => {
    renderList({ items: [], emptyMessage: 'Nothing here' });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('clears the selection if the selected item disappears', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchableList<Item>
        items={items}
        isLoading={false}
        error={null}
        searchValue=""
        onSearchChange={vi.fn()}
        getItemId={(i) => i.id}
        renderItem={(i) => <span>{i.name}</span>}
        renderDetail={(id) => <div data-testid="detail">id: {id}</div>}
      />,
    );

    await user.click(screen.getByText('Anna'));
    expect(screen.getByTestId('detail')).toBeInTheDocument();

    // Re-render without Anna; the detail should hide.
    rerender(
      <SearchableList<Item>
        items={[{ id: 2, name: 'Bob' }]}
        isLoading={false}
        error={null}
        searchValue=""
        onSearchChange={vi.fn()}
        getItemId={(i) => i.id}
        renderItem={(i) => <span>{i.name}</span>}
        renderDetail={(id) => <div data-testid="detail">id: {id}</div>}
      />,
    );

    expect(screen.queryByTestId('detail')).not.toBeInTheDocument();
  });
});
