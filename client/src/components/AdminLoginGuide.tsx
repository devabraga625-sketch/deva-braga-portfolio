import { KeyRound, ShieldCheck } from "lucide-react";
import { startLogin } from "@/const";

export default function AdminLoginGuide() {
  return <main className="panel-shell admin-login-shell">
    <div className="admin-login-card">
      <span className="eyebrow admin-security-label"><ShieldCheck size={14} /> Área administrativa protegida</span>
      <h1>Painel do<br /><em>portfólio.</em></h1>
      <p className="admin-login-lead">Entre usando a conta proprietária autorizada. A autenticação é processada pelo provedor de login; este site não armazena sua senha.</p>
      <button className="admin-login-button" onClick={() => startLogin()}><KeyRound size={16} /> Entrar com segurança</button>
      <section className="two-factor-guide" aria-labelledby="two-factor-title">
        <span className="eyebrow">Antes de entrar</span>
        <h2 id="two-factor-title">Ative a autenticação de dois fatores</h2>
        <ol>
          <li>Abra as configurações de segurança da conta usada para acessar o painel.</li>
          <li>Ative um aplicativo autenticador ou uma chave de segurança; prefira o autenticador a códigos recebidos por SMS.</li>
          <li>Guarde os códigos de recuperação offline, em local seguro e separado da senha.</li>
          <li>Nunca compartilhe códigos de verificação. Encerre sessões desconhecidas e troque a senha se notar atividade suspeita.</li>
        </ol>
        <p className="two-factor-note">O segundo fator é aplicado pelo provedor de login, antes que o acesso administrativo seja liberado.</p>
      </section>
    </div>
  </main>;
}
