import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Moon, Search, Sun, X } from "lucide-react";
import { categories, portfolioProjects, type PortfolioProject } from "@/data/portfolio";
import { trpc } from "@/lib/trpc";
import QuoteForm from "@/components/QuoteForm";

function Media({ src, alt, featured = false }: { src: string; alt: string; featured?: boolean }) {
  const lower = src.toLowerCase();
  if (lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov")) return <video src={src} controls={!featured} muted={featured} autoPlay={featured} loop={featured} playsInline aria-label={alt} />;
  return <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src={src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

function categoryFor(project: PortfolioProject) { return project.categories.join(" · "); }

function yearScore(year: string) { const parsed = Number(year); return Number.isFinite(parsed) ? parsed : 0; }
function recencyScore(project: PortfolioProject) { if (project.publishedAt) { const timestamp = Date.parse(project.publishedAt); if (Number.isFinite(timestamp)) return timestamp; } return yearScore(project.year) * 100000 - project.id; }

function extraMedia(override: { media?: string | null } | undefined) { try { return override?.media ? JSON.parse(override.media) as string[] : []; } catch { return []; } }

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

function mediaTypesFor(project: PortfolioProject) {
  const media = mediaFor(project);
  if (!media.length) return ["Sem mídia"];
  const types = new Set(media.map(item => item.kind === "image" ? "Imagem" : item.kind === "youtube" ? "Vídeo" : "Embed"));
  return Array.from(types);
}

function SpecialMedia({ item, alt, featured = false }: { item: { kind: "image" | "youtube" | "embed"; src: string }; alt: string; featured?: boolean }) {
  if (item.kind === "youtube" || item.kind === "embed") return <iframe className="embedded-media" src={item.src} title={alt} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading={featured ? "eager" : "lazy"} />;
  return <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src={item.src} alt={alt} loading={featured ? "eager" : "lazy"} />;
}

function getVisitorId() {
  const key = "deva-portfolio-visitor";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
  } catch {}
  const created = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  try { window.localStorage.setItem(key, created); } catch {}
  return created;
}

function getCookieChoice() {
  try { return window.localStorage.getItem("deva-cookie-choice"); } catch { return null; }
}

function saveCookieChoice(choice: "accepted" | "rejected") {
  try { window.localStorage.setItem("deva-cookie-choice", choice); } catch {}
}

function getThemeChoice() {
  try { return window.localStorage.getItem("deva-theme") === "dark"; } catch { return false; }
}

export default function Home() {
  const { data: syncedProjects = [] } = trpc.behance.projects.useQuery();
  const { data: overrides = [] } = trpc.portfolio.overrides.useQuery();
  const { data: accessCounts = [] } = trpc.analytics.projectAccess.useQuery();
  const track = trpc.analytics.track.useMutation();
  const [cookieChoice, setCookieChoice] = useState<string | null>(() => getCookieChoice());
  const [darkMode, setDarkMode] = useState(() => getThemeChoice());
  useEffect(() => { if (cookieChoice === "accepted") track.mutate({ eventType: "page_view", path: window.location.pathname, visitorId: getVisitorId() }); }, [cookieChoice]);
  const allProjects = useMemo<PortfolioProject[]>(() => {
    const existing = new Set(portfolioProjects.map(project => project.title.trim().toLocaleLowerCase()));
    const remote = syncedProjects.filter(project => !existing.has(project.title.trim().toLocaleLowerCase())).map((project, index) => ({
      id: 1000 + index, title: project.title, slug: `behance-${project.projectKey}`, year: project.publishedAt ? new Date(project.publishedAt).getFullYear().toString() : "Behance", publishedAt: project.publishedAt?.toISOString(), sourceUrl: project.sourceUrl, categories: ["Design"] as PortfolioProject["categories"], thumbnail: project.cover ?? "", description: project.description ?? "Projeto publicado no Behance.", media: [],
    }));
    const festival = portfolioProjects.find(project => project.slug === "festival-gastronomico-da-feira-de-sao-joaquim");
    const archive = portfolioProjects.filter(project => project.slug !== festival?.slug);
    const base = festival ? [festival, ...remote, ...archive] : [...remote, ...portfolioProjects];
    const overrideMap = new Map(overrides.map(override => [override.projectKey, override]));
    return base.flatMap(project => {
      const override = overrideMap.get(project.slug);
      if (override?.hidden) return [];
      return [{ ...project, title: override?.title ?? project.title, description: override?.description ?? project.description, year: override?.year ?? project.year, thumbnail: override?.thumbnail ?? project.thumbnail, sourceUrl: override?.sourceUrl ?? project.sourceUrl, media: [...project.media, ...extraMedia(override)] }];
    });
  }, [overrides, syncedProjects]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("Todos");
  const [mediaFilter, setMediaFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "accessed" | "alphabetical">("recent");
  const [selected, setSelected] = useState<PortfolioProject | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const years = useMemo(() => Array.from(new Set(allProjects.map(project => project.year).filter(year => /^\d{4}$/.test(year)))).sort((a, b) => Number(b) - Number(a)), [allProjects]);
  const accessMap = useMemo(() => new Map(accessCounts.map(item => [item.projectKey ?? "", Number(item.accesses)])), [accessCounts]);
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const matching = allProjects.filter(project => (filter === "Todos" || project.categories.includes(filter)) && (yearFilter === "Todos" || project.year === yearFilter) && (mediaFilter === "Todos" || mediaTypesFor(project).includes(mediaFilter)) && (!query || project.title.toLocaleLowerCase().includes(query)));
    return [...matching].sort((a, b) => {
      if (sortOrder === "alphabetical") return a.title.localeCompare(b.title, "pt-BR");
      if (sortOrder === "accessed") return (accessMap.get(b.slug) ?? 0) - (accessMap.get(a.slug) ?? 0) || recencyScore(b) - recencyScore(a) || a.title.localeCompare(b.title, "pt-BR");
      if (sortOrder === "oldest") return recencyScore(a) - recencyScore(b) || a.title.localeCompare(b.title, "pt-BR");
      return recencyScore(b) - recencyScore(a) || a.title.localeCompare(b.title, "pt-BR");
    });
  }, [accessMap, allProjects, filter, mediaFilter, searchQuery, sortOrder, yearFilter]);
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { window.localStorage.setItem("deva-theme", next ? "dark" : "light"); } catch {} };
  
  const openProject = (project: PortfolioProject) => { setSelected(project); setMediaIndex(0); };
  const changeMedia = (direction: number) => { if (!selected) return; const total = mediaFor(selected).length; if (!total) return; setMediaIndex((mediaIndex + direction + total) % total); };

  return (
    <main className={`site-shell${darkMode ? " dark-mode" : ""}`}>
      <header className="topbar"><a className="wordmark" href="#top" aria-label="Deva Braga, início">DEVA<br /><span>BRAGA</span></a><div className="topbar-center">Portfólio / 2025—26</div><div className="topbar-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}>{darkMode ? <Sun size={15} /> : <Moon size={15} />}</button><button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">Menu <span className="menu-lines"><i /><i /></span></button></div></header>
      <section className="hero" id="top"><p className="eyebrow">Fotografia · Design gráfico · Edição</p><h1>Imagens que<br /><em>ficam.</em></h1><div className="hero-footer"><p>Um arquivo visual entre Salvador,<br />a rua e o que ainda não tem nome.</p><a href="#trabalhos" className="scroll-cue">Explorar trabalhos <ArrowDownRight size={17} /></a></div></section>

      <section className="work-section" id="trabalhos">
        <div className="section-heading"><div><span className="section-index">01</span><h2>Trabalhos</h2></div><p>{allProjects.length} projetos<br />{allProjects.filter(p => p.id < 1000).length} páginas · {allProjects.reduce((sum, p) => sum + mediaFor(p).length, 0)} mídias</p></div>
        <div className="work-tools"><div className="filter-row" aria-label="Filtrar trabalhos por categoria">{categories.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<sup>{item === "Todos" ? allProjects.length : allProjects.filter(p => p.categories.includes(item)).length}</sup></button>)}</div><label className="work-search"><Search size={16} /><span className="sr-only">Buscar trabalhos pelo nome</span><input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar trabalhos pelo nome" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Limpar busca"><X size={14} /></button>}</label></div>
        <div className="advanced-work-tools"><label>Ano<select value={yearFilter} onChange={event => setYearFilter(event.target.value)}><option>Todos</option>{years.map(year => <option key={year}>{year}</option>)}</select></label><label>Mídia<select value={mediaFilter} onChange={event => setMediaFilter(event.target.value)}><option>Todos</option><option>Imagem</option><option>Vídeo</option><option>Embed</option><option>Sem mídia</option></select></label><label>Ordenar<select value={sortOrder} onChange={event => setSortOrder(event.target.value as typeof sortOrder)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="accessed">Mais acessados</option><option value="alphabetical">Ordem alfabética</option></select></label></div>
        {filtered.length === 0 && <p className="empty-search">Nenhum trabalho encontrado para esta busca.</p>}
        <div className="catalog-grid">{filtered.map((project) => <button className="catalog-card" key={project.id} onClick={() => { if (cookieChoice === "accepted") track.mutate({ eventType: "project_click", path: window.location.pathname, projectKey: project.slug, visitorId: getVisitorId() }); openProject(project); }} aria-label={`Abrir projeto ${project.title}`}><div className="catalog-image"><img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src={project.thumbnail} alt={project.title} loading="lazy" /><span className="card-shade" /><span className="card-arrow"><ArrowUpRight size={18} /></span></div><div className="catalog-meta"><span className="catalog-number">{String(project.id).padStart(2, "0")}</span><span><strong>{project.title}</strong><small>{project.year} · {categoryFor(project)} · {mediaTypesFor(project).join(" + ")} · {mediaFor(project).length} mídias</small></span></div></button>)}</div>
      </section>

      <section className="statement" id="sobre">
        <span className="section-index">02</span>
        <div className="statement-copy">
          <h2>Entre o documento<br />e a <em>atmosfera.</em></h2>
          <p>Deva Braga é fotógrafo e designer gráfico e reside em Salvador. Seu trabalho percorre pessoas, lugares e marcas em busca de uma imagem que carregue presença.</p>
          <a href="#contato">Conheça o processo <ArrowUpRight size={17} /></a>
        </div>
        <figure className="statement-portrait">
          <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src="/manus-storage/portfolio/about/fotoperfildevacircular_688f59af.png" alt="Retrato de Deva Braga diante do mar" loading="lazy" />
          <figcaption>Deva Braga / Fotógrafo e Designer Gráfico</figcaption>
        </figure>
      </section>
      <footer className="footer" id="contato"><div className="footer-intro"><span className="section-index">03</span><p>Tem uma ideia em mente?</p><a href="mailto:deva.jpeg@gmail.com">deva.jpeg@gmail.com</a><div className="footer-links"><a href="https://www.behance.net/deva_braga" target="_blank" rel="noreferrer" onClick={() => { if (cookieChoice === "accepted") track.mutate({ eventType: "external_click", path: window.location.pathname, projectKey: "behance", visitorId: getVisitorId() }); }}>MEU BEHANCE <ExternalLink size={14} /></a><a href="https://stock.adobe.com/br/contributor/212810827/Deva%20Braga" target="_blank" rel="noreferrer" onClick={() => { if (cookieChoice === "accepted") track.mutate({ eventType: "external_click", path: window.location.pathname, projectKey: "adobe-stock", visitorId: getVisitorId() }); }}>ADOBE STOCK <ExternalLink size={14} /></a></div></div><div className="footer-form" id="orcamento"><QuoteForm /></div><div className="footer-right"><span>Salvador, BR</span><span>© 2026 Deva Braga</span></div></footer>

      <div className={`menu-panel ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button><div className="menu-inner"><p className="eyebrow">Navegação</p><nav><a href="#top" onClick={() => setMenuOpen(false)}>Início <span>01</span></a><a href="#trabalhos" onClick={() => setMenuOpen(false)}>Trabalhos <span>02</span></a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre <span>03</span></a><a href="#contato" onClick={() => setMenuOpen(false)}>Contato <span>04</span></a></nav><p className="menu-note">Fotografia, design gráfico e edição<br />a partir de Salvador.</p></div></div>

      {selected && <div className="project-view" role="dialog" aria-modal="true" aria-label={selected.title}><button className="project-close" onClick={() => setSelected(null)} aria-label="Fechar projeto"><X /></button><div className="project-header"><div><span className="quick-view-label">Visualização rápida</span><span className="eyebrow">{String(selected.id).padStart(2, "0")} / {selected.year} / {categoryFor(selected)}</span><h2>{selected.title}</h2><p className="project-description">{selected.description}</p></div><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Ver página original <ExternalLink size={15} /></a></div><div className="project-media-grid">{mediaFor(selected).map((item, i) => <figure key={`${item.src}-${i}`} className={i === 0 ? "project-media-feature" : ""}><SpecialMedia item={item} alt={`${selected.title} — mídia ${i + 1}`} featured={i === 0} /><figcaption>{String(i + 1).padStart(2, "0")} / {mediaFor(selected).length}</figcaption></figure>)}</div>{mediaFor(selected).length === 0 && <div className="project-media-empty"><p>Este projeto está publicado no Behance.</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Abrir projeto no Behance <ExternalLink size={15} /></a></div>}{mediaFor(selected).length > 0 && <div className="project-controls"><button onClick={() => changeMedia(-1)} aria-label="Mídia anterior"><ChevronLeft /></button><span>{mediaIndex + 1} / {mediaFor(selected).length}</span><button onClick={() => changeMedia(1)} aria-label="Próxima mídia"><ChevronRight /></button></div>}</div>}
      {!cookieChoice && <aside className="cookie-banner" role="dialog" aria-label="Aviso de cookies"><p>Este site utiliza cookies para melhorar a navegação. <a href="/politica-de-privacidade">Política de privacidade</a></p><div><button onClick={() => { saveCookieChoice("accepted"); setCookieChoice("accepted"); }}>Aceitar</button><button className="cookie-reject" onClick={() => { saveCookieChoice("rejected"); setCookieChoice("rejected"); }}>Recusar</button></div></aside>}
    </main>
  );
}
