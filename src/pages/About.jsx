import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Instagram, ArrowUpRight, ExternalLink, Scissors, UserRound, Sparkles, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import PageIntro from '../components/PageIntro';

const portfolio = [
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-1.jpeg`, alt: 'Corte masculino con textura en la parte superior y degradado suave' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-2.jpeg`, alt: 'Corte masculino limpio, vista trasera' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-3.jpeg`, alt: 'Peinado masculino con volumen y acabado' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-4.jpeg`, alt: 'Corte masculino con degradado fade suave' },
];

export default function About() {
  const [extraWorks, setExtraWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeWork, setActiveWork] = useState(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const allWorks = [...portfolio, ...extraWorks];
  const showWork = (direction) => setActiveWork((current) => (current + direction + allWorks.length) % allWorks.length);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    Promise.all([
      supabase.from('barber_portfolio').select('id,title,image_url').eq('published', true).order('created_at', { ascending: false }),
      supabase.from('barber_reviews').select('id,client_name,rating,message,created_at').eq('status', 'published').order('created_at', { ascending: false })
    ]).then(([worksResult, reviewsResult]) => {
      if (!active) return;
      if (worksResult.data) setExtraWorks(worksResult.data.map((work) => ({ src: work.image_url, alt: work.title, title: work.title })));
      if (reviewsResult.data) setReviews(reviewsResult.data.map((review) => ({ id: review.id, name: review.client_name, rating: review.rating, text: review.message, date: new Date(review.created_at).toLocaleDateString('uk-UA') })));
    });
    return () => { active = false; };
  }, []);

  async function submitReview(event) {
    event.preventDefault();
    if (reviewText.trim().length < 8) { setReviewMessage('Por favor, escribe una opinión un poco más detallada.'); return; }
    if (!isSupabaseConfigured) { setReviewMessage('Las opiniones online aún no están disponibles. Inténtalo más tarde.'); return; }
    const { error } = await supabase.from('barber_reviews').insert({ client_name: reviewName.trim() || 'Cliente', rating: reviewRating, message: reviewText.trim(), status: 'pending' });
    if (error) { setReviewMessage('No se pudo enviar la opinión. Inténtalo de nuevo.'); return; }
    setReviewName(''); setReviewText(''); setReviewRating(5);
    setReviewMessage('¡Gracias! Tu opinión se ha enviado al barbero para su revisión.');
  }
  return <>
    <PageIntro
      eyebrow="02 / THE BARBER"
      title="EXPERIENCIA"
      accent="CON UN TRATO PERSONALIZADO."
      description="Conoce al barbero de Barbershop Yaro: para él, cada corte comienza con una conversación y atención a cada cliente."
    />

    <section className="aboutPage section">
      <div className="aboutPagePhoto aboutPortrait">
        <img src={`${import.meta.env.BASE_URL}images/yaro-master.jpg`} alt="Retrato del barbero de Barbershop Yaro" />
        <span>YAROSLAV / BARBER</span>
      </div>
      <div className="aboutStory">
        <p className="eyebrow">PERSONAL APPROACH · BARBERSHOP YARO</p>
        <h2>CADA CLIENTE ES<br /><em>UNA HISTORIA ÚNICA.</em></h2>
        <p>Para mí no se trata solo de cortar el pelo, sino de comprender a la persona, su estilo, sus hábitos y sus preferencias. Por eso cada visita comienza con una conversación: hablamos del estilo, la forma, el largo y de esos detalles que son importantes para ti.</p>
        <p>Pongo pasión en cada trabajo y tengo en cuenta las características de cada cliente. Juntos elegimos un corte que te favorezca, refleje tu personalidad y sea fácil de mantener en el día a día.</p>
        <p>Mi objetivo es que salgas del sillón no solo con un nuevo corte, sino también con confianza y satisfacción con tu imagen.</p>
        <div className="aboutValues">
          <div><UserRound size={19}/><span><b>ATENCIÓN A TI</b><small>Primero escucho lo que deseas</small></span></div>
          <div><Scissors size={19}/><span><b>ESTILO PERSONAL</b><small>Encontramos el corte ideal para ti</small></span></div>
          <div><Sparkles size={19}/><span><b>CUIDADO DE LOS DETALLES</b><small>Precisión en cada paso</small></span></div>
        </div>
        <a className="btn outlineBtn" href="https://booksy.com/es-es/189002_barbershop-yaro_barberia_29270_mijas?do=invite#ba_s=dl_1" target="_blank" rel="noreferrer"><ExternalLink size={15}/> PORTFOLIO EN BOOKSY <ArrowUpRight size={15}/></a>
        <a className="underLink" href="https://www.instagram.com/barber_yaro/" target="_blank" rel="noreferrer"><Instagram size={14}/> INSTAGRAM ↗</a>
      </div>
    </section>

    <section className="portfolioNotice">
      <p className="eyebrow">SELECTED WORKS / BARBERSHOP YARO</p>
      <h2>TRABAJOS <em>DEL BARBERO.</em></h2>
      <p>Cada trabajo combina técnica, precisión y una visión personal del estilo. Selecciona una foto para ver los detalles.</p>
      <div className="workGallery">
        {allWorks.map((work, index) => <div className="workTileWrap" key={`${work.src}-${index}`}>
          <button className="workTile" onClick={() => setActiveWork(index)} aria-label={`Ampliar foto del trabajo ${index + 1}`}>
            <img src={work.src} alt={work.alt} loading="lazy" />
            <span>0{index + 1} <ArrowUpRight size={16}/></span>
          </button>
        </div>)}
      </div>
      <p className="reviewStorageNote">El barbero publica nuevos trabajos desde el panel de administración seguro de YARO.</p>
      <a className="underLink" href="https://www.instagram.com/barber_yaro/" target="_blank" rel="noreferrer">MÁS TRABAJOS EN INSTAGRAM ↗</a>
    </section>
    {activeWork !== null && <div className="workLightbox" role="dialog" aria-modal="true" aria-label="Ver trabajo del barbero" onClick={() => setActiveWork(null)}>
      <button className="lightboxClose" onClick={() => setActiveWork(null)} aria-label="Cerrar"><X/></button>
      <button className="lightboxArrow prev" onClick={(event) => { event.stopPropagation(); showWork(-1); }} aria-label="Foto anterior"><ChevronLeft/></button>
      <img src={allWorks[activeWork].src} alt={allWorks[activeWork].alt} onClick={(event) => event.stopPropagation()} />
      <button className="lightboxArrow next" onClick={(event) => { event.stopPropagation(); showWork(1); }} aria-label="Foto siguiente"><ChevronRight/></button>
      <span className="lightboxCount">0{activeWork + 1} / 0{allWorks.length}</span>
    </div>}
    <section className="quote"><p className="eyebrow">THE BARBER PHILOSOPHY</p><blockquote>«TU ESTILO ES MI<br/><em>INSPIRACIÓN.</em>»</blockquote></section>
    <section className="reviewsSection">
      <div className="reviewsHeading"><p className="eyebrow">CLIENT EXPERIENCE</p><h2>OPINIONES <em>DE CLIENTES.</em></h2><p>Tus comentarios nos ayudan a mejorar. Comparte tu experiencia en BARBERIA.</p></div>
      <div className="reviewsLayout">
        <form className="reviewForm" onSubmit={submitReview}>
          <h3>DEJAR UNA OPINIÓN</h3>
          <label>Tu nombre<input className="field" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="¿Cómo te llamas?"/></label>
          <label>Valoración</label>
          <div className="ratingPicker" role="radiogroup" aria-label="Valoración">
            {[1,2,3,4,5].map((value) => <button type="button" key={value} className={value <= reviewRating ? 'selected' : ''} onClick={() => setReviewRating(value)} aria-label={`${value} de 5`}><Star size={21} fill="currentColor"/></button>)}
          </div>
          <label>Tu opinión<textarea className="field reviewTextarea" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Cuéntanos tu experiencia..." required minLength={8}/></label>
          <button className="btn goldBtn" type="submit">ENVIAR OPINIÓN <ArrowUpRight size={15}/></button>
          {reviewMessage && <p className="formFeedback">{reviewMessage}</p>}
        </form>
        <div className="reviewsList">
          <h3>OPINIONES DE CLIENTES <span>{reviews.length}</span></h3>
          {reviews.length === 0 ? <p className="emptyReviews">Todavía no hay opiniones. Sé el primero en compartir tu experiencia.</p> : reviews.map((review) => <article className="reviewCard" key={review.id}>
            <div className="reviewTop"><strong>{review.name}</strong><time>{review.date}</time></div>
            <div className="reviewStars" aria-label={`${review.rating} de 5`}>{Array.from({length: review.rating}, (_, i) => <Star key={i} size={13} fill="currentColor"/>)}</div>
            <p>{review.text}</p>
          </article>)}
        </div>
      </div>
      <p className="reviewStorageNote">Las opiniones se publican después de que el barbero las revise. Así garantizamos su calidad y autenticidad.</p>
    </section>
  </>;
}
