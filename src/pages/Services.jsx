import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { services as defaults } from '../data/services';
import ServiceCard from '../components/ServiceCard';
import PageIntro from '../components/PageIntro';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
export default function Services(){
  const nav=useNavigate(); const [items,setItems]=useState(defaults);
  useEffect(()=>{ if(!isSupabaseConfigured)return; let active=true; supabase.from('barber_services').select('id,name,description,duration_minutes,price').eq('active',true).order('sort_order').then(({data})=>{if(active&&data?.length)setItems(data.map(s=>({...s,duration:s.duration_minutes})));}); return()=>{active=false}; },[]);
  const choose=id=>{sessionStorage.setItem('barberia-service',id);nav('/booking')};
  return <><PageIntro eyebrow="01 / MENU & PRICES" title="ПОСЛУГИ ТА" accent="ВАРТІСТЬ." description="Чітка форма, уважність до деталей та сервіс, на який можна розраховувати. Обери те, що потрібно саме тобі."/><section className="section pageSection"><div className="cards">{items.map((item,i)=><ServiceCard key={item.id} item={{...item,number:`0${i+1}`}} onChoose={choose}/>)}</div></section></>;
}
