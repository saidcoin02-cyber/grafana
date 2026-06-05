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

  it('lets the user select everything and promises an upcoming resource table', async () => {
    const { user } = render(<Migrate />);

    expect(screen.getByRole('heading', { name: /choose what to migrate/i })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /select everything/i }));

    expect(screen.getByRole('button', { name: /everything selected/i })).toBeInTheDocument();
  });

  it('shows the migrate step with the Git Sync limitations warning', () => {
    render(<Migrate />);

    expect(screen.getByRole('heading', { name: /start the migration/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/review git sync limitations/i)).toBeInTheDocument();
    expect(screen.getByText(/alerts and library panels are not supported/i)).toBeInTheDocument();
  });

  it('keeps the migrate button disabled until a repository and resources are selected', () => {
    render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    // The repository is auto-selected, but nothing has been selected to migrate
    // yet. The button keeps a tooltip while disabled, so Grafana renders it with
    // aria-disabled rather than the native disabled attribute.
    expect(screen.getByRole('button', { name: /begin migration/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables the migrate button once a repository and everything are selected', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    await user.click(screen.getByRole('button', { name: /select everything/i }));

    expect(screen.getByRole('button', { name: /begin migration/i })).toBeEnabled();
  });

  it('replaces the steps with a congratulations panel once migration completes', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    await user.click(screen.getByRole('button', { name: /select everything/i }));
    await user.click(screen.getByRole('button', { name: /begin migration/i }));

    expect(screen.getByRole('heading', { name: /migration complete/i })).toBeInTheDocument();
    // The step-by-step flow is hidden once the migration is done.
    expect(screen.queryByRole('heading', { name: /connect a repository/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /start the migration/i })).not.toBeInTheDocument();
  });

  it('returns to the steps when starting over from the congratulations panel', async () => {
    const { user } = render(<Migrate repos={[makeRepo('repo-1', 'My only repo')]} />);

    await user.click(screen.getByRole('button', { name: /select everything/i }));
    await user.click(screen.getByRole('button', { name: /begin migration/i }));
    await user.click(screen.getByRole('button', { name: /start over/i }));

    expect(screen.getByRole('heading', { name: /connect a repository/i })).toBeInTheDocument();
  });
});
