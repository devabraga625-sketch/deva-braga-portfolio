import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Moon, Search, Sun, X } from "lucide-react";
import { categories, portfolioProjects, type PortfolioProject } from "@/data/portfolio";
import { trpc } from "@/lib/trpc";
import { pushGtmEvent } from "@/lib/gtm";
import QuoteForm from "@/components/QuoteForm";

function Media({ src, alt, featured = false }: { src: string; alt: string; featured?: boolean }) {
  const lower = src.toLowerCase();
  if (lower.includes(".mp4") || lower.includes(".webm") || lower.includes(".mov")) return <video src={src} controls={!featured} muted={featured} autoPlay={featured} loop={featured} playsInline aria-label={alt} />;
  return <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src={src} alt={alt} loading={featured ? "eager" : "lazy"} decoding="async" />;
}

function categoryFor(project: PortfolioProject) { return project.categories.join(" · "); }

function yearScore(year: string) { const parsed = Number(year); return Number.isFinite(parsed) ? parsed : 0; }
function recencyScore(project: PortfolioProject) { if (project.publishedAt) { const timestamp = Date.parse(project.publishedAt); if (Number.isFinite(timestamp)) return timestamp; } return yearScore(project.year) * 100000 - project.id; }

function extraMedia(override: { media?: string | null } | undefined) { try { return override?.media ? JSON.parse(override.media) as string[] : []; } catch { return []; } }
function extraMediaMetadata(override: { mediaMetadata?: string | null } | undefined) { try { return override?.mediaMetadata ? JSON.parse(override.mediaMetadata) as PortfolioProject["mediaMetadata"] : undefined; } catch { return undefined; } }

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

function SpecialMedia({ item, alt, featured = false, onAssetError }: { item: { kind: "image" | "youtube" | "embed"; src: string }; alt: string; featured?: boolean; onAssetError?: () => void }) {
  if (item.kind === "youtube" || item.kind === "embed") return <iframe className="embedded-media" src={item.src} title={alt} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading={featured ? "eager" : "lazy"} />;
  return <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} onError={onAssetError} src={item.src} alt={alt} loading={featured ? "eager" : "lazy"} decoding="async" />;
}

