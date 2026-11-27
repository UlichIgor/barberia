import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Instagram, ArrowUpRight, ExternalLink, Scissors, UserRound, Sparkles, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import PageIntro from '../components/PageIntro';

const portfolio = [
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-1.jpeg`, alt: 'Чоловіча стрижка з текстурованим верхом і плавним переходом' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-2.jpeg`, alt: 'Акуратна чоловіча стрижка, вигляд ззаду' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-3.jpeg`, alt: 'Об’ємна чоловіча зачіска з укладанням' },
  { src: `${import.meta.env.BASE_URL}images/portfolio/work-4.jpeg`, alt: 'Чоловіча стрижка з плавним fade-переходом' },
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
    if (reviewText.trim().length < 8) { setReviewMessage('Напиши, будь ласка, трохи детальніший відгук.'); return; }
    if (!isSupabaseConfigured) { setReviewMessage('Онлайн-відгуки ще не підключені. Спробуй пізніше.'); return; }
    const { error } = await supabase.from('barber_reviews').insert({ client_name: reviewName.trim() || 'Клієнт', rating: reviewRating, message: reviewText.trim(), status: 'pending' });
    if (error) { setReviewMessage('Не вдалося надіслати відгук. Спробуй ще раз.'); return; }
    setReviewName(''); setReviewText(''); setReviewRating(5);
    setReviewMessage('Дякуємо! Відгук надіслано майстру на модерацію.');
  }
  return <>
    <PageIntro
      eyebrow="02 / THE BARBER"
      title="МАЙСТЕРСТВО"
      accent="З ІНДИВІДУАЛЬНИМ ПІДХОДОМ."
      description="Знайомство з майстром Barbershop Yaro — людиною, для якої кожна стрижка починається з діалогу та уваги до клієнта."
    />

    <section className="aboutPage section">
      <div className="aboutPagePhoto aboutPortrait">
        <img src={`${import.meta.env.BASE_URL}images/yaro-master.jpg`} alt="Портрет майстра Barbershop Yaro" />
        <span>YAROSLAV / BARBER</span>
      </div>
      <div className="aboutStory">
        <p className="eyebrow">PERSONAL APPROACH · BARBERSHOP YARO</p>
        <h2>КОЖЕН КЛІЄНТ —<br /><em>ОКРЕМА ІСТОРІЯ.</em></h2>
        <p>Для мене важливо не просто зробити стрижку, а зрозуміти людину, її стиль, звички та побажання. Саме тому кожне знайомство починається з розмови: обговорюємо бажаний образ, форму, довжину й деталі, які мають значення саме для вас.</p>
        <p>Я натхненно підходжу до кожної роботи та приділяю увагу індивідуальним особливостям клієнта. Разом підбираємо стрижку, яка гармонійно пасує, підкреслює характер і залишається зручною у щоденному догляді.</p>
        <p>Моя мета — щоб ви вийшли з крісла не просто з новою стрижкою, а з відчуттям впевненості та задоволення від свого образу.</p>
        <div className="aboutValues">
          <div><UserRound size={19}/><span><b>Увага до вас</b><small>Спершу слухаю ваші побажання</small></span></div>
          <div><Scissors size={19}/><span><b>Індивідуальний стиль</b><small>Підбираємо форму саме для вас</small></span></div>
          <div><Sparkles size={19}/><span><b>Турбота про деталі</b><small>Акуратність на кожному етапі</small></span></div>
        </div>
        <a className="btn outlineBtn" href="https://booksy.com/es-es/189002_barbershop-yaro_barberia_29270_mijas?do=invite#ba_s=dl_1" target="_blank" rel="noreferrer"><ExternalLink size={15}/> ПОРТФОЛІО BOOKSY <ArrowUpRight size={15}/></a>
        <a className="underLink" href="https://www.instagram.com/barber_yaro/" target="_blank" rel="noreferrer"><Instagram size={14}/> INSTAGRAM ↗</a>
      </div>
    </section>

    <section className="portfolioNotice">
      <p className="eyebrow">SELECTED WORKS / BARBERSHOP YARO</p>
      <h2>РОБОТИ <em>МАЙСТРА.</em></h2>
      <p>Кожна робота — поєднання техніки, точності та індивідуального бачення стилю. Оберіть фото, щоб розглянути деталі.</p>
      <div className="workGallery">
        {allWorks.map((work, index) => <div className="workTileWrap" key={`${work.src}-${index}`}>
          <button className="workTile" onClick={() => setActiveWork(index)} aria-label={`Збільшити фото роботи ${index + 1}`}>
            <img src={work.src} alt={work.alt} loading="lazy" />
            <span>0{index + 1} <ArrowUpRight size={16}/></span>
          </button>
        </div>)}
      </div>
      <p className="reviewStorageNote">Нові роботи публікуються майстром через захищену адміністративну панель YARO.</p>
      <a className="underLink" href="https://www.instagram.com/barber_yaro/" target="_blank" rel="noreferrer">БІЛЬШЕ РОБІТ В INSTAGRAM ↗</a>
    </section>
    {activeWork !== null && <div className="workLightbox" role="dialog" aria-modal="true" aria-label="Перегляд роботи майстра" onClick={() => setActiveWork(null)}>
      <button className="lightboxClose" onClick={() => setActiveWork(null)} aria-label="Закрити"><X/></button>
      <button className="lightboxArrow prev" onClick={(event) => { event.stopPropagation(); showWork(-1); }} aria-label="Попереднє фото"><ChevronLeft/></button>
      <img src={allWorks[activeWork].src} alt={allWorks[activeWork].alt} onClick={(event) => event.stopPropagation()} />
      <button className="lightboxArrow next" onClick={(event) => { event.stopPropagation(); showWork(1); }} aria-label="Наступне фото"><ChevronRight/></button>
      <span className="lightboxCount">0{activeWork + 1} / 0{allWorks.length}</span>
    </div>}
    <section className="quote"><p className="eyebrow">THE BARBER PHILOSOPHY</p><blockquote>«ВАШ СТИЛЬ — МОЄ<br/><em>НАТХНЕННЯ.</em>»</blockquote></section>
    <section className="reviewsSection">
      <div className="reviewsHeading"><p className="eyebrow">CLIENT EXPERIENCE</p><h2>ВІДГУКИ <em>КЛІЄНТІВ.</em></h2><p>Ваші враження допомагають ставати кращими. Поділіться досвідом відвідування BARBERIA.</p></div>
      <div className="reviewsLayout">
        <form className="reviewForm" onSubmit={submitReview}>
          <h3>ЗАЛИШИТИ ВІДГУК</h3>
          <label>Ваше ім’я<input className="field" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Як до вас звертатися?"/></label>
          <label>Оцінка</label>
          <div className="ratingPicker" role="radiogroup" aria-label="Оцінка">
            {[1,2,3,4,5].map((value) => <button type="button" key={value} className={value <= reviewRating ? 'selected' : ''} onClick={() => setReviewRating(value)} aria-label={`${value} з 5`}><Star size={21} fill="currentColor"/></button>)}
          </div>
          <label>Ваш відгук<textarea className="field reviewTextarea" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Розкажіть про свій досвід..." required minLength={8}/></label>
          <button className="btn goldBtn" type="submit">НАДІСЛАТИ ВІДГУК <ArrowUpRight size={15}/></button>
          {reviewMessage && <p className="formFeedback">{reviewMessage}</p>}
        </form>
        <div className="reviewsList">
          <h3>ЩО КАЖУТЬ КЛІЄНТИ <span>{reviews.length}</span></h3>
          {reviews.length === 0 ? <p className="emptyReviews">Відгуків поки немає. Будьте першим, хто поділиться враженнями.</p> : reviews.map((review) => <article className="reviewCard" key={review.id}>
            <div className="reviewTop"><strong>{review.name}</strong><time>{review.date}</time></div>
            <div className="reviewStars" aria-label={`${review.rating} з 5`}>{Array.from({length: review.rating}, (_, i) => <Star key={i} size={13} fill="currentColor"/>)}</div>
            <p>{review.text}</p>
          </article>)}
        </div>
      </div>
      <p className="reviewStorageNote">Відгуки публікуються після перевірки майстром. Це допомагає зберігати якість і достовірність відгуків.</p>
    </section>
  </>;
}
