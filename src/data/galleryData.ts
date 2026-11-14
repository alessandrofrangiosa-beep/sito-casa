export type GalleryItem = {
  id: number;
  src: string;
  title: string;
  caption: string;
  alt: string;
  /** Badge verde di vantaggio economico/rassicurazione */
  badge?: string;
  /** Render 3D della stessa stanza: tenendo premuto sulla foto reale si vede l'ipotesi di arredo */
  render?: string;
};

/** Visita guidata: 15 foto reali in /public/images/attuali, in ordine di percorso. */
export const galleryData: GalleryItem[] = [
  {
    id: 1,
    src: "/images/attuali/01-vista-mare-golfo.jpg",
    title: "Vista mare aperta",
    caption: "Vista aperta sul Golfo dal 6° piano: luce naturale tutto il giorno.",
    alt: "Panorama dal 6° piano sul Golfo di Napoli con la penisola sorrentina all'orizzonte",
  },
  {
    id: 2,
    src: "/images/attuali/02-ingresso.jpg",
    render: "/images/render/render-01-ingresso.jpg",
    title: "Ingresso",
    caption: "Ingresso ampio già tinteggiato di bianco con doppie porte a vetri.",
    alt: "Ingresso con pareti bianche, pavimento in graniglia chiara e porte in legno con vetri",
  },
  {
    id: 3,
    src: "/images/attuali/03-soggiorno.jpg",
    render: "/images/render/render-02-soggiorno-pavimento-nero.jpg",
    title: "Soggiorno / Sala",
    caption: "Salone luminoso con graniglia nera lucida e infissi nuovi in PVC.",
    alt: "Salone con pavimento in graniglia nera lucida e doppie porte in legno con vetri",
  },
  {
    id: 4,
    src: "/images/attuali/04-cucina.jpg",
    render: "/images/render/render-14-cucina.jpg",
    title: "Cucina abitabile",
    caption: "Cucina abitabile con finestra, portafinestra su terrazza e pavimento chiaro.",
    alt: "Cucina abitabile piastrellata con pavimento chiaro e portafinestra sulla terrazza",
  },
  {
    id: 5,
    src: "/images/attuali/05-terrazza-principale.jpg",
    render: "/images/render/render-04-terrazza-principale.jpg",
    title: "Terrazza",
    caption: "Terrazza lunga tra cucina e stanza. Ponteggio lavori facciata già pagato.",
    alt: "Terrazza lunga con ringhiera e ponteggio dei lavori di facciata in ultimazione",
    badge: "Lavori già pagati",
  },
  {
    id: 6,
    src: "/images/attuali/06-seconda-terrazza.jpg",
    render: "/images/render/render-05-seconda-terrazza.jpg",
    title: "Balcone",
    caption: "Balcone riservato e luminoso con infisso scorrevole bianco.",
    alt: "Balcone soleggiato con infisso scorrevole bianco e vista sui monti",
  },
  {
    id: 7,
    src: "/images/attuali/07-vista-mare-interno.jpg",
    render: "/images/render/render-03-angolo-relax-vista-mare.jpg",
    title: "Vista mare dall'interno",
    caption: "Panorama sul mare direttamente dalle portefinestre con vetrocamera.",
    alt: "Vista sul mare e sulla cupola della città attraverso le portefinestre aperte",
  },
  {
    id: 8,
    src: "/images/attuali/08-corridoio-zona-notte.jpg",
    render: "/images/render/render-06-corridoio.jpg",
    title: "Corridoio zona notte",
    caption: "Corridoio luminoso già tinteggiato che disimpegna la zona notte.",
    alt: "Corridoio bianco della zona notte con arco in fondo e porte in legno",
  },
  {
    id: 9,
    src: "/images/attuali/09-camera-matrimoniale.jpg",
    // Stessa stanza e stessa inquadratura (graniglia chiara, termosifone a sinistra)
    render: "/images/render/render-08-camera-matrimoniale-graniglia-chiara.jpg",
    title: "Camera matrimoniale",
    caption: "Camera matrimoniale ampia e luminosa con termosifone: da rinfrescare con i tuoi colori.",
    alt: "Ampia camera matrimoniale vuota con termosifone e portafinestra",
  },
  {
    id: 10,
    src: "/images/attuali/10-stanza-accessoria-1.jpg",
    render: "/images/render/render-19-cameretta-balcone.jpg",
    title: "Stanza con balcone",
    caption: "Stanza luminosa con balcone, termosifone e armadio a muro bianco.",
    alt: "Stanza con portafinestra sul balcone, termosifone e armadio a muro bianco",
  },
  {
    id: 11,
    src: "/images/attuali/11-stanza-accessoria-2.jpg",
    render: "/images/render/render-20-camera-soleggiata.jpg",
    title: "Stanza soleggiata",
    caption: "Stanza soleggiata con infissi recenti: ideale come studio, cameretta o stanza ospiti.",
    alt: "Stanza soleggiata con portafinestra, termosifone e pavimento alla veneziana",
  },
  {
    id: 12,
    src: "/images/attuali/12-affaccio-camera-vista-mare.jpg",
    title: "Affaccio vista mare",
    caption: "Vista mare anche dalla zona notte con infissi bianchi già sostituiti.",
    alt: "Portafinestra bianca con affaccio sul mare e sulla costiera",
  },
  {
    id: 13,
    src: "/images/attuali/13-bagno-principale.jpg",
    render: "/images/render/render-18-bagno-principale.jpg",
    title: "Bagno principale interno",
    caption: "Bagno interno finestrato con vasca e sanitari completi già pronti.",
    alt: "Bagno principale finestrato con vasca, lavabo, wc e bidet",
  },
  {
    id: 14,
    src: "/images/attuali/14-bagno-esterno-lavanderia.jpg",
    render: "/images/render/render-12-bagno-esterno.jpg",
    title: "Bagno esterno / Lavanderia",
    caption: "Secondo bagno su terrazza con WC, lavatoio e caldaia già installati.",
    alt: "Secondo bagno sulla terrazza con wc, pilozzo lavatoio e finestra",
  },
  {
    id: 15,
    src: "/images/attuali/15-garage.jpg",
    render: "/images/render/render-13-garage.jpg",
    title: "Garage privato",
    caption: "Box auto privato sotto casa, con porta in ferro e chiusura a chiave.",
    alt: "Box auto privato chiuso con auto parcheggiata",
  },
];