function FullscreenContent({ item, alt }: { item: { kind: "image" | "youtube" | "embed"; src: string }; alt: string }) {
  if (item.kind === "youtube" || item.kind === "embed") return <iframe className="fullscreen-embed" src={item.src} title={alt} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  return <img className="fullscreen-image protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src={item.src} alt={alt} />;
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
  const { data: downloadCounts = [] } = trpc.portfolio.mediaDownloads.useQuery();
  const { data: accessCounts = [] } = trpc.analytics.projectAccess.useQuery();
  const utils = trpc.useUtils();
  const track = trpc.analytics.track.useMutation();
  const registerDownload = trpc.portfolio.registerDownload.useMutation({ onSuccess: () => utils.portfolio.mediaDownloads.invalidate() });
  const reportAssetError = (projectKey: string) => { if (cookieChoice === "accepted") { track.mutate({ eventType: "asset_error", path: window.location.pathname, projectKey, visitorId: getVisitorId() }); pushGtmEvent({ event: "portfolio_asset_error", project_key: projectKey }); } };
  const [cookieChoice, setCookieChoice] = useState<string | null>(() => getCookieChoice());
  const [darkMode, setDarkMode] = useState(() => getThemeChoice());
  useEffect(() => { if (cookieChoice === "accepted") track.mutate({ eventType: "page_view", path: window.location.pathname, visitorId: getVisitorId() }); }, [cookieChoice]);
  const allProjects = useMemo<PortfolioProject[]>(() => {
    const remoteByTitle = new Map(syncedProjects.map(project => [project.title.trim().toLocaleLowerCase(), project]));
    const local = portfolioProjects.map(project => {
      const remote = remoteByTitle.get(project.title.trim().toLocaleLowerCase());
      const publishedAt = remote?.publishedAt?.toISOString() ?? project.publishedAt;
      return { ...project, publishedAt, year: publishedAt ? new Date(publishedAt).getFullYear().toString() : project.year, sourceUrl: remote?.sourceUrl ?? project.sourceUrl, thumbnail: remote?.cover ?? project.thumbnail };
    });
    const existing = new Set(local.map(project => project.title.trim().toLocaleLowerCase()));
    const remote = syncedProjects.filter(project => !existing.has(project.title.trim().toLocaleLowerCase())).map((project, index) => ({
      id: 1000 + index, title: project.title, slug: `behance-${project.projectKey}`, year: project.publishedAt ? new Date(project.publishedAt).getFullYear().toString() : "Behance", publishedAt: project.publishedAt?.toISOString(), sourceUrl: project.sourceUrl, categories: ["Design"] as PortfolioProject["categories"], thumbnail: project.cover ?? "", description: project.description ?? "Projeto publicado no Behance.", media: [],
    }));
    const base = [...local, ...remote].sort((a, b) => recencyScore(b) - recencyScore(a) || a.title.localeCompare(b.title, "pt-BR"));
    const overrideMap = new Map(overrides.map(override => [override.projectKey, override]));
    return base.flatMap(project => {
      const override = overrideMap.get(project.slug);
      if (override?.hidden) return [];
      return [{ ...project, title: override?.title ?? project.title, description: override?.description ?? project.description, year: override?.year ?? project.year, thumbnail: override?.thumbnail ?? project.thumbnail, sourceUrl: override?.sourceUrl ?? project.sourceUrl, media: [...project.media, ...extraMedia(override)], mediaMetadata: extraMediaMetadata(override), license: override?.license ?? undefined, allowDownloads: override ? Boolean(override.allowDownloads) : true }];
    });
  }, [overrides, syncedProjects]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof categories)[number]>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("Todos");
  const [mediaFilter, setMediaFilter] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "accessed" | "alphabetical">("recent");
  const [selected, setSelected] = useState<PortfolioProject | null>(null);
  const [projectClosing, setProjectClosing] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenClosing, setFullscreenClosing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const years = useMemo(() => Array.from(new Set(allProjects.map(project => project.year).filter(year => /^\d{4}$/.test(year)))).sort((a, b) => Number(b) - Number(a)), [allProjects]);
  const accessMap = useMemo(() => new Map(accessCounts.map(item => [item.projectKey ?? "", Number(item.accesses)])), [accessCounts]);
  const lastBehanceSync = useMemo(() => syncedProjects.reduce<Date | null>((latest, project) => {
    const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;
    return updatedAt && (!latest || updatedAt > latest) ? updatedAt : latest;
  }, null), [syncedProjects]);
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
  const filterSignature = `${filter}-${yearFilter}-${mediaFilter}-${sortOrder}-${searchQuery}`;
  const toggleTheme = () => { const next = !darkMode; setDarkMode(next); try { window.localStorage.setItem("deva-theme", next ? "dark" : "light"); } catch {} };
  
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const closeFullscreen = () => { if (!fullscreenOpen || fullscreenClosing) return; setFullscreenClosing(true); window.setTimeout(() => { setFullscreenOpen(false); setFullscreenClosing(false); }, 180); };
  const openProject = (project: PortfolioProject) => { setProjectClosing(false); setSelected(project); setMediaIndex(0); setFullscreenOpen(false); setFullscreenClosing(false); resetZoom(); };
  const closeProject = () => { if (!selected || projectClosing) return; setProjectClosing(true); window.setTimeout(() => { setSelected(null); setProjectClosing(false); }, 220); };
  const changeProject = (direction: number) => { if (!selected || projectClosing || fullscreenOpen || filtered.length < 2) return; const index = filtered.findIndex(project => project.id === selected.id); if (index < 0) return; openProject(filtered[(index + direction + filtered.length) % filtered.length]); };
  const changeMedia = (direction: number) => { if (!selected) return; const total = mediaFor(selected).length; if (!total) return; setMediaIndex((mediaIndex + direction + total) % total); };
  const mediaMetadata = (project: PortfolioProject, index: number) => project.mediaMetadata?.[String(index)] ?? {};
  const downloadCount = (projectKey: string, index: number) => Number(downloadCounts.find(item => item.projectKey === projectKey && item.mediaIndex === index)?.downloads ?? 0);
  const downloadMedia = async (project: PortfolioProject, src: string, index: number) => { try { await registerDownload.mutateAsync({ projectKey: project.slug, mediaIndex: index, visitorId: cookieChoice === "accepted" ? getVisitorId() : undefined }); pushGtmEvent({ event: "portfolio_media_download", project_key: project.slug, project_title: project.title, media_index: String(index), download_license: "authorized" }); } catch { return; } try { const response = await fetch(src); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `deva-braga-midia-${String(index + 1).padStart(2, "0")}`; link.click(); URL.revokeObjectURL(url); } catch { window.open(src, "_blank", "noopener,noreferrer"); } };
  const beginDrag = (event: React.PointerEvent) => { if (zoom <= 1) return; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); dragStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; };
  const moveDrag = (event: React.PointerEvent) => { if (!dragStart.current) return; setPan({ x: dragStart.current.panX + event.clientX - dragStart.current.x, y: dragStart.current.panY + event.clientY - dragStart.current.y }); };
  const endDrag = () => { dragStart.current = null; };
  const pinchDistance = (touches: React.TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const handlePinchStart = (event: React.TouchEvent) => { if (event.touches.length === 2) pinchStart.current = { distance: pinchDistance(event.touches), zoom }; };
  const handlePinchMove = (event: React.TouchEvent) => { if (event.touches.length === 2 && pinchStart.current) { event.preventDefault(); setZoom(Math.min(3, Math.max(1, pinchStart.current.zoom * (pinchDistance(event.touches) / pinchStart.current.distance)))); } };
  const handleWheel = (event: React.WheelEvent) => { event.preventDefault(); setZoom(value => Math.min(3, Math.max(1, value - event.deltaY * 0.002))); };
  useEffect(() => {
    if (!fullscreenOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFullscreen();
      if (event.key === "ArrowLeft") changeMedia(-1);
      if (event.key === "ArrowRight") changeMedia(1);
    };
    document.body.style.overflow = "hidden";
    resetZoom();
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [fullscreenOpen, selected, mediaIndex]);
  useEffect(() => {
    if (!selected) return;
    const onProjectKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (fullscreenOpen) closeFullscreen();
        else closeProject();
        return;
      }
      if (!fullscreenOpen && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        changeProject(event.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onProjectKeyDown);
    return () => window.removeEventListener("keydown", onProjectKeyDown);
  }, [selected, fullscreenOpen, fullscreenClosing, projectClosing, filtered]);

  return (
    <main className={`site-shell${darkMode ? " dark-mode" : ""}`}>
      <header className="topbar"><a className="wordmark" href="#top" aria-label="Deva Braga, início">DEVA<br /><span>BRAGA</span></a><div className="topbar-center">Portfólio / 2025—26</div><div className="topbar-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}>{darkMode ? <Sun size={15} /> : <Moon size={15} />}</button><button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">Menu <span className="menu-lines"><i /><i /></span></button></div></header>
      <section className="hero" id="top"><p className="eyebrow">Fotografia · Design gráfico · Edição</p><h1>Imagens que<br /><em>ficam.</em></h1><div className="hero-footer"><p>Um arquivo visual entre Salvador,<br />a rua e o que ainda não tem nome.</p><a href="#trabalhos" className="scroll-cue">Explorar trabalhos <ArrowDownRight size={17} /></a></div></section>

      <section className="work-section" id="trabalhos">
        <div className="section-heading"><div><span className="section-index">01</span><h2>Trabalhos</h2></div><p>{allProjects.length} projetos<br />{allProjects.filter(p => p.id < 1000).length} páginas · {allProjects.reduce((sum, p) => sum + mediaFor(p).length, 0)} mídias<br /><span className="sync-status">{lastBehanceSync ? `Behance atualizado ${lastBehanceSync.toLocaleDateString("pt-BR")}` : "Aguardando sincronização"}</span></p></div>
        <div className="work-tools"><div className="filter-row" aria-label="Filtrar trabalhos por categoria">{categories.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}<sup>{item === "Todos" ? allProjects.length : allProjects.filter(p => p.categories.includes(item)).length}</sup></button>)}</div><label className="work-search"><Search size={16} /><span className="sr-only">Buscar trabalhos pelo nome</span><input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar trabalhos pelo nome" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Limpar busca"><X size={14} /></button>}</label></div>
        <div className="advanced-work-tools"><label>Ano<select value={yearFilter} onChange={event => setYearFilter(event.target.value)}><option>Todos</option>{years.map(year => <option key={year}>{year}</option>)}</select></label><label>Mídia<select value={mediaFilter} onChange={event => setMediaFilter(event.target.value)}><option>Todos</option><option>Imagem</option><option>Vídeo</option><option>Embed</option><option>Sem mídia</option></select></label><label>Ordenar<select value={sortOrder} onChange={event => setSortOrder(event.target.value as typeof sortOrder)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="accessed">Mais acessados</option><option value="alphabetical">Ordem alfabética</option></select></label></div>
        {filtered.length === 0 && <p className="empty-search">Nenhum trabalho encontrado para esta busca.</p>}
        <div className="catalog-grid" key={filterSignature}>{filtered.map((project, index) => <button className="catalog-card" key={project.id} onClick={() => { if (cookieChoice === "accepted") { track.mutate({ eventType: "project_click", path: window.location.pathname, projectKey: project.slug, visitorId: getVisitorId() }); pushGtmEvent({ event: "portfolio_project_click", project_key: project.slug, project_title: project.title, project_year: project.year }); } openProject(project); }} aria-label={`Abrir projeto ${project.title}`}><div className="catalog-image"><img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} onError={() => reportAssetError(project.slug)} src={project.thumbnail} alt={project.title} loading="lazy" decoding="async" /><span className="card-shade" /><span className="card-arrow"><ArrowUpRight size={18} /></span></div><div className="catalog-meta"><span className="catalog-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{project.title}</strong><small>{project.year} · {categoryFor(project)} · {mediaTypesFor(project).join(" + ")} · {mediaFor(project).length} mídias</small></span></div></button>)}</div>
      </section>

      <section className="statement" id="sobre">
        <span className="section-index">02</span>
        <div className="statement-copy">
          <h2>Entre o documento<br />e a <em>atmosfera.</em></h2>
          <p>Deva Braga é fotógrafo e designer gráfico e reside em Salvador. Seu trabalho percorre pessoas, lugares e marcas em busca de uma imagem que carregue presença.</p>
          <a href="#contato">Conheça o processo <ArrowUpRight size={17} /></a>
        </div>
        <figure className="statement-portrait">
          <img className="protected-media" draggable={false} onContextMenu={event => event.preventDefault()} src="/manus-storage/portfolio/about/fotoperfildevacircular_688f59af.png" alt="Retrato de Deva Braga diante do mar" loading="lazy" decoding="async" />
          <figcaption>Deva Braga / Fotógrafo e Designer Gráfico</figcaption>
        </figure>
      </section>
      <footer className="footer" id="contato"><div className="footer-intro"><span className="section-index">03</span><p>Tem uma ideia em mente?</p><a href="mailto:deva.jpeg@gmail.com">deva.jpeg@gmail.com</a><div className="footer-links"><a href="https://www.behance.net/deva_braga" target="_blank" rel="noreferrer" onClick={() => { if (cookieChoice === "accepted") track.mutate({ eventType: "external_click", path: window.location.pathname, projectKey: "behance", visitorId: getVisitorId() }); }}>MEU BEHANCE <ExternalLink size={14} /></a><a href="https://stock.adobe.com/br/contributor/212810827/Deva%20Braga" target="_blank" rel="noreferrer" onClick={() => { if (cookieChoice === "accepted") track.mutate({ eventType: "external_click", path: window.location.pathname, projectKey: "adobe-stock", visitorId: getVisitorId() }); }}>ADOBE STOCK <ExternalLink size={14} /></a></div></div><div className="footer-form" id="orcamento"><QuoteForm /></div><div className="footer-right"><span>Salvador, BR</span><span>© 2026 Deva Braga</span></div></footer>

      <div className={`menu-panel ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button><div className="menu-inner"><p className="eyebrow">Navegação</p><nav><a href="#top" onClick={() => setMenuOpen(false)}>Início <span>01</span></a><a href="#trabalhos" onClick={() => setMenuOpen(false)}>Trabalhos <span>02</span></a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre <span>03</span></a><a href="#contato" onClick={() => setMenuOpen(false)}>Contato <span>04</span></a></nav><p className="menu-note">Fotografia, design gráfico e edição<br />a partir de Salvador.</p></div></div>

      {selected && <div className={`project-view${projectClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={selected.title}><button className="project-close" onClick={closeProject} aria-label="Fechar projeto"><X /></button><div className="project-header"><div><span className="quick-view-label">Visualização rápida</span><span className="eyebrow">{String(selected.id).padStart(2, "0")} / {selected.year} / {categoryFor(selected)}</span><h2>{selected.title}</h2><p className="project-description">{selected.description}</p></div><div className="project-header-links"><a href={`/estudo-de-caso/${selected.slug}`}>Estudo de caso <ArrowDownRight size={15} /></a><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Ver página original <ExternalLink size={15} /></a></div></div><div className="project-media-grid">{mediaFor(selected).map((item, i) => <figure key={`${item.src}-${i}`} className={i === 0 ? "project-media-feature" : ""}><SpecialMedia item={item} alt={mediaMetadata(selected, Math.max(0, i - (specialMedia[selected.slug]?.length ?? 0))).alt ?? `${selected.title} — mídia ${i + 1}`} featured={i === 0} onAssetError={() => reportAssetError(selected.slug)} /><div className="media-actions"><button className="media-expand" onClick={() => { setMediaIndex(i); setFullscreenOpen(true); }} aria-label={`Ampliar mídia ${i + 1} de ${mediaFor(selected).length}`}>Tela cheia ↗</button>{selected.allowDownloads && <><button className="media-download-inline" onClick={event => { event.stopPropagation(); void downloadMedia(selected, item.src, i); }} aria-label={`Baixar mídia ${i + 1} de ${mediaFor(selected).length}`}>Baixar</button><span className="media-download-count" aria-label={`${downloadCount(selected.slug, i)} downloads`}>{downloadCount(selected.slug, i)} downloads</span></>}</div>{selected.allowDownloads && <small className="media-license">{selected.license ?? "Todos os direitos reservados — uso mediante autorização."}</small>}<figcaption>{mediaMetadata(selected, Math.max(0, i - (specialMedia[selected.slug]?.length ?? 0))).caption ?? `${String(i + 1).padStart(2, "0")} / ${mediaFor(selected).length}`}</figcaption></figure>)}</div>{mediaFor(selected).length === 0 && <div className="project-media-empty"><p>Este projeto está publicado no Behance.</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Abrir projeto no Behance <ExternalLink size={15} /></a></div>}{mediaFor(selected).length > 0 && <div className="project-controls"><button onClick={() => changeMedia(-1)} aria-label="Mídia anterior"><ChevronLeft /></button><span>{mediaIndex + 1} / {mediaFor(selected).length}</span><button onClick={() => changeMedia(1)} aria-label="Próxima mídia"><ChevronRight /></button></div>}{fullscreenOpen && mediaFor(selected)[mediaIndex] && <div className={`fullscreen-view${fullscreenClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={`Tela cheia: ${selected.title}`} onClick={closeFullscreen}><button className="fullscreen-close" onClick={event => { event.stopPropagation(); closeFullscreen(); }} aria-label="Fechar tela cheia"><X /></button><button className="fullscreen-nav fullscreen-prev" onClick={event => { event.stopPropagation(); changeMedia(-1); }} aria-label="Mídia anterior"><ChevronLeft /></button><div className="fullscreen-content" onClick={event => event.stopPropagation()} onWheel={handleWheel} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onTouchStart={handlePinchStart} onTouchMove={handlePinchMove} onTouchEnd={() => { pinchStart.current = null; }}><div className="fullscreen-visual" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}><FullscreenContent item={mediaFor(selected)[mediaIndex]} alt={mediaMetadata(selected, Math.max(0, mediaIndex - (specialMedia[selected.slug]?.length ?? 0))).alt ?? `${selected.title} — mídia ${mediaIndex + 1}`} /></div><div className="fullscreen-details"><strong>{mediaMetadata(selected, Math.max(0, mediaIndex - (specialMedia[selected.slug]?.length ?? 0))).caption ?? selected.title}</strong>{mediaMetadata(selected, Math.max(0, mediaIndex - (specialMedia[selected.slug]?.length ?? 0))).credit && <span>{mediaMetadata(selected, Math.max(0, mediaIndex - (specialMedia[selected.slug]?.length ?? 0))).credit}</span>}<small>{String(mediaIndex + 1).padStart(2, "0")} / {mediaFor(selected).length} · Zoom {Math.round(zoom * 100)}% · Arraste para mover</small>{selected.allowDownloads && <><button className="media-download" onClick={() => downloadMedia(selected, mediaFor(selected)[mediaIndex].src, mediaIndex)}>Baixar mídia autorizada ↓</button><span className="media-download-count">{downloadCount(selected.slug, mediaIndex)} downloads</span><span className="media-license">{selected.license ?? "Todos os direitos reservados — uso mediante autorização."}</span></>}</div></div><button className="fullscreen-nav fullscreen-next" onClick={event => { event.stopPropagation(); changeMedia(1); }} aria-label="Próxima mídia"><ChevronRight /></button></div>}</div>}
      {!cookieChoice && <aside className="cookie-banner" role="dialog" aria-label="Aviso de cookies"><p>Este site utiliza cookies para melhorar a navegação. <a href="/politica-de-privacidade">Política de privacidade</a></p><div><button onClick={() => { saveCookieChoice("accepted"); setCookieChoice("accepted"); }}>Aceitar</button><button className="cookie-reject" onClick={() => { saveCookieChoice("rejected"); setCookieChoice("rejected"); }}>Recusar</button></div></aside>}
    </main>
  );
}
