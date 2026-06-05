import { t, Trans } from '@grafana/i18n';
import { Button, Stack, Text } from '@grafana/ui';

import { Step } from './Step';

interface SelectResourcesStepProps {
  number: number;
  selected: boolean;
  onSelectAll: () => void;
}

/**
 * Second step: pick the resources to migrate. For now the only option is to
 * select everything — a resource table for choosing specific folders and
 * dashboards is coming in a follow-up.
 */
export function SelectResourcesStep({ number, selected, onSelectAll }: SelectResourcesStepProps) {
  return (
    <Step
      number={number}
      title={t('provisioning.migrate.step-scope-title', 'Choose what to migrate')}
      description={t(
        'provisioning.migrate.step-scope-description',
        'Decide which dashboards and folders move into the repository.'
      )}
    >
      <Stack direction="column" gap={2} alignItems="flex-start">
        <Button
          variant={selected ? 'secondary' : 'primary'}
          icon={selected ? 'check' : undefined}
          onClick={onSelectAll}
        >
          {selected ? (
            <Trans i18nKey="provisioning.migrate.select-all-selected">Everything selected</Trans>
          ) : (
            <Trans i18nKey="provisioning.migrate.select-all-button">Select everything</Trans>
          )}
        </Button>
        <Text color="secondary" variant="bodySmall">
          <Trans i18nKey="provisioning.migrate.select-all-coming-soon">
            Choosing individual folders and dashboards is coming soon — a resource table will let you pick exactly what
            to migrate.
          </Trans>
        </Text>
      </Stack>
    </Step>
  );
}
