import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./styles.module.css";

type Mode = "login" | "register";

export function Login() {
  const { user, signInWithPassword, signUpWithPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
      } else {
        await signUpWithPassword({
          email,
          password,
          fullName,
        });

        setMessage("Cadastro criado. Verifique seu e-mail se a confirmação estiver ativa.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro inesperado.";

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>M</div>
          <h1>Manutix</h1>
          <p>Controle inteligente de manutenção, chamados e ordens de serviço.</p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "login" ? styles.active : ""}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>

          <button
            type="button"
            className={mode === "register" ? styles.active : ""}
            onClick={() => setMode("register")}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "register" && (
            <label>
              Nome completo
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
          )}

          <label>
            E-mail
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              type="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              type="password"
              minLength={6}
              required
            />
          </label>

          {message && <p className={styles.message}>{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Carregando..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}