/** Render 3D ipotetici in /public/images/render, ordinati per stanza lungo lo stesso percorso. */
export const renderData: GalleryItem[] = [
  { id: 1, src: "/images/render/render-01-ingresso.jpg", title: "Ingresso", caption: "Ingresso caldo e accogliente con consolle, specchio e luce soffusa.", alt: "Render dell'ingresso arredato" },
  { id: 2, src: "/images/render/render-02-soggiorno-pavimento-nero.jpg", title: "Soggiorno", caption: "Living caldo con divano, libreria e toni naturali sulla graniglia nera originale.", alt: "Render del soggiorno arredato" },
  { id: 3, src: "/images/render/render-03-angolo-relax-vista-mare.jpg", title: "Angolo relax vista mare", caption: "Lettura e relax davanti alla portafinestra affacciata sul Golfo.", alt: "Render di un angolo relax davanti alla vista mare" },
  { id: 4, src: "/images/render/render-04-terrazza-principale.jpg", title: "Terrazza", caption: "Terrazza lunga vissuta come un salotto all'aperto, a lavori ultimati.", alt: "Render della terrazza arredata" },
  { id: 5, src: "/images/render/render-05-seconda-terrazza.jpg", title: "Balcone", caption: "Angolo verde con fioriere e sedute per la colazione al sole.", alt: "Render del balcone con piante" },
  { id: 6, src: "/images/render/render-06-corridoio.jpg", title: "Corridoio", caption: "Corridoio zona notte valorizzato da quadri, piante e luce calda.", alt: "Render del corridoio arredato" },
  { id: 7, src: "/images/render/render-07-nicchia-armadio.jpg", title: "Nicchia ad arco", caption: "L'arco del disimpegno diventa un guardaroba su misura in legno.", alt: "Render della nicchia ad arco con armadio in legno" },
  { id: 8, src: "/images/render/render-08-camera-matrimoniale-graniglia-chiara.jpg", title: "Camera matrimoniale", caption: "Camera in stile naturale, con tende in lino e tessili morbidi.", alt: "Render della camera matrimoniale arredata" },
  { id: 9, src: "/images/render/render-09-studio-vista-mare.jpg", title: "Studio vista mare", caption: "Stanza versatile trasformata in studio-lettura con vista mare.", alt: "Render di uno studio con vista mare" },
  { id: 10, src: "/images/render/render-10-camera-finestra.jpg", title: "Stanza con affaccio", caption: "Seduta sotto la finestra per godersi luce e panorama.", alt: "Render di una stanza con affaccio sulla città" },
  { id: 11, src: "/images/render/render-18-bagno-principale.jpg", title: "Bagno principale", caption: "Bagno principale rinnovato: vasca, sanitari sospesi, mobile in legno e specchio retroilluminato.", alt: "Render del bagno principale rinnovato" },
  { id: 12, src: "/images/render/render-12-bagno-esterno.jpg", title: "Bagno esterno", caption: "Secondo bagno moderno con sanitari sospesi e mobile in rovere.", alt: "Render del bagno esterno rinnovato" },
  { id: 13, src: "/images/render/render-13-garage.jpg", title: "Garage", caption: "Box auto tinteggiato e illuminato: pulito e ordinato.", alt: "Render del garage tinteggiato" },
  { id: 14, src: "/images/render/render-14-cucina.jpg", title: "Cucina", caption: "Cucina lineare in legno chiaro con tavolo da pranzo e portafinestra sulla terrazza.", alt: "Render della cucina arredata" },
  { id: 15, src: "/images/render/render-19-cameretta-balcone.jpg", title: "Cameretta", caption: "Stanza con balcone trasformata in cameretta con scrivania, armadio a tutta altezza e letto singolo.", alt: "Render della stanza con balcone arredata come cameretta" },
  { id: 16, src: "/images/render/render-20-camera-soleggiata.jpg", title: "Camera da letto", caption: "Stanza soleggiata arredata come camera matrimoniale, con boiserie e tessili caldi.", alt: "Render della stanza soleggiata arredata come camera da letto" },
];

