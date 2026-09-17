import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const goHome = (hash = "") => {
    document.querySelector(".not-found-page")?.classList.add("is-leaving");
    window.setTimeout(() => setLocation(`/${hash}`), 170);
  };

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-art" aria-hidden="true"><span className="not-found-orbit orbit-one" /><span className="not-found-orbit orbit-two" /><span className="not-found-spark spark-one" /><span className="not-found-spark spark-two" /></div>
      <div className="not-found-frame">
        <span className="eyebrow">Arquivo / 404</span>
        <p className="not-found-number" aria-hidden="true">404</p>
        <h1 id="not-found-title">Esta imagem ainda<br /><em>não foi encontrada.</em></h1>
        <p className="not-found-copy">A página que você procura pode ter mudado de lugar ou não fazer mais parte do arquivo.</p>
        <button className="not-found-home" onClick={() => goHome()}>
          <Home size={16} aria-hidden="true" /> Voltar à página inicial <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <nav className="not-found-links" aria-label="Atalhos de navegação">
          <span>Explorar</span>
          <a href="/#trabalhos" onClick={event => { event.preventDefault(); goHome("#trabalhos"); }}>Trabalhos</a>
          <a href="/#sobre" onClick={event => { event.preventDefault(); goHome("#sobre"); }}>Sobre</a>
          <a href="/#contato" onClick={event => { event.preventDefault(); goHome("#contato"); }}>Contato</a>
        </nav>
      </div>
      <span className="not-found-footer">Deva Braga / Fotografia, design gráfico e edição</span>
    </main>
  );
}
