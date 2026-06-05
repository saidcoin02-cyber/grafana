import { render, screen } from 'test/test-utils';

import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { Migrate } from './Migrate';

let mockStatsResult: { data?: { unmanaged?: Array<{ group: string; count: number }> }; isLoading: boolean };

// Keep the unit focused on the page. The connect dropdown and the migrate modal
// (confirmation + job run) have their own coverage.
jest.mock('../Shared/ConnectRepositoryButton', () => ({
  ConnectRepositoryButton: () => <div>connect-repository-button</div>,
}));
jest.mock('./MigrateModal', () => ({
  MigrateModal: ({ repoLabel }: { repoLabel: string }) => <div>migrate-modal:{repoLabel}</div>,
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

  it('opens the migration modal for the selected repository', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.queryByText(/migrate-modal/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /migrate everything/i }));

    expect(screen.getByText('migrate-modal:My only repo')).toBeInTheDocument();
  });
});
