import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-frame">
        <span className="eyebrow">Arquivo / 404</span>
        <p className="not-found-number" aria-hidden="true">404</p>
        <h1 id="not-found-title">Esta imagem ainda<br /><em>não foi encontrada.</em></h1>
        <p className="not-found-copy">A página que você procura pode ter mudado de lugar ou não fazer mais parte do arquivo.</p>
        <button className="not-found-home" onClick={() => setLocation("/")}>
          <Home size={16} aria-hidden="true" /> Voltar à página inicial <ArrowLeft size={16} aria-hidden="true" />
        </button>
      </div>
      <span className="not-found-footer">Deva Braga / Fotografia, design gráfico e edição</span>
    </main>
  );
}
