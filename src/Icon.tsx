const shapes:Record<string,string>={
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  folder:'M3 7V5h6l2 2h10v13H3z',
  land:'M3 7l6-3 6 3 6-3v14l-6 3-6-3-6 3z M9 4v14 M15 7v14',
  cube:'M12 3l9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9',
  chart:'M4 20V4 M4 20h17 M8 16v-5 M13 16V7 M18 16v-8',
  compare:'M4 5h6v14H4z M14 5h6v14h-6z',
  file:'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',
  library:'M4 4h4v16H4z M10 4h4v16h-4z M17 4l4 15-4 1-4-15',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  plus:'M12 5v14 M5 12h14',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  arrow:'M5 12h14 M13 6l6 6-6 6',logout:'M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4',
  lock:'M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3',check:'M5 12l4 4L19 6',
  menu:'M4 6h16 M4 12h16 M4 18h16',close:'M6 6l12 12 M18 6 6 18',
  pin:'M12 22s8-8 8-13a8 8 0 0 0-16 0c0 5 8 13 8 13 M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
};
export function Icon({name,size=20}:{name:string;size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={shapes[name]||shapes.folder}/></svg>;}
