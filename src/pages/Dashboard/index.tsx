import { useWorkspace } from "../../contexts/WorkspaceContext";
import styles from "./styles.module.css";

export function Dashboard() {
  const { currentWorkspace } = useWorkspace();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Dashboard</span>
          <h1>{currentWorkspace?.workspace_name}</h1>
          <p>
            Fundação do Manutix criada. O próximo passo será conectar os cards
            com a view <strong>v_dashboard_summary</strong>.
          </p>
        </div>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <span>Chamados</span>
          <strong>0</strong>
          <p>Entrada de solicitações do cliente.</p>
        </article>

        <article className={styles.card}>
          <span>Ordens abertas</span>
          <strong>0</strong>
          <p>OS aguardando planejamento ou execução.</p>
        </article>

        <article className={styles.card}>
          <span>Preventivas</span>
          <strong>0</strong>
          <p>Ocorrências a gerar e vencer.</p>
        </article>

        <article className={styles.card}>
          <span>Ativos</span>
          <strong>0</strong>
          <p>Locais, sistemas, equipamentos e componentes.</p>
        </article>
      </section>
    </div>
  );
}