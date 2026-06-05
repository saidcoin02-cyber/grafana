import { useRef, useState } from 'react';

import { t, Trans } from '@grafana/i18n';
import { Button, Modal, Stack, Text } from '@grafana/ui';
import { type Job } from 'app/api/clients/provisioning/v0alpha1';

import { JobStatus } from '../Job/JobStatus';
import { GitSyncLimitationsAlert } from '../Shared/GitSyncLimitationsAlert';
import { useCreateSyncJob } from '../Wizard/hooks/useCreateSyncJob';
import { type StepStatusInfo } from '../Wizard/types';

interface MigrateModalProps {
  repoName: string;
  repoLabel: string;
  onDismiss: () => void;
  /** Called once the migration job finishes successfully, so callers can refresh derived state. */
  onMigrated?: () => void;
}

/**
 * Confirms and runs a "migrate everything" job for the selected repository,
 * then shows its progress and result — all inside a single modal. Rendered only
 * while open so each migration starts from a clean state.
 */
export function MigrateModal({ repoName, repoLabel, onDismiss, onMigrated }: MigrateModalProps) {
  const { createSyncJob, isLoading } = useCreateSyncJob({ repoName });
  const [job, setJob] = useState<Job>();
  const migratedRef = useRef(false);

  const startMigration = async () => {
    const response = await createSyncJob(true);
    if (response) {
      setJob(response);
    }
  };

  const retryMigration = () => {
    migratedRef.current = false;
    setJob(undefined);
    void startMigration();
  };

  // JobStatus reports status changes as it polls; notify the caller once the
  // migration succeeds so it can refresh resource stats (the job invalidates
  // them server-side, but we trigger an explicit refetch to be safe).
  const handleStatusChange = (info: StepStatusInfo) => {
    if (info.status === 'success' && !migratedRef.current) {
      migratedRef.current = true;
      onMigrated?.();
    }
  };

  const title = job
    ? t('provisioning.migrate.modal-title-running', 'Migrating to GitOps')
    : t('provisioning.migrate.modal-title-confirm', 'Start migration?');

  return (
    <Modal isOpen title={title} onDismiss={onDismiss}>
      {job ? (
        <JobStatus watch={job} jobType="sync" onStatusChange={handleStatusChange} onRetry={retryMigration} />
      ) : (
        <Stack direction="column" gap={2}>
          <Text>
            {t(
              'provisioning.migrate.confirm-body',
              'All dashboards and folders will be migrated into "{{repo}}". This is a one-time operation.',
              { repo: repoLabel, interpolation: { escapeValue: false } }
            )}
          </Text>
          <GitSyncLimitationsAlert syncTarget="instance" />
          <Modal.ButtonRow>
            <Button variant="secondary" fill="outline" onClick={onDismiss}>
              <Trans i18nKey="provisioning.migrate.confirm-cancel">Cancel</Trans>
            </Button>
            <Button variant="primary" onClick={startMigration} disabled={isLoading}>
              <Trans i18nKey="provisioning.migrate.confirm-button">Migrate everything</Trans>
            </Button>
          </Modal.ButtonRow>
        </Stack>
      )}
    </Modal>
  );
}
