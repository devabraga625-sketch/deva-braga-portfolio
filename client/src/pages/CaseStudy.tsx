import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { portfolioProjects } from "@/data/portfolio";
import { trpc } from "@/lib/trpc";

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
  const localProject = portfolioProjects.find(item => item.slug === params?.slug);
  const remoteProject = syncedProjects.find(item => `behance-${item.projectKey}` === params?.slug);
  const project = localProject ?? (remoteProject ? { id: 1000, title: remoteProject.title, slug: `behance-${remoteProject.projectKey}`, year: remoteProject.publishedAt ? new Date(remoteProject.publishedAt).getFullYear().toString() : "Behance", publishedAt: remoteProject.publishedAt?.toISOString(), sourceUrl: remoteProject.sourceUrl, categories: ["Design"] as const, thumbnail: remoteProject.cover ?? "", description: remoteProject.description ?? "Projeto publicado no Behance.", media: [] as string[] } : undefined);
  if (!project) return <main className="case-study-page"><Link href="/">Voltar ao portfólio</Link><h1>Estudo de caso não encontrado.</h1></main>;
  const copy = sectionCopy(project.categories);
  const mediaCount = project.media.length;
  const clientMatch = project.description.match(/cliente:\s*([^.;]+)/i)?.[1]?.trim();
  const metrics = [
    { value: mediaCount ? String(mediaCount).padStart(2, "0") : "—", label: "Mídias documentadas" },
    { value: String(project.categories.length).padStart(2, "0"), label: "Disciplinas envolvidas" },
    { value: project.year, label: "Ano de publicação" },
    { value: clientMatch ? "01" : "—", label: clientMatch ? "Cliente identificado" : "Cliente não informado" },
  ];
  return <main className="case-study-page">
    <header className="case-study-header">
      <button className="case-study-back" onClick={() => window.history.back()}><ArrowLeft size={15} /> Voltar</button>
      <span className="eyebrow">Estudo de caso · {project.year}</span>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <a href={project.sourceUrl} target="_blank" rel="noreferrer">Ver projeto original <ExternalLink size={15} /></a>
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
        <blockquote>“{clientMatch ? `Depoimento de ${clientMatch} aguardando publicação autorizada.` : "Nenhum depoimento foi publicado para este projeto ainda."}”</blockquote>
        <p className="case-study-note">A área está preparada para receber uma fala real do cliente, sempre mediante revisão e autorização de publicação.</p>
      </section>
    </section>
    <footer className="case-study-footer"><Link href="/#trabalhos">Todos os trabalhos</Link><Link href="/#contato">Solicitar orçamento</Link></footer>
  </main>;
}
