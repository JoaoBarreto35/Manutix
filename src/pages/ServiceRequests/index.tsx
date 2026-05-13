import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getAssets } from "../../services/assetService";
import {
  createServiceRequest,
  getProblemsByAssetType,
  getServiceRequests,
} from "../../services/serviceRequestService";
import type { AssetListItem } from "../../types/asset";
import type {
  AssetTypeProblem,
  PriorityLevel,
  ServiceRequestListItem,
  ServiceRequestStatus,
} from "../../types/serviceRequest";
import styles from "./styles.module.css";

type StatusFilter = ServiceRequestStatus | "all";

const statusLabels: Record<ServiceRequestStatus, string> = {
  new: "Novo",
  in_triage: "Em triagem",
  waiting_information: "Aguardando informação",
  converted_to_work_order: "Convertido em OS",
  duplicated: "Duplicado",
  out_of_scope: "Fora de escopo",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

const priorityLabels: Record<PriorityLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ServiceRequests() {
  const { currentWorkspace } = useWorkspace();

  const [serviceRequests, setServiceRequests] = useState<ServiceRequestListItem[]>([]);
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [problems, setProblems] = useState<AssetTypeProblem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showForm, setShowForm] = useState(false);

  const [assetId, setAssetId] = useState("");
  const [standardProblemId, setStandardProblemId] = useState("");
  const [problemOtherText, setProblemOtherText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedAsset = useMemo(() => {
    return assets.find((asset) => asset.id === assetId) ?? null;
  }, [assets, assetId]);

  const selectedProblem = useMemo(() => {
    return problems.find((problem) => problem.id === standardProblemId) ?? null;
  }, [problems, standardProblemId]);

  async function loadData() {
    if (!currentWorkspace) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const [nextServiceRequests, nextAssets] = await Promise.all([
        getServiceRequests({
          workspaceId: currentWorkspace.workspace_id,
          search,
          status: statusFilter,
        }),
        getAssets({
          workspaceId: currentWorkspace.workspace_id,
          status: "active",
          assetKind: "all",
        }),
      ]);

      setServiceRequests(nextServiceRequests);
      setAssets(nextAssets);

      if (!assetId && nextAssets.length > 0) {
        setAssetId(nextAssets[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar chamados.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProblemsForAsset(asset: AssetListItem | null) {
    if (!currentWorkspace || !asset) {
      setProblems([]);
      setStandardProblemId("");
      return;
    }

    setLoadingProblems(true);
    setErrorMessage("");

    try {
      const nextProblems = await getProblemsByAssetType({
        workspaceId: currentWorkspace.workspace_id,
        assetTypeId: asset.asset_type_id,
      });

      setProblems(nextProblems);
      setStandardProblemId(nextProblems[0]?.id ?? "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar problemas padrão.";

      setErrorMessage(message);
      setProblems([]);
      setStandardProblemId("");
    } finally {
      setLoadingProblems(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.workspace_id, statusFilter]);

  useEffect(() => {
    loadProblemsForAsset(selectedAsset);
  }, [selectedAsset?.id]);

  useEffect(() => {
    if (!selectedProblem) return;

    if (!title.trim()) {
      setTitle(selectedProblem.name);
    }
  }, [selectedProblem?.id]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function handleCreateServiceRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentWorkspace || !selectedAsset) return;

    const isOtherProblem = standardProblemId === "other" || !standardProblemId;
    const normalizedProblemOtherText = problemOtherText.trim();

    if (isOtherProblem && normalizedProblemOtherText.length === 0) {
      setErrorMessage("Informe a descrição do problema quando selecionar Outro.");
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      await createServiceRequest({
        workspaceId: currentWorkspace.workspace_id,
        assetId: selectedAsset.id,
        standardProblemId: isOtherProblem ? null : standardProblemId,
        problemOtherText: isOtherProblem ? normalizedProblemOtherText : null,
        title,
        description,
        source: "client_portal",
      });

      setTitle("");
      setDescription("");
      setProblemOtherText("");
      setShowForm(false);

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao abrir chamado.";

      setErrorMessage(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Solicitações</span>
          <h1>Chamados</h1>
          <p>
            Abra, acompanhe e filtre solicitações vinculadas aos ativos e
            localizações do workspace{" "}
            <strong>{currentWorkspace?.workspace_name}</strong>.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={loadData}>
            <RefreshCw size={16} />
            Atualizar
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setShowForm((current) => !current)}
          >
            <Plus size={16} />
            Novo chamado
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className={styles.errorBox}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {showForm && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Novo chamado</span>
              <h2>Abrir solicitação</h2>
            </div>
          </div>

          <form onSubmit={handleCreateServiceRequest} className={styles.form}>
            <label className={styles.fullField}>
              Ativo/localização
              <select
                value={assetId}
                onChange={(event) => {
                  setAssetId(event.target.value);
                  setTitle("");
                  setProblemOtherText("");
                }}
                required
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} - {asset.name} ({asset.asset_type_name})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Problema relatado
              <select
                value={standardProblemId || "other"}
                onChange={(event) => {
                  setStandardProblemId(event.target.value);
                  setTitle("");
                }}
                disabled={loadingProblems}
              >
                {problems.map((problem) => (
                  <option key={problem.id} value={problem.id}>
                    {problem.name}
                  </option>
                ))}
                <option value="other">Outro</option>
              </select>
            </label>

            <label>
              Prioridade sugerida
              <input
                value={
                  selectedProblem
                    ? priorityLabels[selectedProblem.suggested_priority]
                    : "A definir na triagem"
                }
                disabled
              />
            </label>

            <label>
              Tipo sugerido
              <input
                value={
                  selectedProblem
                    ? selectedProblem.suggested_maintenance_type
                    : "A definir na triagem"
                }
                disabled
              />
            </label>

            {(standardProblemId === "other" || !standardProblemId) && (
              <label className={styles.fullField}>
                Qual é o problema?
                <input
                  value={problemOtherText}
                  onChange={(event) => setProblemOtherText(event.target.value)}
                  placeholder="Ex: Porta fazendo barulho ao abrir"
                  required
                />
              </label>
            )}

            <label className={styles.fullField}>
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Vazamento no banheiro"
                required
              />
            </label>

            <label className={styles.fullField}>
              Descrição
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descreva o que foi encontrado, local exato e qualquer detalhe útil."
                rows={4}
                required
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>

              <button type="submit" className={styles.primaryButton} disabled={creating}>
                {creating ? "Abrindo..." : "Abrir chamado"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.filters}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por código, título, descrição, ativo ou problema..."
          />
          <button type="submit">Buscar</button>
        </form>

        <div className={styles.filterGroup}>
          <Filter size={16} />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="new">Novos</option>
            <option value="in_triage">Em triagem</option>
            <option value="waiting_information">Aguardando informação</option>
            <option value="converted_to_work_order">Convertidos em OS</option>
            <option value="duplicated">Duplicados</option>
            <option value="out_of_scope">Fora de escopo</option>
            <option value="rejected">Rejeitados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </section>

      <section className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Carregando chamados...</div>
        ) : serviceRequests.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum chamado encontrado para os filtros atuais.
          </div>
        ) : (
          serviceRequests.map((request) => (
            <article key={request.id} className={styles.requestCard}>
              <div className={styles.requestIcon}>
                {request.status === "converted_to_work_order" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <ClipboardList size={20} />
                )}
              </div>

              <div className={styles.requestMain}>
                <div className={styles.requestTop}>
                  <div>
                    <strong>{request.title}</strong>
                    <span>
                      {request.request_code} · {formatDate(request.created_at)}
                    </span>
                  </div>

                  <div className={styles.badges}>
                    <span className={`${styles.statusBadge} ${styles[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                    <span className={`${styles.priorityBadge} ${styles[request.suggested_priority]}`}>
                      {priorityLabels[request.suggested_priority]}
                    </span>
                  </div>
                </div>

                <p>{request.description}</p>

                <div className={styles.meta}>
                  <span>
                    Ativo: {request.asset_code} - {request.asset_name}
                  </span>
                  <span>Tipo: {request.asset_type_name}</span>
                  <span>
                    Problema:{" "}
                    {request.problem_label_snapshot ||
                      request.problem_other_text ||
                      "Não informado"}
                  </span>
                  <span>Solicitante: {request.opened_by_name || "Usuário"}</span>
                  <span>Comentários: {request.comments_count}</span>
                  <span>Anexos: {request.attachments_count}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}