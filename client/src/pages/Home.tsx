import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { categories, portfolioProjects, type PortfolioProject } from "@/data/portfolio";

function Media({ src, alt, featured = false }: { src: string; alt: string; featured?: boolean }) {
  const lower = src.toLowerCase();
  if (lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov")) return <video src={src} controls={!featured} muted={featured} autoPlay={featured} loop={featured} playsInline aria-label={alt} />;
  return <img src={src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

function categoryFor(project: PortfolioProject) { return project.categories.join(" · "); }

const specialMedia: Record<string, Array<{ kind: "image" | "youtube" | "embed"; src: string }>> = {
  "ocupacao-377": [
    { kind: "image", src: "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/92c926bc-fd09-414f-a421-ff48872b9926_car_1x1.jpg?h=cb842d706a0805b6e4b4f4077c6aa70d" },
    { kind: "embed", src: "https://lightroom.adobe.com/embed/shares/a50ed03d5cb1425e947972a52f60bf80" },
  ],
  "a-revolucao-silenciosa": [
    { kind: "image", src: "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/6a92c89b-a730-497d-a769-6f4c42f406c4_car_1x1.jpg?h=0a8b0353d53404ce4c9b33e4618d081d" },
    { kind: "youtube", src: "https://www.youtube.com/embed/jaQDrIh1lDM?si=sWQr9Sc3GtUvRJYG" },
  ],
  "zestspice-propaganda": [
    { kind: "image", src: "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/ad0e2ca8-4d71-4ade-8044-b462e5c78aa0_rwc_525x0x1376x1376x1376.jpeg?h=e2f2e8cbf36993f790d675099b0cd3ea" },
    { kind: "embed", src: "https://www-ccv.adobe.io/v1/player/ccv/HgNHUoM6UzU/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View" },
  ],
  "vinheta-savior": [
    { kind: "image", src: "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/c5bac3a8-9660-4099-b1e1-ae0e55e42c3e_car_1x1.png?h=5aaa59f163e6cc9f610c79289478b034" },
    { kind: "embed", src: "https://www-ccv.adobe.io/v1/player/ccv/IrznVPAI3gR/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View" },
  ],
  "stories-depyl-care-012026": [
    { kind: "image", src: "https://cdn.myportfolio.com/6c489dbe-0602-4931-a87d-9c7195c565f3/8806769e-9e4d-4ca4-a1b3-fb83c3706b35_car_1x1.jpg?h=5fdbde0a09c3ff0ebdf57cc5690a1cb4" },
    { kind: "youtube", src: "https://www.youtube.com/embed/Pyd7CJO2H-A?si=BEV73KL_0-_AdWwU" },
  ],
};

function mediaFor(project: PortfolioProject) {
  const special = specialMedia[project.slug];
  if (!special) return project.media.map(src => ({ kind: "image" as const, src }));
  return [...special, ...project.media.filter(src => !special.some(item => item.src === src)).map(src => ({ kind: "image" as const, src }))];
}

function SpecialMedia({ item, alt, featured = false }: { item: { kind: "image" | "youtube" | "embed"; src: string }; alt: string; featured?: boolean }) {
  if (item.kind === "youtube" || item.kind === "embed") return <iframe className="embedded-media" src={item.src} title={alt} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading={featured ? "eager" : "lazy"} />;
  return <img src={item.src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const [selected, setSelected] = useState<PortfolioProject | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const filtered = useMemo(() => filter === "Todos" ? portfolioProjects : portfolioProjects.filter((p) => p.categories.includes(filter)), [filter]);
  
  const openProject = (project: PortfolioProject) => { setSelected(project); setMediaIndex(0); };
  const changeMedia = (direction: number) => { if (!selected) return; setMediaIndex((mediaIndex + direction + mediaFor(selected).length) % mediaFor(selected).length); };

  return (
    <main className="site-shell">
      <header className="topbar"><a className="wordmark" href="#top" aria-label="Deva Braga, início">DEVA<br /><span>BRAGA</span></a><div className="topbar-center">Portfólio / 2025—26</div><button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">Menu <span className="menu-lines"><i /><i /></span></button></header>
      <section className="hero" id="top"><p className="eyebrow">Fotografia · Design gráfico · Edição</p><h1>Imagens que<br /><em>ficam.</em></h1><div className="hero-footer"><p>Um arquivo visual entre Salvador,<br />a rua e o que ainda não tem nome.</p><a href="#trabalhos" className="scroll-cue">Explorar trabalhos <ArrowDownRight size={17} /></a></div></section>

      <section className="work-section" id="trabalhos">
        <div className="section-heading"><div><span className="section-index">01</span><h2>Trabalhos</h2></div><p>{portfolioProjects.length} projetos<br />47 páginas · 649 mídias</p></div>
        <div className="filter-row" aria-label="Filtrar trabalhos por categoria">{categories.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<sup>{item === "Todos" ? portfolioProjects.length : portfolioProjects.filter(p => p.categories.includes(item)).length}</sup></button>)}</div>
        <div className="catalog-grid">{filtered.map((project) => <button className="catalog-card" key={project.id} onClick={() => openProject(project)} aria-label={`Abrir projeto ${project.title}`}><div className="catalog-image">{mediaFor(project)[0] ? <SpecialMedia item={mediaFor(project)[0]} alt={project.title} featured /> : <div className="media-empty">Mídia indisponível</div>}<span className="card-shade" /><span className="card-arrow"><ArrowUpRight size={18} /></span></div><div className="catalog-meta"><span className="catalog-number">{String(project.id).padStart(2, "0")}</span><span><strong>{project.title}</strong><small>{project.year} · {categoryFor(project)} · {mediaFor(project).length} mídias</small></span></div></button>)}</div>
      </section>

      <section className="statement" id="sobre"><span className="section-index">02</span><div><h2>Entre o documento<br />e a <em>atmosfera.</em></h2><p>Deva Braga é fotógrafo e designer gráfico em Salvador. Seu trabalho percorre pessoas, lugares e marcas em busca de uma imagem que carregue presença.</p><a href="#contato">Conheça o processo <ArrowUpRight size={17} /></a></div></section>
      <footer className="footer" id="contato"><div><span className="section-index">03</span><p>Tem uma ideia em mente?</p><a href="mailto:oi@devabraga.com">oi@devabraga.com</a></div><div className="footer-right"><span>Salvador, BR</span><span>© 2026 Deva Braga</span></div></footer>

      <div className={`menu-panel ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button><div className="menu-inner"><p className="eyebrow">Navegação</p><nav><a href="#top" onClick={() => setMenuOpen(false)}>Início <span>01</span></a><a href="#trabalhos" onClick={() => setMenuOpen(false)}>Trabalhos <span>02</span></a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre <span>03</span></a><a href="#contato" onClick={() => setMenuOpen(false)}>Contato <span>04</span></a></nav><p className="menu-note">Fotografia, design gráfico e edição<br />a partir de Salvador.</p></div></div>

      {selected && <div className="project-view" role="dialog" aria-modal="true" aria-label={selected.title}><button className="project-close" onClick={() => setSelected(null)} aria-label="Fechar projeto"><X /></button><div className="project-header"><div><span className="eyebrow">{String(selected.id).padStart(2, "0")} / {selected.year} / {categoryFor(selected)}</span><h2>{selected.title}</h2></div><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Ver página original <ExternalLink size={15} /></a></div><div className="project-media-grid">{mediaFor(selected).map((item, i) => <figure key={`${item.src}-${i}`} className={i === 0 ? "project-media-feature" : ""}><SpecialMedia item={item} alt={`${selected.title} — mídia ${i + 1}`} featured={i === 0} /><figcaption>{String(i + 1).padStart(2, "0")} / {mediaFor(selected).length}</figcaption></figure>)}</div><div className="project-controls"><button onClick={() => changeMedia(-1)} aria-label="Mídia anterior"><ChevronLeft /></button><span>{mediaIndex + 1} / {mediaFor(selected).length}</span><button onClick={() => changeMedia(1)} aria-label="Próxima mídia"><ChevronRight /></button></div></div>}
    </main>
  );
}
