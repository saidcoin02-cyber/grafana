import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Combobox, EmptyState, FilterInput, Icon, IconButton, Stack, Text, useStyles2 } from '@grafana/ui';

import { type FolderRow } from './hooks/useFolderLeaderboard';

type SortKey = 'count-desc' | 'count-asc' | 'title-asc' | 'title-desc';

function compareFolders(a: FolderRow, b: FolderRow, key: SortKey): number {
  switch (key) {
    case 'count-desc':
      if (b.dashboardCount !== a.dashboardCount) {
        return b.dashboardCount - a.dashboardCount;
      }
      // eslint-disable-next-line @grafana/no-locale-compare
      return a.title.localeCompare(b.title);
    case 'count-asc':
      if (a.dashboardCount !== b.dashboardCount) {
        return a.dashboardCount - b.dashboardCount;
      }
      // eslint-disable-next-line @grafana/no-locale-compare
      return a.title.localeCompare(b.title);
    case 'title-asc':
      // eslint-disable-next-line @grafana/no-locale-compare
      return a.title.localeCompare(b.title);
    case 'title-desc':
      // eslint-disable-next-line @grafana/no-locale-compare
      return b.title.localeCompare(a.title);
  }
}

interface Props {
  folders: FolderRow[];
}

/**
 * Foldable, searchable list of unmanaged folders with their direct dashboards.
 * Each folder expands to reveal the dashboards that live directly inside it.
 * Already-managed folders are filtered out — the panel is scoped to migration
 * targets only. This slice is read-only: selection and the migrate action land
 * in a follow-up change.
 */
export function FoldersToMigrate({ folders }: Props) {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('count-desc');

  const unmanagedFolders = useMemo(() => folders.filter((f) => !f.managedBy && f.dashboardCount > 0), [folders]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = !q
      ? unmanagedFolders.slice()
      : unmanagedFolders.filter((folder) => {
          if (folder.title.toLowerCase().includes(q)) {
            return true;
          }
          return folder.directDashboards.some((d) => d.title.toLowerCase().includes(q));
        });
    matched.sort((a, b) => compareFolders(a, b, sortKey));
    return matched;
  }, [unmanagedFolders, search, sortKey]);

  const toggleExpanded = (uid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  return (
    <div className={styles.panel} id="folders-to-migrate">
      <Stack direction="column" gap={0.5}>
        <Text variant="h5">
          <Trans i18nKey="provisioning.migrate.dashboards-to-migrate-heading">Dashboards to migrate</Trans>
        </Text>
        <Text color="secondary" variant="bodySmall">
          <Trans i18nKey="provisioning.migrate.dashboards-to-migrate-subtitle">
            Folders and dashboards on this instance that are not yet managed by GitOps.
          </Trans>
        </Text>
      </Stack>

      <Stack direction="row" gap={1} alignItems="center" wrap>
        <div className={styles.searchInput}>
          <FilterInput
            placeholder={t('provisioning.migrate.dashboards-to-migrate-search', 'Search folders and dashboards')}
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className={styles.sortInput}>
          <Combobox<SortKey>
            options={[
              {
                value: 'count-desc',
                label: t('provisioning.migrate.dashboards-sort-count-desc', 'Most dashboards'),
              },
              {
                value: 'count-asc',
                label: t('provisioning.migrate.dashboards-sort-count-asc', 'Fewest dashboards'),
              },
              { value: 'title-asc', label: t('provisioning.migrate.dashboards-sort-title-asc', 'Name (A–Z)') },
              {
                value: 'title-desc',
                label: t('provisioning.migrate.dashboards-sort-title-desc', 'Name (Z–A)'),
              },
            ]}
            value={sortKey}
            onChange={(opt) => {
              if (opt?.value) {
                setSortKey(opt.value);
              }
            }}
            aria-label={t('provisioning.migrate.dashboards-sort-aria', 'Sort folders')}
          />
        </div>
      </Stack>

      {filtered.length === 0 ? (
        <EmptyState
          variant="not-found"
          message={
            unmanagedFolders.length === 0
              ? t('provisioning.migrate.dashboards-to-migrate-all-managed', 'All folders are already managed.')
              : t(
                  'provisioning.migrate.dashboards-to-migrate-empty',
                  'No folders or dashboards match the current search.'
                )
          }
        />
      ) : (
        <div className={styles.list}>
          {filtered.map((folder) => (
            <FolderEntry
              key={folder.uid}
              folder={folder}
              isExpanded={expanded.has(folder.uid)}
              onToggleExpanded={() => toggleExpanded(folder.uid)}
            />
          ))}
        </div>
      )}

      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between" wrap>
        <Text variant="bodySmall" color="secondary">
          {t('provisioning.migrate.dashboards-to-migrate-footer', 'Showing {{count}} of {{total}} folders', {
            count: filtered.length,
            total: unmanagedFolders.length,
          })}
        </Text>
      </Stack>
    </div>
  );
}

interface FolderEntryProps {
  folder: FolderRow;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function FolderEntry({ folder, isExpanded, onToggleExpanded }: FolderEntryProps) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        <IconButton
          name={isExpanded ? 'angle-down' : 'angle-right'}
          aria-label={
            isExpanded
              ? t('provisioning.migrate.dashboards-collapse', 'Collapse {{folder}}', { folder: folder.title })
              : t('provisioning.migrate.dashboards-expand', 'Expand {{folder}}', { folder: folder.title })
          }
          onClick={onToggleExpanded}
        />
        <Icon name="folder" />
        <Stack direction="column" gap={0} flex={1}>
          <Text>{folder.title}</Text>
          <Text variant="bodySmall" color="secondary">
            {t('provisioning.migrate.dashboards-folder-summary', '{{count}} dashboards', {
              count: folder.dashboardCount,
            })}
          </Text>
        </Stack>
      </div>
      {isExpanded && (
        <div className={styles.children}>
          {folder.directDashboards.length === 0 ? (
            <Text variant="bodySmall" color="secondary">
              <Trans i18nKey="provisioning.migrate.dashboards-folder-only-subfolders">
                Dashboards in this folder live in subfolders. Migrate the folder to bring them all in one go.
              </Trans>
            </Text>
          ) : (
            folder.directDashboards.map((dash) => (
              <div key={`dash-${dash.uid}`} className={styles.childRow}>
                <Icon name="apps" size="sm" />
                <Text variant="bodySmall">{dash.title}</Text>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
  }),
  searchInput: css({
    flex: '1 1 auto',
    minWidth: 200,
  }),
  sortInput: css({
    flex: '0 0 auto',
    minWidth: 200,
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  row: css({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(1, 1.25),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.primary,
  }),
  rowHeader: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  children: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    paddingLeft: theme.spacing(5),
    paddingTop: theme.spacing(0.75),
  }),
  childRow: css({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.radius.default,
    '&:hover': {
      background: theme.colors.background.canvas,
    },
  }),
});
