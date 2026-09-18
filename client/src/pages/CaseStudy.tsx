import { ArrowLeft, ArrowUp, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Facebook, Linkedin, MessageCircle, Share2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect, useRef, useState } from "react";
import { portfolioProjects } from "@/data/portfolio";
import { trpc } from "@/lib/trpc";
import testimonialData from "@/data/testimonials.json";

type Testimonial = { quote: string; clientName: string; clientRole?: string; avatar?: string; avatarAlt?: string; rating?: number; approved?: boolean };

function sectionCopy(categories: readonly string[]) {
  const type = categories.join(" · ");
  return {
    context: `Projeto de ${type.toLocaleLowerCase()} desenvolvido a partir de uma narrativa visual própria, com atenção ao território, à linguagem e ao acabamento da entrega.`,
    role: `Atuação integral de Deva Braga em ${type.toLocaleLowerCase()}, da direção visual e seleção de referências à produção, edição e organização da apresentação final.`,
    result: "A entrega foi organizada e publicada no portfólio, com as mídias e a descrição do projeto disponíveis para consulta e apresentação profissional.",
  };
}

export default function CaseStudy() {
  const [, params] = useRoute<{ slug: string }>("/estudo-de-caso/:slug");
  const { data: syncedProjects = [] } = trpc.behance.projects.useQuery();
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [readingTestimonial, setReadingTestimonial] = useState<Testimonial | null>(null);
  const touchStartX = useRef<number | null>(null);
  const localProject = portfolioProjects.find(item => item.slug === params?.slug);
  const remoteProject = syncedProjects.find(item => `behance-${item.projectKey}` === params?.slug);
  const project = localProject ?? (remoteProject ? { id: 1000, title: remoteProject.title, slug: `behance-${remoteProject.projectKey}`, year: remoteProject.publishedAt ? new Date(remoteProject.publishedAt).getFullYear().toString() : "Behance", publishedAt: remoteProject.publishedAt?.toISOString(), sourceUrl: remoteProject.sourceUrl, categories: ["Design"] as const, thumbnail: remoteProject.cover ?? "", description: remoteProject.description ?? "Projeto publicado no Behance.", media: [] as string[] } : undefined);
  if (!project) return <main className="case-study-page"><Link href="/">Voltar ao portfólio</Link><h1>Estudo de caso não encontrado.</h1></main>;
  const copy = sectionCopy(project.categories);
  const testimonials = ((testimonialData.projects as Record<string, Testimonial[]>)[project.slug] ?? []).filter(item => item.approved !== false && item.quote.trim() && item.clientName.trim());
  const mediaCount = project.media.length;
  const clientMatch = project.description.match(/cliente:\s*([^.;]+)/i)?.[1]?.trim();
  const metrics = [
    { value: mediaCount ? String(mediaCount).padStart(2, "0") : "—", label: "Mídias documentadas" },
    { value: String(project.categories.length).padStart(2, "0"), label: "Disciplinas envolvidas" },
    { value: project.year, label: "Ano de publicação" },
    { value: clientMatch ? "01" : "—", label: clientMatch ? "Cliente identificado" : "Cliente não informado" },
  ];
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://devabraga-59enyuvp.manus.space/estudo-de-caso/${project.slug}`;
  const shareTitle = `${project.title} — Deva Braga`;
  const shareOn = (network: "whatsapp" | "facebook" | "linkedin") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const urls = { whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` };
    window.open(urls[network], "_blank", "noopener,noreferrer,width=620,height=520");
  };
  const copyShareLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copie o link deste estudo de caso:", shareUrl); }
  };
  const nativeShare = async () => { if (navigator.share) await navigator.share({ title: shareTitle, text: project.description, url: shareUrl }); else await copyShareLink(); };
  const changeTestimonial = (direction: number) => { if (!testimonials.length) return; setTestimonialIndex(index => (index + direction + testimonials.length) % testimonials.length); };
  const handleTestimonialTouchStart = (event: React.TouchEvent) => { touchStartX.current = event.touches[0]?.clientX ?? null; };
  const handleTestimonialTouchEnd = (event: React.TouchEvent) => { if (touchStartX.current === null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current; touchStartX.current = null; if (Math.abs(delta) > 42) changeTestimonial(delta < 0 ? 1 : -1); };
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > Math.max(420, window.innerHeight * 0.7));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (testimonials.length < 2 || autoplayPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => changeTestimonial(1), 6000);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, testimonials.length]);
  useEffect(() => {
    if (!readingTestimonial) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setReadingTestimonial(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [readingTestimonial]);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return <main className="case-study-page">
    {showBackToTop && <button type="button" className="back-to-top case-study-back-to-top" onClick={scrollToTop} aria-label="Voltar ao topo do estudo de caso" title="Voltar ao topo"><ArrowUp size={17} /><span>Topo</span></button>}
    <header className="case-study-header">
      <button className="case-study-back" onClick={() => window.history.back()}><ArrowLeft size={15} /> Voltar</button>
      <span className="eyebrow">Estudo de caso · {project.year}</span>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <a href={project.sourceUrl} target="_blank" rel="noreferrer">Ver projeto original <ExternalLink size={15} /></a>
      <div className="case-study-share" aria-label="Compartilhar estudo de caso">
        <span>Compartilhar</span>
        <button type="button" data-tooltip="WhatsApp" onClick={() => shareOn("whatsapp")} aria-label="Compartilhar no WhatsApp" title="Compartilhar no WhatsApp"><MessageCircle size={15} /></button>
        <button type="button" data-tooltip="Facebook" onClick={() => shareOn("facebook")} aria-label="Compartilhar no Facebook" title="Compartilhar no Facebook"><Facebook size={15} /></button>
        <button type="button" data-tooltip="LinkedIn" onClick={() => shareOn("linkedin")} aria-label="Compartilhar no LinkedIn" title="Compartilhar no LinkedIn"><Linkedin size={15} /></button>
        <button type="button" data-tooltip="Mais opções" onClick={() => void nativeShare()} aria-label="Abrir opções nativas de compartilhamento" title="Mais opções"><Share2 size={15} /></button>
        <button type="button" data-tooltip={copied ? "Link copiado" : "Copiar link"} onClick={() => void copyShareLink()} aria-label={copied ? "Link copiado" : "Copiar link"} title={copied ? "Link copiado" : "Copiar link"}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
        {copied && <small role="status">Link copiado</small>}
      </div>
    </header>
    <section className="case-study-body">
      <figure className="case-study-hero"><img src={project.thumbnail} alt={project.title} loading="eager" decoding="async" /></figure>
      <div className="case-study-sections">
        <article><span className="section-index">01</span><div><h2>Contexto</h2><p>{copy.context}</p></div></article>
        <article><span className="section-index">02</span><div><h2>Minha função</h2><p>{copy.role}</p></div></article>
        <article><span className="section-index">03</span><div><h2>Resultados alcançados</h2><p>{copy.result}</p></div></article>
      </div>
      <section className="case-study-metrics" aria-labelledby="case-metrics-title">
        <div><span className="eyebrow">Leitura quantitativa</span><h2 id="case-metrics-title">O que está documentado.</h2><p>Indicadores calculados a partir do catálogo e da publicação original. Resultados de negócio, alcance e conversão só são exibidos quando existem dados autorizados para este projeto.</p></div>
        <div className="case-study-metric-grid">{metrics.map(metric => <article key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}</div>
      </section>
      <section className="case-study-testimonial" aria-labelledby="case-testimonial-title">
        <span className="eyebrow">Depoimentos de clientes</span>
        <h2 id="case-testimonial-title">A voz de quem participou.</h2>
        {testimonials.length > 0 ? <div className="testimonial-carousel" aria-roledescription="carrossel" aria-label={`Depoimentos de ${project.title}`} onMouseEnter={() => setAutoplayPaused(true)} onMouseLeave={() => setAutoplayPaused(false)} onFocus={() => setAutoplayPaused(true)} onBlur={() => setAutoplayPaused(false)} onTouchStart={handleTestimonialTouchStart} onTouchEnd={handleTestimonialTouchEnd}>
          <div className="testimonial-slide" key={`${project.slug}-${testimonialIndex}`} aria-live="polite" aria-roledescription="slide">
            {testimonials[testimonialIndex].avatar && <img src={testimonials[testimonialIndex].avatar} alt={testimonials[testimonialIndex].avatarAlt ?? `Foto de ${testimonials[testimonialIndex].clientName}`} loading="lazy" />}
            <div className="testimonial-copy"><div className="testimonial-stars" aria-label={`Avaliação: ${Math.min(5, Math.max(0, testimonials[testimonialIndex].rating ?? 0))} de 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className={index < Math.round(testimonials[testimonialIndex].rating ?? 0) ? "is-filled" : ""}>★</span>)}</div><blockquote>“{testimonials[testimonialIndex].quote.length > 280 ? `${testimonials[testimonialIndex].quote.slice(0, 280).trimEnd()}…` : testimonials[testimonialIndex].quote}”</blockquote>{testimonials[testimonialIndex].quote.length > 280 && <button type="button" className="testimonial-read-more" onClick={() => setReadingTestimonial(testimonials[testimonialIndex])}>Ler mais</button>}</div>
            <p className="testimonial-author"><strong>{testimonials[testimonialIndex].clientName}</strong>{testimonials[testimonialIndex].clientRole && <span>{testimonials[testimonialIndex].clientRole}</span>}</p>
          </div>
          {testimonials.length > 1 && <div className="testimonial-controls"><button type="button" onClick={() => changeTestimonial(-1)} aria-label="Depoimento anterior"><ChevronLeft size={17} /></button><span>{String(testimonialIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span><button type="button" onClick={() => changeTestimonial(1)} aria-label="Próximo depoimento"><ChevronRight size={17} /></button></div>}
        </div> : <><blockquote>“Nenhum depoimento foi publicado para este projeto ainda.”</blockquote><p className="case-study-note">Adicione uma citação real e autorizada em <code>client/src/data/testimonials.json</code> para exibi-la aqui.</p></>}
      </section>
    </section>
    {readingTestimonial && <div className="testimonial-modal" role="dialog" aria-modal="true" aria-labelledby="testimonial-modal-title" onClick={() => setReadingTestimonial(null)}><div className="testimonial-modal-card" onClick={event => event.stopPropagation()}><button type="button" className="testimonial-modal-close" onClick={() => setReadingTestimonial(null)} aria-label="Fechar depoimento">×</button><span className="eyebrow">Depoimento completo</span><h2 id="testimonial-modal-title">{readingTestimonial.clientName}</h2><div className="testimonial-stars" aria-label={`Avaliação: ${readingTestimonial.rating ?? 0} de 5`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className={index < Math.round(readingTestimonial.rating ?? 0) ? "is-filled" : ""}>★</span>)}</div><blockquote>“{readingTestimonial.quote}”</blockquote>{readingTestimonial.clientRole && <p>{readingTestimonial.clientRole}</p>}</div></div>}
    <footer className="case-study-footer"><Link href="/#trabalhos">Todos os trabalhos</Link><Link href="/#contato">Solicitar orçamento</Link></footer>
  </main>;
}
