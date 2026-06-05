import { render, screen } from 'test/test-utils';

import { type StepStatusInfo } from '../Wizard/types';

import { MigrateModal } from './MigrateModal';

const mockCreateSyncJob = jest.fn();

// Capture JobStatus props so we can drive its status callback from the tests.
let lastJobStatusProps: { onStatusChange?: (info: StepStatusInfo) => void } = {};

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

describe('MigrateModal', () => {
  beforeEach(() => {
    mockCreateSyncJob.mockReset();
    mockCreateSyncJob.mockResolvedValue({ metadata: { name: 'job-1' } });
    lastJobStatusProps = {};
  });

  it('shows the confirmation with the repository name and the limitations banner', () => {
    render(<MigrateModal repoName="repo-1" repoLabel="org/my-repo" onDismiss={jest.fn()} />);

    expect(screen.getByText(/start migration\?/i)).toBeInTheDocument();
    // The repository name must render verbatim (no HTML-escaped slash).
    expect(screen.getByText(/org\/my-repo/)).toBeInTheDocument();
    expect(screen.getByText('git-sync-limitations')).toBeInTheDocument();
    expect(mockCreateSyncJob).not.toHaveBeenCalled();
  });

  it('does not start the migration when cancelled', async () => {
    const onDismiss = jest.fn();
    const { user } = render(<MigrateModal repoName="repo-1" repoLabel="org/my-repo" onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDismiss).toHaveBeenCalled();
    expect(mockCreateSyncJob).not.toHaveBeenCalled();
  });

  it('runs the migration job and shows its progress after confirming', async () => {
    const { user } = render(<MigrateModal repoName="repo-1" repoLabel="org/my-repo" onDismiss={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /migrate everything/i }));

    expect(mockCreateSyncJob).toHaveBeenCalledWith(true);
    expect(await screen.findByText('job-status')).toBeInTheDocument();
    // The confirmation is replaced by the job progress view.
    expect(screen.queryByText('git-sync-limitations')).not.toBeInTheDocument();
  });

  it('notifies the caller once the migration job finishes successfully', async () => {
    const onMigrated = jest.fn();
    const { user } = render(
      <MigrateModal repoName="repo-1" repoLabel="org/my-repo" onDismiss={jest.fn()} onMigrated={onMigrated} />
    );

    await user.click(screen.getByRole('button', { name: /migrate everything/i }));
    await screen.findByText('job-status');

    // Still running — no refresh yet.
    lastJobStatusProps.onStatusChange?.({ status: 'running' });
    expect(onMigrated).not.toHaveBeenCalled();

    lastJobStatusProps.onStatusChange?.({ status: 'success' });
    expect(onMigrated).toHaveBeenCalledTimes(1);

    // Repeated success callbacks must not fire it again.
    lastJobStatusProps.onStatusChange?.({ status: 'success' });
    expect(onMigrated).toHaveBeenCalledTimes(1);
  });
});
