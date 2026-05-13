import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import {
  createAsset,
  getAssets,
  getAssetTypes,
} from "../../services/assetService";
import type {
  AssetCriticality,
  AssetKind,
  AssetListItem,
  AssetStatus,
  AssetType,
} from "../../types/asset";
import styles from "./styles.module.css";

type AssetKindFilter = AssetKind | "all";
type AssetStatusFilter = AssetStatus | "all";

const assetKindLabels: Record<AssetKind, string> = {
  location: "Local",
  system: "Sistema",
  equipment: "Equipamento",
  component: "Componente",
};

const criticalityLabels: Record<AssetCriticality, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const statusLabels: Record<AssetStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};

function getAssetIcon(kind: AssetKind) {
  if (kind === "location") return MapPin;
  if (kind === "system") return Building2;
  return Wrench;
}

export function Assets() {
  const { currentWorkspace } = useWorkspace();

  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);

  const [search, setSearch] = useState("");
  const [assetKindFilter, setAssetKindFilter] = useState<AssetKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AssetStatusFilter>("active");

  const [showForm, setShowForm] = useState(false);

  const [assetKind, setAssetKind] = useState<AssetKind>("location");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [parentId, setParentId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criticality, setCriticality] = useState<AssetCriticality>("medium");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    if (!currentWorkspace) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const [nextAssetTypes, nextAssets] = await Promise.all([
        getAssetTypes(currentWorkspace.workspace_id),
        getAssets({
          workspaceId: currentWorkspace.workspace_id,
          search,
          assetKind: assetKindFilter,
          status: statusFilter,
        }),
      ]);

      setAssetTypes(nextAssetTypes);
      setAssets(nextAssets);

      if (!assetTypeId && nextAssetTypes.length > 0) {
        setAssetTypeId(nextAssetTypes[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar ativos.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.workspace_id, assetKindFilter, statusFilter]);

  const parentOptions = useMemo(() => {
    return assets.filter((asset) => asset.asset_kind !== "component");
  }, [assets]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function handleCreateAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentWorkspace) return;

    setCreating(true);
    setErrorMessage("");

    try {
      await createAsset({
        workspaceId: currentWorkspace.workspace_id,
        parentId: parentId || null,
        assetTypeId,
        assetKind,
        code,
        name,
        description: description.trim().length > 0 ? description : null,
        criticality,
      });

      setCode("");
      setName("");
      setDescription("");
      setParentId("");
      setCriticality("medium");
      setAssetKind("location");
      setShowForm(false);

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cadastrar ativo.";

      setErrorMessage(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Cadastro operacional</span>
          <h1>Ativos e Localizações</h1>
          <p>
            Gerencie locais, sistemas, equipamentos e componentes do workspace{" "}
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
            Novo ativo/local
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
              <span>Novo cadastro</span>
              <h2>Adicionar ativo/local</h2>
            </div>
          </div>

          <form onSubmit={handleCreateAsset} className={styles.form}>
            <label>
              Tipo estrutural
              <select
                value={assetKind}
                onChange={(event) => setAssetKind(event.target.value as AssetKind)}
              >
                <option value="location">Local</option>
                <option value="system">Sistema</option>
                <option value="equipment">Equipamento</option>
                <option value="component">Componente</option>
              </select>
            </label>

            <label>
              Tipo de ativo
              <select
                value={assetTypeId}
                onChange={(event) => setAssetTypeId(event.target.value)}
                required
              >
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pai/localização
              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="">Sem pai</option>
                {parentOptions.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} - {asset.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Código
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Ex: BAN-001"
                required
              />
            </label>

            <label>
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Banheiro Masculino Bloco A"
                required
              />
            </label>

            <label>
              Criticidade
              <select
                value={criticality}
                onChange={(event) =>
                  setCriticality(event.target.value as AssetCriticality)
                }
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </label>

            <label className={styles.fullField}>
              Descrição
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Observações sobre o ativo/local"
                rows={3}
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
                {creating ? "Salvando..." : "Salvar ativo/local"}
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
            placeholder="Buscar por código, nome ou descrição..."
          />
          <button type="submit">Buscar</button>
        </form>

        <div className={styles.filterGroup}>
          <Filter size={16} />

          <select
            value={assetKindFilter}
            onChange={(event) =>
              setAssetKindFilter(event.target.value as AssetKindFilter)
            }
          >
            <option value="all">Todos os tipos</option>
            <option value="location">Locais</option>
            <option value="system">Sistemas</option>
            <option value="equipment">Equipamentos</option>
            <option value="component">Componentes</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as AssetStatusFilter)
            }
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>
      </section>

      <section className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Carregando ativos...</div>
        ) : assets.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum ativo/local encontrado para os filtros atuais.
          </div>
        ) : (
          assets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_kind);

            return (
              <article key={asset.id} className={styles.assetCard}>
                <div className={styles.assetIcon}>
                  <Icon size={20} />
                </div>

                <div className={styles.assetMain}>
                  <div className={styles.assetTop}>
                    <div>
                      <strong>{asset.name}</strong>
                      <span>{asset.code}</span>
                    </div>

                    <div className={styles.badges}>
                      <span className={styles.kindBadge}>
                        {assetKindLabels[asset.asset_kind]}
                      </span>
                      <span className={`${styles.criticalityBadge} ${styles[asset.criticality]}`}>
                        {criticalityLabels[asset.criticality]}
                      </span>
                    </div>
                  </div>

                  <p>{asset.description || "Sem descrição cadastrada."}</p>

                  <div className={styles.meta}>
                    <span>Tipo: {asset.asset_type_name}</span>
                    <span>Status: {statusLabels[asset.status]}</span>
                    {asset.parent_name && (
                      <span>
                        Pai: {asset.parent_code} - {asset.parent_name}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}