import { render, screen } from 'test/test-utils';

import { Migrate } from './Migrate';
import { type FolderRow, useFolderLeaderboard } from './hooks/useFolderLeaderboard';

jest.mock('./hooks/useFolderLeaderboard', () => ({
  useFolderLeaderboard: jest.fn(),
}));

const mockUseFolderLeaderboard = jest.mocked(useFolderLeaderboard);

const folders: FolderRow[] = [
  {
    uid: 'unmanaged-folder',
    title: 'Unmanaged Folder',
    dashboardCount: 2,
    directDashboards: [
      { uid: 'd1', title: 'Dashboard One', url: '/d/d1' },
      { uid: 'd2', title: 'Dashboard Two', url: '/d/d2' },
    ],
    subfolders: [],
    allDashboards: [
      { uid: 'd1', title: 'Dashboard One', url: '/d/d1' },
      { uid: 'd2', title: 'Dashboard Two', url: '/d/d2' },
    ],
  },
  {
    uid: 'managed-folder',
    title: 'Managed Folder',
    managedBy: 'repo',
    dashboardCount: 3,
    directDashboards: [],
    subfolders: [],
    allDashboards: [],
  },
];

function mockLeaderboard(overrides: Partial<ReturnType<typeof useFolderLeaderboard>> = {}) {
  mockUseFolderLeaderboard.mockReturnValue({
    data: folders,
    isLoading: false,
    isError: false,
    isTruncated: false,
    ...overrides,
  });
}

describe('Migrate', () => {
  beforeEach(() => {
    mockLeaderboard();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading spinner while the folder leaderboard is loading', () => {
    mockLeaderboard({ data: [], isLoading: true });

    render(<Migrate />);

    expect(screen.getByText(/loading folders/i)).toBeInTheDocument();
  });

  it('renders an error alert when the folder leaderboard fails', () => {
    mockLeaderboard({ data: [], isError: true });

    render(<Migrate />);

    expect(screen.getByText(/failed to load folder list/i)).toBeInTheDocument();
  });

  it('renders a truncation warning when the leaderboard is truncated', () => {
    mockLeaderboard({ isTruncated: true });

    render(<Migrate />);

    expect(screen.getByText(/partial view of folders and dashboards/i)).toBeInTheDocument();
  });

  it('renders the header with an experimental badge', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /migrate to gitops/i })).toBeInTheDocument();
    expect(screen.getByText(/^experimental$/i)).toBeInTheDocument();
  });

  it('renders unmanaged folders in the table and hides managed ones', () => {
    render(<Migrate />);

    expect(screen.getByText('Dashboards to migrate')).toBeInTheDocument();
    expect(screen.getByText('Unmanaged Folder')).toBeInTheDocument();
    expect(screen.queryByText('Managed Folder')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 folders')).toBeInTheDocument();
  });

  it('expands a folder to reveal its dashboards', async () => {
    const { user } = render(<Migrate />);

    // Dashboards are hidden until the folder is expanded.
    expect(screen.queryByText('Dashboard One')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /expand unmanaged folder/i }));

    expect(screen.getByText('Dashboard One')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Two')).toBeInTheDocument();
  });
});
