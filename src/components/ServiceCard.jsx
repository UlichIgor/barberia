import { Clock3, ArrowUpRight } from 'lucide-react';
export default function ServiceCard({ item, onChoose }) {
return <article className="serviceCard"><span className="number">{item.number}</span><h3>{item.name}</h3><p>{item.description}</p><div className="serviceMeta"><span><Clock3 size={14}/> {item.duration} min</span><strong>{item.price} <small>€</small></strong></div>{onChoose&&<button className="cardLink" onClick={()=>onChoose(item.id)}>ELEGIR SERVICIO <ArrowUpRight size={14}/></button>}</article>;
}