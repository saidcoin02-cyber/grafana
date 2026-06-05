import { render, screen } from 'test/test-utils';

import { Migrate } from './Migrate';
import { type FolderRow, useFolderMigrationData } from './hooks/useFolderMigrationData';

jest.mock('./hooks/useFolderMigrationData', () => ({
  useFolderMigrationData: jest.fn(),
}));

const mockUseFolderMigrationData = jest.mocked(useFolderMigrationData);

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

function mockMigrationData(overrides: Partial<ReturnType<typeof useFolderMigrationData>> = {}) {
  mockUseFolderMigrationData.mockReturnValue({
    data: folders,
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe('Migrate', () => {
  beforeEach(() => {
    mockMigrationData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading spinner while the folders are loading', () => {
    mockMigrationData({ data: [], isLoading: true });

    render(<Migrate />);

    expect(screen.getByText(/loading folders/i)).toBeInTheDocument();
  });

  it('renders an error alert when loading the folders fails', () => {
    mockMigrationData({ data: [], isError: true });

    render(<Migrate />);

    expect(screen.getByText(/failed to load folder list/i)).toBeInTheDocument();
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
