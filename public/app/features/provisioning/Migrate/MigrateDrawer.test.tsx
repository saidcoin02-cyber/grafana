import { render, screen } from 'test/test-utils';

import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { type StepStatusInfo } from '../Wizard/types';

import { MigrateDrawer } from './MigrateDrawer';

const mockCreateSyncJob = jest.fn();

// Capture JobStatus props so we can drive its status callback from the tests.
let lastJobStatusProps: { onStatusChange?: (info: StepStatusInfo) => void } = {};

jest.mock('../Shared/ConnectRepositoryButton', () => ({
  ConnectRepositoryButton: () => <div>connect-repository-button</div>,
}));
jest.mock('../Shared/GitSyncLimitationsAlert', () => ({
  GitSyncLimitationsAlert: () => <div>git-sync-limitations</div>,
}));
jest.mock('../Job/JobStatus', () => ({
  JobStatus: (props: { onStatusChange?: (info: StepStatusInfo) => void }) => {
    lastJobStatusProps = props;
    return <div>job-status</div>;
  },
}));
jest.mock('../Wizard/hooks/useCreateSyncJob', () => ({
  useCreateSyncJob: () => ({ createSyncJob: mockCreateSyncJob, isLoading: false }),
}));

function makeRepo(name: string, title: string): Repository {
  return {
    metadata: { name },
    spec: { title, type: 'github' },
  } as Repository;
}

describe('MigrateDrawer', () => {
  beforeEach(() => {
    mockCreateSyncJob.mockReset();
    mockCreateSyncJob.mockResolvedValue({ metadata: { name: 'job-1' } });
    lastJobStatusProps = {};
  });

  it('shows the repository selector and limitations banner before migrating', () => {
    render(<MigrateDrawer repos={[makeRepo('repo-1', 'My only repo')]} onDismiss={jest.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('My only repo');
    expect(screen.getByText('git-sync-limitations')).toBeInTheDocument();
    expect(mockCreateSyncJob).not.toHaveBeenCalled();
  });

  it('pre-selects nothing and disables migrate when several repositories exist', () => {
    render(
      <MigrateDrawer repos={[makeRepo('repo-1', 'Repo one'), makeRepo('repo-2', 'Repo two')]} onDismiss={jest.fn()} />
    );

    expect(screen.getByRole('combobox')).toHaveValue('');
    // The button keeps a tooltip while disabled, so it uses aria-disabled.
    expect(screen.getByRole('button', { name: /migrate everything/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not start the migration when cancelled', async () => {
    const onDismiss = jest.fn();
    const { user } = render(<MigrateDrawer repos={[makeRepo('repo-1', 'My only repo')]} onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDismiss).toHaveBeenCalled();
    expect(mockCreateSyncJob).not.toHaveBeenCalled();
  });

  it('runs the migration job and shows its progress after confirming', async () => {
    const { user } = render(<MigrateDrawer repos={[makeRepo('repo-1', 'My only repo')]} onDismiss={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /migrate everything/i }));

    expect(mockCreateSyncJob).toHaveBeenCalledWith(true);
    expect(await screen.findByText('job-status')).toBeInTheDocument();
    // The setup view is replaced by the job progress view.
    expect(screen.queryByText('git-sync-limitations')).not.toBeInTheDocument();
  });

  it('notifies the caller once the migration job finishes successfully', async () => {
    const onMigrated = jest.fn();
    const { user } = render(
      <MigrateDrawer repos={[makeRepo('repo-1', 'My only repo')]} onDismiss={jest.fn()} onMigrated={onMigrated} />
    );

    await user.click(screen.getByRole('button', { name: /migrate everything/i }));
    await screen.findByText('job-status');

    lastJobStatusProps.onStatusChange?.({ status: 'running' });
    expect(onMigrated).not.toHaveBeenCalled();

    lastJobStatusProps.onStatusChange?.({ status: 'success' });
    expect(onMigrated).toHaveBeenCalledTimes(1);

    // Repeated success callbacks must not fire it again.
    lastJobStatusProps.onStatusChange?.({ status: 'success' });
    expect(onMigrated).toHaveBeenCalledTimes(1);
  });
});
