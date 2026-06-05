import { render, screen } from 'test/test-utils';

import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { Migrate } from './Migrate';

let mockStatsResult: {
  data?: { unmanaged?: Array<{ group: string; count: number }> };
  isLoading: boolean;
  isSuccess?: boolean;
};

// Keep the unit focused on the page. The migrate drawer (repository selection,
// confirmation, and job run) has its own coverage.
jest.mock('./MigrateDrawer', () => ({
  MigrateDrawer: () => <div>migrate-drawer</div>,
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
    // Default: there are unmanaged resources, so the migration tool is shown.
    mockStatsResult = {
      data: { unmanaged: [{ group: 'dashboard.grafana.app', count: 3 }] },
      isLoading: false,
      isSuccess: true,
    };
  });

  it('renders the Migrate to GitOps heading with an experimental badge', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /migrate to gitops/i })).toBeInTheDocument();
    expect(screen.getByText(/^experimental$/i)).toBeInTheDocument();
  });

  it('shows a loading state while resource stats are fetched', () => {
    mockStatsResult = { isLoading: true, isSuccess: false };
    render(<Migrate />);

    expect(screen.getByText(/checking for resources to migrate/i)).toBeInTheDocument();
  });

  it('shows a success state when there are no unmanaged resources', () => {
    mockStatsResult = { data: { unmanaged: [] }, isLoading: false, isSuccess: true };
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByRole('heading', { name: /everything is managed in git/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start migration/i })).not.toBeInTheDocument();
  });

  it('shows the migration tool (not the success state) when the stats query fails', () => {
    // Errored/empty response: no data, not successful. Count is 0 but we must
    // not mistake that for "nothing to migrate".
    mockStatsResult = { isLoading: false, isSuccess: false };
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.queryByRole('heading', { name: /everything is managed in git/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start migration/i })).toBeInTheDocument();
  });

  it('opens the migration drawer when starting a migration', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.queryByText('migrate-drawer')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start migration/i }));

    expect(screen.getByText('migrate-drawer')).toBeInTheDocument();
  });
});
