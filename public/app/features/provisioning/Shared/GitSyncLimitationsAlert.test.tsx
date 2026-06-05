import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { render, screen } from 'test/test-utils';

import { GitSyncLimitationsAlert } from './GitSyncLimitationsAlert';

jest.mock('@openfeature/react-sdk', () => ({
  ...jest.requireActual('@openfeature/react-sdk'),
  useBooleanFlagValue: jest.fn(() => false),
}));

const mockUseBooleanFlagValue = jest.mocked(useBooleanFlagValue);

describe('GitSyncLimitationsAlert', () => {
  beforeEach(() => {
    mockUseBooleanFlagValue.mockReturnValue(false);
  });

  it('shows the limitations, docs link and announcement banner advice', () => {
    render(<GitSyncLimitationsAlert />);

    expect(screen.getByText(/review git sync limitations before proceeding/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /git sync documentation/i })).toHaveAttribute(
      'href',
      expect.stringContaining('grafana.com/docs')
    );
    expect(screen.getByText(/announcement banner/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /this guide/i })).toHaveAttribute(
      'href',
      expect.stringContaining('announcement-banner')
    );
  });

  it('warns that alerts and library panels are lost for an instance migration', () => {
    render(<GitSyncLimitationsAlert syncTarget="instance" />);

    expect(screen.getByText(/existing alerts and library panels will be lost/i)).toBeInTheDocument();
    expect(screen.queryByText(/folder structure will be replicated/i)).not.toBeInTheDocument();
  });

  it('explains the folder caveats for a folder migration', () => {
    render(<GitSyncLimitationsAlert syncTarget="folder" />);

    expect(screen.getByText(/folder structure will be replicated/i)).toBeInTheDocument();
    expect(screen.getByText(/manually remove or manage original folders/i)).toBeInTheDocument();
    expect(screen.queryByText(/existing alerts and library panels will be lost/i)).not.toBeInTheDocument();
  });

  it('shows the fine-grained permissions caveat only when folder metadata is disabled', () => {
    const { rerender } = render(<GitSyncLimitationsAlert />);
    expect(screen.getByText(/fine-grained permissions are not supported/i)).toBeInTheDocument();

    mockUseBooleanFlagValue.mockReturnValue(true);
    rerender(<GitSyncLimitationsAlert />);
    expect(screen.queryByText(/fine-grained permissions are not supported/i)).not.toBeInTheDocument();
  });
});