export type AiBaseRoom = { id: string; label: string; src: string };

/**
 * Stanze disponibili in "Arredala tu": foto reali in /public/images/attuali.
 * Gli id devono coincidere con la whitelist ROOM_FILES in src/app/api/render/route.ts.
 */
export const aiBaseRooms: AiBaseRoom[] = [
  { id: "soggiorno", label: "Soggiorno", src: "/images/attuali/03-soggiorno.jpg" },
  { id: "cucina", label: "Cucina", src: "/images/attuali/04-cucina.jpg" },
  { id: "camera", label: "Camera", src: "/images/attuali/09-camera-matrimoniale.jpg" },
  { id: "stanza-balcone", label: "Stanza con balcone", src: "/images/attuali/10-stanza-accessoria-1.jpg" },
  { id: "stanza-soleggiata", label: "Stanza soleggiata", src: "/images/attuali/11-stanza-accessoria-2.jpg" },
];

export type AiStyle = { id: string; label: string; prompt: string };

/** Stili rapidi: riempiono la descrizione (max 180 caratteri), che il visitatore può poi modificare. */
export const aiStyles: AiStyle[] = [
  { id: "cameretta", label: "Cameretta per bambini", prompt: "Cameretta per bambini: lettino, scrivania e libreria bassa, tappeto morbido, giochi colorati, pareti azzurro chiaro e luce calda" },
  { id: "mediterraneo", label: "Mediterraneo Vista Mare", prompt: "Stile mediterraneo: pareti bianco caldo, accenti terracotta e sabbia, lino, rattan e piante d'ulivo" },
  { id: "minimal", label: "Minimal Contemporaneo", prompt: "Stile minimal contemporaneo: toni neutri, pochi pezzi di design, finiture opache e atmosfera calma" },
  { id: "caldo", label: "Caldo Accogliente", prompt: "Stile caldo e accogliente: toni beige e caramello, legno di noce, tessuti morbidi, tappeti e luci calde" },
];
