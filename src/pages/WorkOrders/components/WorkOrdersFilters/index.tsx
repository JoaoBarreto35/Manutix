import type { FormEvent } from "react";
import { Filter, Search } from "lucide-react";
import type { StatusFilter } from "../../constants/workOrderLabels";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrdersFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkOrdersFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onSubmit,
}: WorkOrdersFiltersProps) {
  return (
    <section className={styles.filters}>
      <form onSubmit={onSubmit} className={styles.searchBox}>
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por OS, título, descrição, ativo ou chamado..."
        />
        <Button type="submit" variant="primary">Buscar</Button>
      </form>

      <div className={styles.filterGroup}>
        <Filter size={16} />

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
        >
          <option value="all">Todos os status</option>
          <option value="waiting_planning">Aguardando planejamento</option>
          <option value="planned">Planejadas</option>
          <option value="released">Liberadas</option>
          <option value="in_execution">Em execução</option>
          <option value="paused">Pausadas</option>
          <option value="waiting_validation">Aguardando validação</option>
          <option value="rejected_by_client">Rejeitadas pelo cliente</option>
          <option value="closed">Fechadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
    </section>
  );
}
