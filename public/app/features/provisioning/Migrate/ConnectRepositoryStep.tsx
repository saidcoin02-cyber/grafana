import { t } from '@grafana/i18n';
import { Combobox, type ComboboxOption, Field, Stack } from '@grafana/ui';
import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { ConnectRepositoryButton } from '../Shared/ConnectRepositoryButton';

import { Step } from './Step';

interface ConnectRepositoryStepProps {
  number: number;
  repos: Repository[];
  repoOptions: Array<ComboboxOption<string>>;
  selectedRepo?: string;
  onSelectRepo: (repo: string | undefined) => void;
}

/**
 * First step of the migration flow: pick (or connect) the repository the
 * dashboards and folders will be migrated into. Highlighted as the entry point.
 */
export function ConnectRepositoryStep({
  number,
  repos,
  repoOptions,
  selectedRepo,
  onSelectRepo,
}: ConnectRepositoryStepProps) {
  return (
    <Step
      number={number}
      highlight
      title={t('provisioning.migrate.step-connect-title', 'Connect a repository')}
      description={t(
        'provisioning.migrate.step-connect-description',
        'Choose the Git repository your dashboards and folders will be migrated into. Start here.'
      )}
    >
      <Stack direction="row" gap={1} alignItems="flex-end" wrap="wrap">
        {repoOptions.length > 0 && (
          <Field noMargin label={t('provisioning.migrate.step-connect-repo-label', 'Target repository')}>
            <Combobox
              id="migrate-target-repository"
              width={40}
              options={repoOptions}
              value={selectedRepo ?? null}
              placeholder={t('provisioning.migrate.step-connect-repo-placeholder', 'Select a repository')}
              onChange={(option) => onSelectRepo(option.value)}
            />
          </Field>
        )}
        <ConnectRepositoryButton items={repos} />
      </Stack>
    </Step>
  );
}
