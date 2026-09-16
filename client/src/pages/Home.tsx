import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

const images = [
  "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/742cca61-7853-456f-a700-7018cf1d34b5_carw_1x1x1280.jpg?h=8f97582552146c6ff387fa3cbd4574db&url=aHR0cHM6Ly9taXItczMtY2RuLWNmLmJlaGFuY2UubmV0L3Byb2plY3RzL29yaWdpbmFsLzY4YThlMTI1NTc2NDg0My5ZM0p2Y0N3MU1URXpMRFF3TURBc05EVTFMREEuanBn",
  "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/0148e7f3-c828-4e33-b55c-ebdd37157be9_carw_1x1x1280.jpg?h=6dda057029bc973af978c9defe34828f",
  "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/e08a588e-9c11-4f58-a870-0d1048fe4233_carw_1x1x1280.png?h=cef5b41ce4262907be5ef0aed5df7491",
  "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/92c926bc-fd09-414f-a421-ff48872b9926_carw_1x1x1280.jpg?h=2ce3cecda105820fb1bf6f72f734072f",
];

const projects = [
  { title: "Lavagem das Baianas", type: "Fotografia", year: "2026", image: images[0], size: "feature" },
  { title: "Rolê pelas ruas de Cachoeira", type: "Fotografia / Styling", year: "2026", image: images[1], size: "tall" },
  { title: "ÍRIA — Apresentação Pitch", type: "Direção de arte", year: "2026", image: images[2], size: "wide" },
  { title: "Ocupação 377", type: "Fotografia / Edição", year: "2026", image: images[3], size: "square" },
  { title: "tons de azul que só vejo em Salvador", type: "Fotografia", year: "2026", image: images[0], size: "tall" },
  { title: "Festival Salvador Cidade Reggae", type: "Fotografia / Edição", year: "2026", image: images[1], size: "wide" },
  { title: "Floricultura Lusitana", type: "Fotografia", year: "2025", image: images[2], size: "square" },
  { title: "Uma Noite no Museu", type: "Fotografia / Styling", year: "2025", image: images[3], size: "feature" },
];

const filters = ["Todos", "Fotografia", "Direção de arte", "Edição"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = useMemo(() => filter === "Todos" ? projects : projects.filter((p) => p.type.toLowerCase().includes(filter.toLowerCase())), [filter]);

  const jump = (direction: number) => {
    if (selected === null) return;
    setSelected((selected + direction + filtered.length) % filtered.length);
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Deva Braga, início">DEVA<br /><span>BRAGA</span></a>
        <div className="topbar-center">Portfólio / 2025—26</div>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">Menu <span className="menu-lines"><i /><i /></span></button>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Fotografia · Direção de arte · Design</p>
        <h1>Imagens que<br /><em>ficam.</em></h1>
        <div className="hero-footer">
          <p>Um arquivo visual entre Salvador,<br />a rua e o que ainda não tem nome.</p>
          <a href="#trabalhos" className="scroll-cue">Explorar trabalhos <ArrowDownRight size={17} /></a>
        </div>
      </section>

      <section className="work-section" id="trabalhos">
        <div className="section-heading">
          <div><span className="section-index">01</span><h2>Seleção recente</h2></div>
          <p>Projetos selecionados<br />de um olhar em movimento.</p>
        </div>
        <div className="filter-row" aria-label="Filtros de categoria">
          {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <div className="gallery-grid">
          {filtered.map((project, index) => <button className={`gallery-card ${project.size}`} key={project.title} onClick={() => setSelected(index)} aria-label={`Abrir ${project.title}`}>
            <img src={project.image} alt={project.title} loading={index > 2 ? "lazy" : "eager"} />
            <span className="card-shade" /><span className="card-meta"><small>{project.year}</small><strong>{project.title}</strong><small>{project.type}</small></span><span className="card-arrow"><ArrowUpRight size={18} /></span>
          </button>)}
        </div>
      </section>

      <section className="statement" id="sobre">
        <span className="section-index">02</span><div><h2>Entre o documento<br />e a <em>atmosfera.</em></h2><p>Deva Braga é fotógrafa e diretora de arte em Salvador. Seu trabalho percorre pessoas, lugares e marcas em busca de uma imagem que carregue presença.</p><a href="#contato">Conheça o processo <ArrowUpRight size={17} /></a></div>
      </section>

      <footer className="footer" id="contato"><div><span className="section-index">03</span><p>Tem uma ideia em mente?</p><a href="mailto:oi@devabraga.com">oi@devabraga.com</a></div><div className="footer-right"><span>Salvador, BR</span><span>© 2026 Deva Braga</span></div></footer>

      <div className={`menu-panel ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button><div className="menu-inner"><p className="eyebrow">Navegação</p><nav><a href="#top" onClick={() => setMenuOpen(false)}>Início <span>01</span></a><a href="#trabalhos" onClick={() => setMenuOpen(false)}>Trabalhos <span>02</span></a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre <span>03</span></a><a href="#contato" onClick={() => setMenuOpen(false)}>Contato <span>04</span></a></nav><p className="menu-note">Fotografia e direção de arte<br />a partir de Salvador.</p></div></div>

      {selected !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={filtered[selected].title}><button className="lightbox-close" onClick={() => setSelected(null)}><X /></button><button className="lightbox-nav prev" onClick={() => jump(-1)}><ChevronLeft /></button><div className="lightbox-image"><img src={filtered[selected].image} alt={filtered[selected].title} /></div><div className="lightbox-caption"><span>{filtered[selected].year} / {filtered[selected].type}</span><h3>{filtered[selected].title}</h3></div><button className="lightbox-nav next" onClick={() => jump(1)}><ChevronRight /></button></div>}
    </main>
  );
}
