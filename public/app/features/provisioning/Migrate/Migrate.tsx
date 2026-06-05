import { useMemo, useState } from 'react';

import { FeatureState } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { type ComboboxOption, FeatureBadge, Stack, Text, TextLink } from '@grafana/ui';
import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { CONFIGURE_GRAFANA_DOCS_URL } from '../constants';

import { ConnectRepositoryStep } from './ConnectRepositoryStep';
import { MigrationComplete } from './MigrationComplete';
import { type MigrationMode, MigrationScopeStep } from './MigrationScopeStep';
import { StartMigrationStep } from './StartMigrationStep';

interface MigrateProps {
  repos?: Repository[];
}

/**
 * Migrate to GitOps tab. This is the entry point for moving existing folders
 * and dashboards into a Git repository. It walks the user through three steps —
 * connect a repository, choose what to migrate, and start the migration — and
 * swaps the whole flow for a confirmation once the migration completes.
 */
export function Migrate({ repos = [] }: MigrateProps) {
  const repoOptions = useMemo<Array<ComboboxOption<string>>>(
    () =>
      repos
        .filter((repo) => Boolean(repo.metadata?.name))
        .map((repo) => ({
          label: repo.spec?.title || repo.metadata?.name || '',
          value: repo.metadata?.name ?? '',
          description: repo.spec?.type,
        })),
    [repos]
  );

  // Only pre-select a repository when exactly one is connected. With several
  // repositories available we leave the choice to the user rather than guessing.
  const [selectedRepo, setSelectedRepo] = useState<string | undefined>(() =>
    repoOptions.length === 1 ? repoOptions[0].value : undefined
  );

  // Selective migration isn't available yet, so "everything" is the only mode.
  const [mode, setMode] = useState<MigrationMode>('everything');

  const [migrationComplete, setMigrationComplete] = useState(false);

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center">
          <Text element="h2" variant="h2">
            <Trans i18nKey="provisioning.migrate.header-title">Migrate to GitOps</Trans>
          </Text>
          <FeatureBadge featureState={FeatureState.experimental} />
        </Stack>
        <Text color="secondary">
          <Trans i18nKey="provisioning.migrate.header-subtitle">
            Manage your dashboards and folders like code — every change tracked, every update reviewed, every
            environment reproducible. Connect a Git repository to get started.
          </Trans>
        </Text>
      </Stack>

      {migrationComplete ? (
        <MigrationComplete onStartOver={() => setMigrationComplete(false)} />
      ) : (
        <>
          <ConnectRepositoryStep
            number={1}
            repos={repos}
            repoOptions={repoOptions}
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
          />

          <MigrationScopeStep number={2} mode={mode} onModeChange={setMode} />

          <StartMigrationStep number={3} disabled={!selectedRepo} onMigrate={() => setMigrationComplete(true)} />

          <Text color="secondary">
            <Trans i18nKey="provisioning.migrate.intro">
              New to Git Sync? Read the{' '}
              <TextLink external href={CONFIGURE_GRAFANA_DOCS_URL}>
                provisioning documentation
              </TextLink>{' '}
              to learn how it keeps Grafana and your repository in step.
            </Trans>
          </Text>
        </>
      )}
    </Stack>
  );
}
