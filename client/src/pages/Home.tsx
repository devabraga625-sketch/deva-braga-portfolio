import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { categories, portfolioProjects, type PortfolioProject } from "@/data/portfolio";
import { trpc } from "@/lib/trpc";

function Media({ src, alt, featured = false }: { src: string; alt: string; featured?: boolean }) {
  const lower = src.toLowerCase();
  if (lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov")) return <video src={src} controls={!featured} muted={featured} autoPlay={featured} loop={featured} playsInline aria-label={alt} />;
  return <img src={src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

function categoryFor(project: PortfolioProject) { return project.categories.join(" · "); }

const specialMedia: Record<string, Array<{ kind: "image" | "youtube" | "embed"; src: string }>> = {
  "ocupacao-377": [
    { kind: "embed", src: "https://lightroom.adobe.com/embed/shares/a50ed03d5cb1425e947972a52f60bf80" },
  ],
  "a-revolucao-silenciosa": [
    { kind: "youtube", src: "https://www.youtube.com/embed/jaQDrIh1lDM?si=sWQr9Sc3GtUvRJYG" },
  ],
  "zestspice-propaganda": [
    { kind: "embed", src: "https://www-ccv.adobe.io/v1/player/ccv/HgNHUoM6UzU/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View" },
  ],
  "vinheta-savior": [
    { kind: "embed", src: "https://www-ccv.adobe.io/v1/player/ccv/IrznVPAI3gR/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View" },
  ],
  "stories-depyl-care-012026": [
    { kind: "youtube", src: "https://www.youtube.com/embed/Pyd7CJO2H-A?si=BEV73KL_0-_AdWwU" },
  ],
};

function mediaFor(project: PortfolioProject) {
  const special = specialMedia[project.slug];
  if (!special) return project.media.map(src => ({ kind: "image" as const, src }));
  return [...special, ...project.media.map(src => ({ kind: "image" as const, src }))];
}

function SpecialMedia({ item, alt, featured = false }: { item: { kind: "image" | "youtube" | "embed"; src: string }; alt: string; featured?: boolean }) {
  if (item.kind === "youtube" || item.kind === "embed") return <iframe className="embedded-media" src={item.src} title={alt} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading={featured ? "eager" : "lazy"} />;
  return <img src={item.src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

export default function Home() {
  const { data: syncedProjects = [] } = trpc.behance.projects.useQuery();
  const allProjects = useMemo<PortfolioProject[]>(() => {
    const existing = new Set(portfolioProjects.map(project => project.title.trim().toLocaleLowerCase()));
    const remote = syncedProjects.filter(project => !existing.has(project.title.trim().toLocaleLowerCase())).map((project, index) => ({
      id: 1000 + index, title: project.title, slug: `behance-${project.projectKey}`, year: project.publishedAt ? new Date(project.publishedAt).getFullYear().toString() : "Behance", sourceUrl: project.sourceUrl, categories: ["Design"] as PortfolioProject["categories"], thumbnail: project.cover ?? "", description: project.description ?? "Projeto publicado no Behance.", media: [],
    }));
    return [...portfolioProjects, ...remote];
  }, [syncedProjects]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const [selected, setSelected] = useState<PortfolioProject | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const filtered = useMemo(() => filter === "Todos" ? allProjects : allProjects.filter((p) => p.categories.includes(filter)), [allProjects, filter]);
  
  const openProject = (project: PortfolioProject) => { setSelected(project); setMediaIndex(0); };
  const changeMedia = (direction: number) => { if (!selected) return; setMediaIndex((mediaIndex + direction + mediaFor(selected).length) % mediaFor(selected).length); };

  return (
    <main className="site-shell">
      <header className="topbar"><a className="wordmark" href="#top" aria-label="Deva Braga, início">DEVA<br /><span>BRAGA</span></a><div className="topbar-center">Portfólio / 2025—26</div><button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">Menu <span className="menu-lines"><i /><i /></span></button></header>
      <section className="hero" id="top"><p className="eyebrow">Fotografia · Design gráfico · Edição</p><h1>Imagens que<br /><em>ficam.</em></h1><div className="hero-footer"><p>Um arquivo visual entre Salvador,<br />a rua e o que ainda não tem nome.</p><a href="#trabalhos" className="scroll-cue">Explorar trabalhos <ArrowDownRight size={17} /></a></div></section>

      <section className="work-section" id="trabalhos">
        <div className="section-heading"><div><span className="section-index">01</span><h2>Trabalhos</h2></div><p>{allProjects.length} projetos<br />{allProjects.filter(p => p.id < 1000).length} páginas · {allProjects.reduce((sum, p) => sum + mediaFor(p).length, 0)} mídias</p></div>
        <div className="filter-row" aria-label="Filtrar trabalhos por categoria">{categories.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<sup>{item === "Todos" ? allProjects.length : allProjects.filter(p => p.categories.includes(item)).length}</sup></button>)}</div>
        <div className="catalog-grid">{filtered.map((project) => <button className="catalog-card" key={project.id} onClick={() => openProject(project)} aria-label={`Abrir projeto ${project.title}`}><div className="catalog-image"><img src={project.thumbnail} alt={project.title} loading="lazy" /><span className="card-shade" /><span className="card-arrow"><ArrowUpRight size={18} /></span></div><div className="catalog-meta"><span className="catalog-number">{String(project.id).padStart(2, "0")}</span><span><strong>{project.title}</strong><small>{project.year} · {categoryFor(project)} · {mediaFor(project).length} mídias</small></span></div></button>)}</div>
      </section>

      <section className="statement" id="sobre"><span className="section-index">02</span><div><h2>Entre o documento<br />e a <em>atmosfera.</em></h2><p>Deva Braga é fotógrafo e designer gráfico em Salvador. Seu trabalho percorre pessoas, lugares e marcas em busca de uma imagem que carregue presença.</p><a href="#contato">Conheça o processo <ArrowUpRight size={17} /></a></div></section>
      <footer className="footer" id="contato"><div><span className="section-index">03</span><p>Tem uma ideia em mente?</p><a href="mailto:oi@devabraga.com">oi@devabraga.com</a></div><div className="footer-right"><span>Salvador, BR</span><span>© 2026 Deva Braga</span></div></footer>

      <div className={`menu-panel ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button><div className="menu-inner"><p className="eyebrow">Navegação</p><nav><a href="#top" onClick={() => setMenuOpen(false)}>Início <span>01</span></a><a href="#trabalhos" onClick={() => setMenuOpen(false)}>Trabalhos <span>02</span></a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre <span>03</span></a><a href="#contato" onClick={() => setMenuOpen(false)}>Contato <span>04</span></a></nav><p className="menu-note">Fotografia, design gráfico e edição<br />a partir de Salvador.</p></div></div>

      {selected && <div className="project-view" role="dialog" aria-modal="true" aria-label={selected.title}><button className="project-close" onClick={() => setSelected(null)} aria-label="Fechar projeto"><X /></button><div className="project-header"><div><span className="eyebrow">{String(selected.id).padStart(2, "0")} / {selected.year} / {categoryFor(selected)}</span><h2>{selected.title}</h2><p className="project-description">{selected.description}</p></div><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Ver página original <ExternalLink size={15} /></a></div><div className="project-media-grid">{mediaFor(selected).map((item, i) => <figure key={`${item.src}-${i}`} className={i === 0 ? "project-media-feature" : ""}><SpecialMedia item={item} alt={`${selected.title} — mídia ${i + 1}`} featured={i === 0} /><figcaption>{String(i + 1).padStart(2, "0")} / {mediaFor(selected).length}</figcaption></figure>)}</div>{mediaFor(selected).length === 0 && <div className="project-media-empty"><p>Este projeto está publicado no Behance.</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Abrir projeto no Behance <ExternalLink size={15} /></a></div>}<div className="project-controls"><button onClick={() => changeMedia(-1)} aria-label="Mídia anterior"><ChevronLeft /></button><span>{mediaIndex + 1} / {mediaFor(selected).length}</span><button onClick={() => changeMedia(1)} aria-label="Próxima mídia"><ChevronRight /></button></div></div>}
    </main>
  );
}
