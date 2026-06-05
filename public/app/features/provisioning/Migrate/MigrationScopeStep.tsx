import { t, Trans } from '@grafana/i18n';
import { Badge, Card, Stack } from '@grafana/ui';

import { Step } from './Step';

export type MigrationMode = 'everything' | 'selective';

interface MigrationScopeStepProps {
  number: number;
  mode: MigrationMode;
  onModeChange: (mode: MigrationMode) => void;
}

/**
 * Second step: choose how much of the instance to migrate. Selective migration
 * isn't available yet, so that option is disabled and marked "Coming soon".
 */
export function MigrationScopeStep({ number, mode, onModeChange }: MigrationScopeStepProps) {
  return (
    <Step
      number={number}
      title={t('provisioning.migrate.step-scope-title', 'Choose what to migrate')}
      description={t(
        'provisioning.migrate.step-scope-description',
        'Decide how much of your Grafana instance moves into the repository.'
      )}
    >
      <Stack direction="column" gap={1}>
        <Card noMargin isSelected={mode === 'everything'} onClick={() => onModeChange('everything')}>
          <Card.Heading>
            <Trans i18nKey="provisioning.migrate.scope-everything-title">Migrate everything</Trans>
          </Card.Heading>
          <Card.Description>
            <Trans i18nKey="provisioning.migrate.scope-everything-description">
              Move all of your folders and dashboards into the repository in a single migration. This is the simplest
              way to get your whole instance under version control.
            </Trans>
          </Card.Description>
        </Card>

        <Card noMargin isSelected={mode === 'selective'} disabled>
          <Card.Heading>
            <Trans i18nKey="provisioning.migrate.scope-selective-title">Choose specific folders</Trans>
          </Card.Heading>
          <Card.Tags>
            <Badge color="blue" text={t('provisioning.migrate.scope-selective-badge', 'Coming soon')} />
          </Card.Tags>
          <Card.Description>
            <Trans i18nKey="provisioning.migrate.scope-selective-description">
              Pick individual folders and dashboards to migrate while leaving the rest of your instance untouched.
            </Trans>
          </Card.Description>
        </Card>
      </Stack>
    </Step>
  );
}
