import { Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function StatusPage() {
  return (
    <main className="status-page" aria-labelledby="status-title">
      <div className="status-grid" aria-hidden="true" />
      <div className="status-card">
        <span className="eyebrow"><Activity size={14} /> Status do arquivo</span>
        <div className="status-indicator"><i /><span>Operação normal</span></div>
        <h1 id="status-title">O arquivo visual<br /><em>está no ar.</em></h1>
        <p>O portfólio, a galeria e o formulário de contato estão funcionando normalmente. Se algo parecer fora do lugar, tente atualizar a página em alguns instantes.</p>
        <div className="status-service"><CheckCircle2 size={16} /><span>Site principal</span><strong>Operacional</strong></div>
        <Link className="status-back" href="/"><span>Voltar ao portfólio</span><ArrowUpRight size={16} /></Link>
      </div>
      <footer>Deva Braga / Salvador, BR</footer>
    </main>
  );
}
