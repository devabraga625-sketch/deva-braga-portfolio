import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function TwoFactorPage() {
  const status = trpc.twoFactor.status.useQuery(undefined, { refetchInterval: 15_000 });
  const begin = trpc.twoFactor.begin.useMutation();
  const confirmSetup = trpc.twoFactor.confirmSetup.useMutation();
  const verify = trpc.twoFactor.verify.useMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const role = status.data?.role;
  const finish = () => { setCompleted(true); window.setTimeout(() => { window.location.href = role === "admin" ? "/painel" : "/"; }, 350); };
  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try {
      if (status.data?.state === "setup") await confirmSetup.mutateAsync({ code });
      else await verify.mutateAsync({ code });
      finish();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Não foi possível validar o código."); }
  };
  const startSetup = async () => { setError(""); try { await begin.mutateAsync(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Não foi possível iniciar a configuração."); } };

  if (status.isLoading || completed) return <main className="panel-shell two-factor-shell"><div className="two-factor-card"><Loader2 className="two-factor-spinner" size={22} /><p className="eyebrow">{completed ? "Acesso protegido" : "Verificando sessão"}</p>{completed && <h1>Autenticação<br /><em>confirmada.</em></h1>}</div></main>;
  if (!status.data) return <main className="panel-shell two-factor-shell"><div className="two-factor-card"><span className="eyebrow two-factor-kicker"><ShieldCheck size={14} /> Login seguro</span><h1>Proteja sua<br /><em>conta.</em></h1><p className="two-factor-lead">O acesso administrativo e as contas autenticadas precisam confirmar um segundo fator. Entre primeiro pelo provedor de login para configurar ou usar seu aplicativo autenticador.</p><button className="admin-login-button" onClick={() => startLogin()}><KeyRound size={16} /> Entrar para continuar</button><p className="two-factor-note">Compatível com Google Authenticator, Microsoft Authenticator, Authy e outros aplicativos TOTP.</p></div></main>;

  const isSetup = status.data.state === "setup";
  const qrCode = begin.data?.qrCode;
  return <main className="panel-shell two-factor-shell"><div className="two-factor-card"><span className="eyebrow two-factor-kicker"><ShieldCheck size={14} /> {isSetup ? "Configuração obrigatória" : "Verificação em duas etapas"}</span><h1>{isSetup ? <>Ative seu<br /><em>autenticador.</em></> : <>Confirme seu<br /><em>acesso.</em></>}</h1><p className="two-factor-lead">Conta: <strong>{status.data.label}</strong></p>{isSetup && !qrCode && <><p className="two-factor-instructions">Abra seu aplicativo autenticador, escaneie o QR Code e depois informe o código de seis dígitos exibido.</p><button className="admin-login-button" onClick={startSetup} disabled={begin.isPending}>{begin.isPending ? <><Loader2 className="two-factor-spinner" size={16} /> Gerando QR Code…</> : <><KeyRound size={16} /> Gerar QR Code</>}</button></>}{qrCode && <div className="two-factor-enrollment"><img src={qrCode} alt="QR Code para configurar a autenticação de dois fatores" /><p>Se não puder escanear, use a chave manual:</p><code>{begin.data?.secret}</code></div>}<form className="two-factor-form" onSubmit={submitCode}><label htmlFor="two-factor-code">Código do aplicativo</label><input id="two-factor-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /><button type="submit" className="admin-login-button" disabled={code.length !== 6 || confirmSetup.isPending || verify.isPending}>{confirmSetup.isPending || verify.isPending ? <><Loader2 className="two-factor-spinner" size={16} /> Validando…</> : "Confirmar código"}</button>{error && <p className="two-factor-error" role="alert">{error}</p>}</form><p className="two-factor-note">Nunca compartilhe este código. Ele muda automaticamente a cada poucos segundos.</p></div></main>;
}
