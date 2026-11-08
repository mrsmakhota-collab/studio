/* Прості лінійні іконки 24x24. icon("bed") -> <svg>. Нову іконку додавайте в ICONS і в ICON_NAMES. */
const ICONS={
  tooth:'<path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .4 2 .8 6.5 2.5 6.5s1.6-4 2.5-5.5c.5-.8 1.5-.8 2 0 .9 1.5.8 5.5 2.5 5.5s2.1-4.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>',
  bed:'<path d="M3 18V6"/><path d="M3 13h18v5"/><path d="M21 13v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="10" r="2"/>',
  shirt:'<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
  backpack:'<path d="M6 9a6 6 0 0 1 12 0v11H6z"/><path d="M9 3.5h6"/><path d="M9 14h6v3H9z"/>',
  book:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  shower:'<path d="M4 20V8a4 4 0 0 1 8 0"/><path d="M9 8h6"/><path d="M10 12v1M13 12v1M16 12v1M11 16v1M14 16v1M17 16v1"/>',
  plate:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  broom:'<path d="M14 4 9 13"/><path d="M5 13h8l1 7H4z"/><path d="M7 16v4M10 16v4"/>',
  phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/><path d="M4 4l16 16"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  school:'<path d="M3 10 12 5l9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
  pencil:'<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13 7l4 4"/>',
  water:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  check:'<path d="M5 12.5 10 17 19 7"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sound:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  piggy:'<path d="M4 12a7 6 0 0 1 13-3h2l-1 3 2 1v3h-2l-1 2v3h-3v-2h-4v2H6v-3a6 6 0 0 1-2-6z"/><path d="M10 7.5h3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  up:'<path d="m6 15 6-6 6 6"/>',
  down:'<path d="m6 9 6 6 6-6"/>'
};
const ICON_NAMES={tooth:"Зуби",bed:"Ліжко",shirt:"Одяг",backpack:"Рюкзак",book:"Книжка",shower:"Душ",plate:"Їжа",broom:"Прибирання",phone:"Без телефона",music:"Музика",star:"Зірка",sun:"Ранок",moon:"Вечір",school:"Школа",pencil:"Домашка",bulb:"Ідея",water:"Вода"};
const icon=(k,size=24)=>`<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]||ICONS.star}</svg>`;
