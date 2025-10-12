import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModalProvider } from '../src/context/AuthModalContext';
import SignInModal from '../src/components/SignInModal';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AuthModalProvider>{children}</AuthModalProvider>;
}

test('modal opens and toggles between signin and signup', () => {
  function OpenButton() {
    // Dynamically import the hook to avoid top-level require in tests
    const [openFn, setOpenFn] = React.useState<(() => void) | null>(null);
    React.useEffect(() => {
      (async () => {
        const mod = await import('../src/context/AuthModalContext');
        setOpenFn(() => () => mod.useAuthModal().open());
      })();
    }, []);
    return <button onClick={() => openFn?.()}>open</button>;
  }

  render(
    <Wrapper>
      <OpenButton />
      <SignInModal />
    </Wrapper>
  );

  // Initially should not be visible
  expect(screen.queryByText(/Sign in/i)).toBeNull();

  // Open modal
  fireEvent.click(screen.getByText('open'));
  expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  // Switch to signup
  fireEvent.click(screen.getByText(/Create account/i));
  expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
});
