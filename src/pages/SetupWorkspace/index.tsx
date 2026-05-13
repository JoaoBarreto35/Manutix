import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganizationWithWorkspace } from "../../services/workspaceService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import styles from "./styles.module.css";

export function SetupWorkspace() {
  const navigate = useNavigate();
  const { refreshWorkspaces } = useWorkspace();

  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await createOrganizationWithWorkspace({
        organizationName,
        workspaceName,
      });

      await refreshWorkspaces();

      navigate("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar workspace.";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div>
          <span className={styles.badge}>Primeiro acesso</span>
          <h1>Crie sua organização e workspace</h1>
          <p>
            A organização representa sua empresa. O workspace representa um
            contrato, cliente, unidade ou operação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Nome da organização
            <input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Ex: Barreto Facilities"
              required
            />
          </label>

          <label>
            Nome do workspace
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Ex: Contrato Piloto"
              required
            />
          </label>

          {message && <p className={styles.message}>{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar e continuar"}
          </button>
        </form>
      </section>
    </main>
  );
}