import { render, screen } from 'test/test-utils';

import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { Migrate } from './Migrate';

// Keep the unit focused on the step box and repository selector. The connect
// dropdown has its own coverage and pulls in frontend settings / navigation.
jest.mock('../Shared/ConnectRepositoryButton', () => ({
  ConnectRepositoryButton: () => <div>connect-repository-button</div>,
}));

function makeRepo(name: string, title: string): Repository {
  return {
    metadata: { name },
    spec: { title, type: 'github' },
  } as Repository;
}

describe('Migrate', () => {
  it('renders the Migrate to GitOps heading with an experimental badge', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /migrate to gitops/i })).toBeInTheDocument();
    expect(screen.getByText(/^experimental$/i)).toBeInTheDocument();
  });

  it('links to the provisioning documentation', () => {
    render(<Migrate />);

    const docsLink = screen.getByRole('link', { name: /provisioning documentation/i });
    expect(docsLink).toHaveAttribute('href', expect.stringContaining('grafana.com/docs'));
  });

  it('shows the connect-a-repository first step', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /connect a repository/i })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('connect-repository-button')).toBeInTheDocument();
  });

  it('does not render the repository selector when there are no repositories', () => {
    render(<Migrate repos={[]} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('pre-selects the repository when exactly one is connected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByRole('combobox')).toHaveValue('My only repo');
  });

  it('leaves the selection empty when several repositories are connected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'Repo one'), makeRepo('repo-2', 'Repo two')]} />);

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('shows the choose-what-to-migrate step with the everything mode selected', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /choose what to migrate/i })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/migrate everything/i)).toBeInTheDocument();
  });

  it('marks the selective migration option as coming soon and disabled', () => {
    render(<Migrate />);

    expect(screen.getByText(/choose specific folders/i)).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('shows the migrate step with the Git Sync limitations warning', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /start the migration/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/review git sync limitations/i)).toBeInTheDocument();
    expect(screen.getByText(/alerts and library panels are not supported/i)).toBeInTheDocument();
  });

  it('disables the migrate button until a target repository is selected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'Repo one'), makeRepo('repo-2', 'Repo two')]} />);

    // The button keeps a tooltip while disabled, so Grafana renders it with
    // aria-disabled rather than the native disabled attribute.
    expect(screen.getByRole('button', { name: /begin migration/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables the migrate button when a single repository is auto-selected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    expect(screen.getByRole('button', { name: /begin migration/i })).toBeEnabled();
  });
});
