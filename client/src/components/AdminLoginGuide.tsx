import { KeyRound, ShieldCheck } from "lucide-react";
import { startLogin } from "@/const";

export default function AdminLoginGuide() {
  return <main className="panel-shell admin-login-shell">
    <div className="admin-login-card">
      <span className="eyebrow admin-security-label"><ShieldCheck size={14} /> Área administrativa protegida</span>
      <h1>Painel do<br /><em>portfólio.</em></h1>
      <p className="admin-login-lead">Entre usando a conta proprietária autorizada. Depois do login OAuth, este site exigirá um código TOTP do seu aplicativo autenticador antes de liberar o painel. Sua senha não é armazenada aqui.</p>
      <button className="admin-login-button" onClick={() => startLogin()}><KeyRound size={16} /> Entrar com segurança</button>
      <section className="two-factor-guide" aria-labelledby="two-factor-title">
        <span className="eyebrow">Antes de entrar</span>
        <h2 id="two-factor-title">Ative a autenticação de dois fatores</h2>
        <ol>
          <li>Faça o login; na etapa seguinte, escolha “Gerar QR Code”.</li>
          <li>Escaneie o QR Code com Google Authenticator, Microsoft Authenticator, Authy ou outro aplicativo TOTP.</li>
          <li>Informe o código de seis dígitos para confirmar a configuração.</li>
          <li>Guarde os códigos de recuperação do aplicativo, se ele oferecer essa opção, e nunca compartilhe códigos de verificação.</li>
        </ol>
        <p className="two-factor-note">O segundo fator é aplicado pelo provedor de login, antes que o acesso administrativo seja liberado.</p>
      </section>
    </div>
  </main>;
}
