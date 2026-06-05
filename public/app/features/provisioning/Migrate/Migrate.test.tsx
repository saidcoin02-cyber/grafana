import { within } from '@testing-library/react';
import { render, screen } from 'test/test-utils';

import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { Migrate } from './Migrate';

const mockCreateSyncJob = jest.fn();
let mockStatsResult: { data?: { unmanaged?: Array<{ group: string; count: number }> }; isLoading: boolean };

// Keep the unit focused on the migration tool. The connect dropdown, the job
// progress view, and the limitations alert have their own coverage and pull in
// frontend settings / live queries / feature flags.
jest.mock('../Shared/ConnectRepositoryButton', () => ({
  ConnectRepositoryButton: () => <div>connect-repository-button</div>,
}));
jest.mock('../Shared/GitSyncLimitationsAlert', () => ({
  GitSyncLimitationsAlert: () => <div>git-sync-limitations</div>,
}));
jest.mock('../Job/JobStatus', () => ({
  JobStatus: () => <div>job-status</div>,
}));
jest.mock('../Wizard/hooks/useCreateSyncJob', () => ({
  useCreateSyncJob: () => ({ createSyncJob: mockCreateSyncJob, isLoading: false }),
}));
jest.mock('app/api/clients/provisioning/v0alpha1', () => ({
  ...jest.requireActual('app/api/clients/provisioning/v0alpha1'),
  useGetResourceStatsQuery: () => mockStatsResult,
}));

function makeRepo(name: string, title: string): Repository {
  return {
    metadata: { name },
    spec: { title, type: 'github' },
  } as Repository;
}

describe('Migrate', () => {
  beforeEach(() => {
    mockCreateSyncJob.mockReset();
    mockCreateSyncJob.mockResolvedValue({ metadata: { name: 'job-1' } });
    // Default: there are unmanaged resources, so the migration form is shown.
    mockStatsResult = { data: { unmanaged: [{ group: 'dashboard.grafana.app', count: 3 }] }, isLoading: false };
  });

  it('renders the Migrate to GitOps heading with an experimental badge', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /migrate to gitops/i })).toBeInTheDocument();
    expect(screen.getByText(/^experimental$/i)).toBeInTheDocument();
  });

  it('shows a loading state while resource stats are fetched', () => {
    mockStatsResult = { isLoading: true };
    render(<Migrate />);

    expect(screen.getByText(/checking for resources to migrate/i)).toBeInTheDocument();
  });

  it('shows a success state when there are no unmanaged resources', () => {
    mockStatsResult = { data: { unmanaged: [] }, isLoading: false };
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByRole('heading', { name: /everything is managed in git/i })).toBeInTheDocument();
    // The setup controls are hidden when there's nothing to migrate.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /migrate everything/i })).not.toBeInTheDocument();
  });

  it('shows the coming-soon note for selective migration', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByText(/selected dashboards and folders is coming soon/i)).toBeInTheDocument();
  });

  it('does not render the repository selector when there are no repositories', () => {
    render(<Migrate repos={[]} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('connect-repository-button')).toBeInTheDocument();
  });

  it('pre-selects the repository when exactly one is connected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByRole('combobox')).toHaveValue('My only repo');
  });

  it('leaves the selection empty when several repositories are connected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'Repo one'), makeRepo('repo-2', 'Repo two')]} />);

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('keeps the migrate button disabled until a repository is selected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'Repo one'), makeRepo('repo-2', 'Repo two')]} />);

    // The button keeps a tooltip while disabled, so Grafana renders it with
    // aria-disabled rather than the native disabled attribute.
    expect(screen.getByRole('button', { name: /migrate everything/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the Git Sync limitations only in the confirmation dialog', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    // Not shown inline.
    expect(screen.queryByText('git-sync-limitations')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Migrate everything' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/start migration\?/i)).toBeInTheDocument();
    expect(within(dialog).getByText('git-sync-limitations')).toBeInTheDocument();
    // Nothing happens until the user confirms.
    expect(mockCreateSyncJob).not.toHaveBeenCalled();
  });

  it('starts the migration job and shows its progress after confirming', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    await user.click(screen.getByRole('button', { name: 'Migrate everything' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Migrate everything' }));

    expect(mockCreateSyncJob).toHaveBeenCalledWith(true);
    expect(await screen.findByText('job-status')).toBeInTheDocument();
    // The setup form is replaced by the job progress view.
    expect(screen.queryByRole('button', { name: /migrate everything/i })).not.toBeInTheDocument();
  });

  it('does not start the migration when the confirmation is dismissed', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    await user.click(screen.getByRole('button', { name: 'Migrate everything' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    expect(mockCreateSyncJob).not.toHaveBeenCalled();
    expect(screen.getByText('connect-repository-button')).toBeInTheDocument();
  });
});
