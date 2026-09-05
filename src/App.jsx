import { useState } from "react";
import {
  Play,
  Menu,
  X,
  Instagram,
  Music2,
  Youtube,
  Twitch,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
   bg-base:    #121014  (grafito cálido, no negro puro)
   bg-surface: #1B1719
   accent-sunset: #FF6A39  -> #FFB347 (gradiente atardecer TJ)
   accent-dusk:   #33C7E8  (neón San Diego / madrugada)
   text:       #F5F0EA
   text-muted: #A79C93
   border:     #2E2729
   display font: 'Bebas Neue'
   body font:    'Manrope'
--------------------------------------------------------- */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap');
`;

const COLORS = {
  bg: "#121014",
  surface: "#1B1719",
  sunset: "#FF6A39",
  sunset2: "#FFB347",
  dusk: "#33C7E8",
  text: "#F5F0EA",
  muted: "#A79C93",
  border: "#2E2729",
};

const display = { fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.01em" };
const body = { fontFamily: "'Manrope', sans-serif" };

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

const VALORES = [
  { title: "Comunidad fronteriza", text: "Cada programa se hace pensando en la gente de aquí, para la gente de aquí. Tijuana no es un mercado secundario, es el centro." },
  { title: "Autenticidad", text: "No moldeamos al talento a un formato genérico. Producimos alrededor de la voz que ya tienen." },
  { title: "Calidad de producción", text: "Cámaras, audio e iluminación de nivel profesional, sin que el creador tenga que invertir ni cargar equipo." },
  { title: "Crecimiento compartido", text: "Ganamos cuando el talento crece. Nuestros planes están diseñados para acompañar, no para exprimir." },
  { title: "Innovación digital", text: "En vivo, pre-grabado, clips verticales, multistream. Un solo programa, muchas puertas." },
];

const PASOS = [
  { n: "1", title: "Aplicas", text: "Nos cuentas de qué trata tu programa y a quién le habla. No necesitas experiencia en producción." },
  { n: "2", title: "Reservas tu horario", text: "Eliges tu espacio entre 7:00 AM y 12:00 PM. Ese horario queda tuyo, semana con semana." },
  { n: "3", title: "Producimos y transmitimos", text: "Llegas al estudio. Salimos en simultáneo a Twitch, YouTube y la página web." },
  { n: "4", title: "Distribuimos (opcional)", text: "Si contratas el paquete de reels, cortamos tu contenido y lo subimos a nuestras redes." },
];

// Horario al aire: 7:00 AM – 12:00 PM
const PROGRAMACION = [
  { dia: "Lun", hora: "7:00 AM", show: "Frontera Deportiva", host: "Con Kike Osuna", live: true },
  { dia: "Mar", hora: "8:30 AM", show: "Zona Gastro TJ", host: "Con Ale Ríos", live: false },
  { dia: "Mié", hora: "9:00 AM", show: "El Cruce", host: "Con Dany Palafox", live: false },
  { dia: "Jue", hora: "10:30 AM", show: "Vibra Local", host: "Con Los Del Callejón", live: false },
  { dia: "Vie", hora: "11:00 AM", show: "Noche... digo, Mañana de Barrio", host: "Con Andrea Solís", live: false },
];

const TALENTO = [
  { name: "Kike Osuna", show: "Frontera Deportiva", handle: "@frontera.deportiva" },
  { name: "Ale Ríos", show: "Zona Gastro TJ", handle: "@zonagastrotj" },
  { name: "Dany Palafox", show: "El Cruce", handle: "@elcrucepodcast" },
  { name: "Andrea Solís", show: "Noche de Barrio", handle: "@nochedebarrio" },
];

const TESTIMONIOS = [
  { quote: "Antes grababa con el celular apoyado en una caja de cereal. Ahora mi programa se ve como de televisión de verdad, y no tuve que comprar nada.", name: "Ale Ríos", show: "Zona Gastro TJ" },
  { quote: "Lo que más me cambió el juego fueron los reels. Llegaba a 300 personas en vivo y ahora esos mismos clips los ve la ciudad entera.", name: "Kike Osuna", show: "Frontera Deportiva" },
];

// Horario: precio accesible, base del servicio
const HORARIOS = [
  {
    name: "Por Show",
    desc: "Prueba tu programa sin compromiso mensual.",
    price: "350",
    unit: "por transmisión",
    features: [
      "Estudio y equipo profesional",
      "Transmisión en vivo o grabación programada",
      "Simulcast en Twitch, YouTube y la web",
      "Soporte técnico durante la transmisión",
    ],
  },
  {
    name: "Horario Fijo Mensual",
    desc: "Tu espacio reservado, semana con semana.",
    price: "1,200",
    unit: "al mes · 4 transmisiones",
    highlight: true,
    features: [
      "Todo lo de Por Show",
      "Mismo horario reservado cada semana",
      "Prioridad de estudio y edición",
      "Sale más barato que pagar por show",
    ],
  },
];

// Add-ons independientes: reels y post-producción por separado
const ADDONS = [
  {
    name: "Paquete de Reels",
    desc: "Editamos tu contenido y lo distribuimos en las redes de Línea Frontera.",
    price: "600",
    unit: "al mes · 4 reels",
    features: [
      "Edición vertical de tus mejores momentos",
      "Publicación en redes de Línea Frontera",
      "Miniaturas y títulos optimizados",
      "También disponible por show: $200",
    ],
  },
  {
    name: "Identidad Visual",
    desc: "Openings, cortinillas y gráficos para que tu programa se vea como marca.",
    price: "900",
    unit: "pago único",
    features: [
      "Opening animado con tu nombre",
      "Cortinillas de transición",
      "Lower third (rótulo con tu nombre/cargo)",
      "Plantilla de miniatura para tus programas",
    ],
  },
];

/* ---------------------------------------------------------
   SMALL COMPONENTS
--------------------------------------------------------- */

function LiveDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: COLORS.sunset, animation: "pulseLive 1.6s ease-out infinite" }} />
      <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: COLORS.sunset }} />
    </span>
  );
}

function SectionLabel({ children }) {
  return <div style={{ ...body, color: COLORS.dusk, fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>{children}</div>;
}

function PriceCard({ item, cta = "Apartar horario" }) {
  return (
    <div
      className="lf-card"
      style={{
        border: `1px solid ${item.highlight ? COLORS.sunset : COLORS.border}`,
        borderRadius: 10,
        padding: "1.8rem",
        background: COLORS.bg,
        position: "relative",
      }}
    >
      {item.highlight && (
        <div style={{ position: "absolute", top: -12, left: 24, background: COLORS.sunset, color: "#16110D", fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.7rem", borderRadius: 4 }}>
          Más elegido
        </div>
      )}
      <div style={{ ...display, fontSize: "1.6rem" }}>{item.name}</div>
      <p style={{ color: COLORS.muted, fontSize: "0.9rem", marginTop: 2 }}>{item.desc}</p>
      <div style={{ marginTop: "1.2rem", display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ ...display, fontSize: "2.4rem" }}>${item.price}</span>
        <span style={{ color: COLORS.muted, fontSize: "0.85rem" }}>MXN {item.unit}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem", display: "grid", gap: "0.7rem" }}>
        {item.features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: "0.9rem", color: COLORS.text }}>
            <Check size={16} color={COLORS.dusk} style={{ flexShrink: 0, marginTop: 2 }} />
            {f}
          </li>
        ))}
      </ul>
      <a href="#contacto" className={item.highlight ? "lf-btn-primary" : "lf-btn-outline"} style={{ display: "block", textAlign: "center", marginTop: "1.8rem", padding: "0.75rem", borderRadius: 6, textDecoration: "none" }}>
        {cta}
      </a>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN
--------------------------------------------------------- */

function LineaFronteraSite() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [talentIdx, setTalentIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [formSent, setFormSent] = useState(false);

  const nextTalent = () => setTalentIdx((i) => (i + 1) % TALENTO.length);
  const prevTalent = () => setTalentIdx((i) => (i - 1 + TALENTO.length) % TALENTO.length);

  const navLinks = [
    { label: "Quiénes somos", href: "#somos" },
    { label: "Cómo funciona", href: "#funciona" },
    { label: "Canal", href: "#canal" },
    { label: "Programación", href: "#programacion" },
    { label: "Planes", href: "#planes" },
    { label: "Contacto", href: "#contacto" },
  ];

  return (
    <div style={{ ...body, background: COLORS.bg, color: COLORS.text, minHeight: "100vh" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes pulseLive { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes heroReveal { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        .lf-hero-anim { animation: heroReveal 0.9s cubic-bezier(.2,.8,.2,1) both; }
        .lf-card { transition: border-color 0.2s ease, transform 0.2s ease; }
        .lf-card:hover { border-color: ${COLORS.dusk}; transform: translateY(-2px); }
        .lf-nav-link { color: ${COLORS.muted}; text-decoration: none; font-weight: 600; font-size: 0.95rem; }
        .lf-nav-link:hover { color: ${COLORS.text}; }
        .lf-btn-primary { background: linear-gradient(90deg, ${COLORS.sunset}, ${COLORS.sunset2}); color: #16110D; font-weight: 800; border: none; cursor: pointer; }
        .lf-btn-outline { background: transparent; color: ${COLORS.text}; border: 1.5px solid ${COLORS.border}; cursor: pointer; }
        .lf-btn-outline:hover { border-color: ${COLORS.dusk}; }
        ::selection { background: ${COLORS.sunset}; color: #16110D; }
        input::placeholder, textarea::placeholder { color: ${COLORS.muted}; }
        @media (max-width: 820px) {
          .lf-desktop-nav { display: none !important; }
          .lf-mobile-toggle { display: block !important; }
          .lf-hero-split { flex-direction: column !important; }
          .lf-grid-4 { grid-template-columns: 1fr !important; }
          .lf-grid-3 { grid-template-columns: 1fr !important; }
          .lf-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(18,16,20,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...display, fontSize: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>LÍNEA</span>
            <span style={{ width: 3, height: 22, background: `linear-gradient(180deg, ${COLORS.sunset}, ${COLORS.dusk})`, display: "inline-block" }} />
            <span>FRONTERA</span>
          </div>

          <nav className="lf-desktop-nav" style={{ display: "flex", gap: "1.6rem", alignItems: "center" }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="lf-nav-link">{l.label}</a>
            ))}
          </nav>

          <div className="lf-desktop-nav" style={{ display: "flex", gap: "0.7rem" }}>
            <a href="#contacto" className="lf-btn-primary" style={{ padding: "0.55rem 1.2rem", borderRadius: 4, fontSize: "0.9rem", textDecoration: "none" }}>
              Únete como creador
            </a>
          </div>

          <button onClick={() => setMenuOpen((v) => !v)} className="lf-mobile-toggle" style={{ background: "none", border: "none", color: COLORS.text, cursor: "pointer", display: "none" }}>
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {menuOpen && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="lf-nav-link" onClick={() => setMenuOpen(false)}>{l.label}</a>
            ))}
            <a href="#contacto" className="lf-btn-primary" style={{ padding: "0.7rem", borderRadius: 4, textAlign: "center", textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
              Únete como creador
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="lf-hero-split" style={{ display: "flex", minHeight: "78vh", position: "relative" }}>
          <div style={{ flex: 1, background: `radial-gradient(circle at 30% 30%, rgba(255,106,57,0.16), transparent 60%)`, display: "flex", alignItems: "center", padding: "3rem 2rem" }}>
            <div className="lf-hero-anim" style={{ maxWidth: 520, marginLeft: "auto", paddingRight: "1.5rem" }}>
              <div style={{ ...body, fontWeight: 700, fontSize: "0.85rem", color: COLORS.sunset, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <LiveDot /> Transmitiendo desde Tijuana, B.C. · 7 AM–12 PM
              </div>
              <h1 style={{ ...display, fontSize: "4rem", lineHeight: 0.95, margin: 0 }}>
                La voz de Tijuana,<br />en vivo.
              </h1>
              <p style={{ marginTop: "1.3rem", color: COLORS.muted, fontSize: "1.05rem", lineHeight: 1.6 }}>
                Somos la televisora online donde el talento local produce sus propios
                programas. Salimos en simultáneo en Twitch, YouTube y nuestra página web.
              </p>
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem", flexWrap: "wrap" }}>
                <a href="#contacto" className="lf-btn-primary" style={{ padding: "0.85rem 1.6rem", borderRadius: 4, textDecoration: "none" }}>Únete como creador</a>
                <a href="#programacion" className="lf-btn-outline" style={{ padding: "0.85rem 1.6rem", borderRadius: 4, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Play size={16} /> Ver programación
                </a>
              </div>
            </div>
          </div>

          <div style={{ width: 3, background: `linear-gradient(180deg, ${COLORS.sunset}, ${COLORS.dusk})`, flexShrink: 0 }} />

          <div style={{ flex: 1, background: `radial-gradient(circle at 70% 60%, rgba(51,199,232,0.14), transparent 60%)`, display: "flex", alignItems: "center", padding: "3rem 2rem" }}>
            <div style={{ maxWidth: 460 }}>
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "1.3rem", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                  <span style={{ ...body, fontWeight: 700, fontSize: "0.9rem" }}>Al aire ahora</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.sunset, fontSize: "0.8rem", fontWeight: 700 }}>
                    <LiveDot /> EN VIVO
                  </span>
                </div>
                <div style={{ ...display, fontSize: "1.6rem" }}>Frontera Deportiva</div>
                <div style={{ color: COLORS.muted, fontSize: "0.9rem", marginTop: 2 }}>Con Kike Osuna · Lunes 7:00 AM</div>
                <div style={{ marginTop: "1rem", height: 130, borderRadius: 6, background: `linear-gradient(135deg, rgba(255,106,57,0.25), rgba(51,199,232,0.2))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={34} />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center", color: COLORS.muted, fontSize: "0.8rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Twitch size={14} /> Twitch</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Youtube size={14} /> YouTube</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Globe size={14} /> Web</span>
                </div>
              </div>
              <p style={{ color: COLORS.muted, marginTop: "1.2rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Cinco programas en vivo cada semana, de 7:00 AM a 12:00 PM, producidos en
                nuestro estudio en Tijuana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUIENES SOMOS */}
      <section id="somos" style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "3rem" }}>
          <div>
            <SectionLabel>Quiénes somos</SectionLabel>
            <h2 style={{ ...display, fontSize: "2.6rem", margin: 0, lineHeight: 1.05 }}>
              Nacimos para darle un escenario profesional al talento de Tijuana.
            </h2>
            <p style={{ color: COLORS.muted, marginTop: "1.3rem", lineHeight: 1.7 }}>
              Línea Frontera Network arrancó con una idea simple: en Tijuana hay
              creadores con algo que decir, pero producir un programa de calidad
              cuesta tiempo, equipo y dinero que no todos tienen. Nosotros ponemos
              el estudio, la transmisión y el equipo técnico; el creador pone el
              contenido y la voz.
            </p>
            <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
              <div>
                <div style={{ ...display, fontSize: "2.2rem", color: COLORS.sunset }}>Misión</div>
                <p style={{ color: COLORS.muted, fontSize: "0.92rem", maxWidth: 260 }}>Democratizar el acceso a producción de calidad para creadores locales.</p>
              </div>
              <div>
                <div style={{ ...display, fontSize: "2.2rem", color: COLORS.dusk }}>Visión</div>
                <p style={{ color: COLORS.muted, fontSize: "0.92rem", maxWidth: 260 }}>Ser la plataforma de streaming de referencia en la frontera.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {VALORES.map((v) => (
              <div key={v.title} className="lf-card" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "1.2rem 1.4rem", background: COLORS.surface }}>
                <div style={{ ...display, fontSize: "1.25rem" }}>{v.title}</div>
                <p style={{ color: COLORS.muted, fontSize: "0.92rem", marginTop: 4, lineHeight: 1.55 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="funciona" style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <SectionLabel>Cómo funciona</SectionLabel>
          <h2 style={{ ...display, fontSize: "2.6rem", margin: 0, maxWidth: 620 }}>De la idea al aire, en cuatro pasos.</h2>
          <div className="lf-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginTop: "3rem" }}>
            {PASOS.map((p, i) => (
              <div key={p.n} style={{ position: "relative", paddingTop: "1rem" }}>
                <div style={{ ...display, fontSize: "3rem", color: i % 2 === 0 ? COLORS.sunset : COLORS.dusk, lineHeight: 1 }}>{p.n}</div>
                <div style={{ ...display, fontSize: "1.3rem", marginTop: "0.5rem" }}>{p.title}</div>
                <p style={{ color: COLORS.muted, fontSize: "0.9rem", marginTop: "0.4rem", lineHeight: 1.55 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CANAL / MULTISTREAM */}
      <section id="canal" style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
          <div>
            <SectionLabel>Nuestro canal</SectionLabel>
            <h2 style={{ ...display, fontSize: "2.4rem", margin: 0 }}>Un canal, tres pantallas, siempre encendido.</h2>
            <p style={{ color: COLORS.muted, marginTop: "1.2rem", lineHeight: 1.7 }}>
              Cada programa sale en simulcast a la vez en Twitch, YouTube y nuestra
              página web — no tienes que elegir dónde transmitir, transmites en todos
              lados a la vez. En vivo todos los días de 7:00 AM a 12:00 PM; fuera de
              ese horario, el canal sigue prendido con lo mejor de la programación de
              la semana, así Línea Frontera nunca se apaga.
            </p>
            <div style={{ display: "flex", gap: "1.8rem", marginTop: "1.8rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontWeight: 700, fontSize: "0.95rem" }}>
                <Twitch size={20} color={COLORS.dusk} /> Twitch
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontWeight: 700, fontSize: "0.95rem" }}>
                <Youtube size={20} color={COLORS.dusk} /> YouTube
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontWeight: 700, fontSize: "0.95rem" }}>
                <Globe size={20} color={COLORS.dusk} /> lineafrontera.stream
              </div>
            </div>
          </div>
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "1.8rem", background: COLORS.surface }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Horario al aire</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.sunset, fontWeight: 700, fontSize: "0.85rem" }}>
                <LiveDot /> 7:00 AM – 12:00 PM
              </span>
            </div>
            <div style={{ marginTop: "1.2rem", height: 8, borderRadius: 999, background: COLORS.bg, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: "29%", width: "21%", top: 0, bottom: 0, background: `linear-gradient(90deg, ${COLORS.sunset}, ${COLORS.dusk})`, borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontSize: "0.75rem", marginTop: 6 }}>
              <span>12 AM</span><span>7 AM</span><span>12 PM</span><span>11:59 PM</span>
            </div>
            <p style={{ color: COLORS.muted, fontSize: "0.85rem", marginTop: "1.2rem", lineHeight: 1.6 }}>
              Fuera del bloque en vivo, el canal reproduce contenido pregrabado en loop
              para mantener presencia continua en las tres plataformas.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMACION */}
      <section id="programacion" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <SectionLabel>Programación</SectionLabel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ ...display, fontSize: "2.6rem", margin: 0 }}>Esta semana, de 7 AM a 12 PM.</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.sunset, fontWeight: 700, fontSize: "0.9rem" }}>
              <LiveDot /> 1 programa en vivo ahora
            </div>
          </div>

          <div style={{ marginTop: "2.5rem", border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
            {PROGRAMACION.map((p, i) => (
              <div key={p.show} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", alignItems: "center", gap: "1rem", padding: "1.1rem 1.4rem", borderTop: i === 0 ? "none" : `1px solid ${COLORS.border}`, background: p.live ? "rgba(255,106,57,0.06)" : "transparent" }}>
                <div style={{ ...display, fontSize: "1.4rem", color: COLORS.muted }}>{p.dia}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.show}</div>
                  <div style={{ color: COLORS.muted, fontSize: "0.85rem" }}>{p.host} · {p.hora}</div>
                </div>
                {p.live ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.sunset, fontWeight: 700, fontSize: "0.85rem" }}>
                    <LiveDot /> EN VIVO
                  </span>
                ) : (
                  <span style={{ color: COLORS.muted, fontSize: "0.85rem" }}>Programado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <SectionLabel>Planes</SectionLabel>
          <h2 style={{ ...display, fontSize: "2.6rem", margin: 0, maxWidth: 620 }}>
            Precios pensados para empezar, no para frenarte.
          </h2>
          <p style={{ color: COLORS.muted, marginTop: "0.8rem", maxWidth: 620 }}>
            El horario de transmisión es la base. Reels e identidad visual son
            paquetes aparte — los agregas solo si los necesitas.
          </p>

          <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginTop: "2.5rem" }}>
            {HORARIOS.map((h) => (
              <PriceCard key={h.name} item={h} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "3.5rem", marginBottom: "1.5rem" }}>
            <Sparkles size={16} color={COLORS.dusk} />
            <span style={{ ...body, fontWeight: 700, color: COLORS.dusk, fontSize: "0.85rem" }}>Paquetes aparte, opcionales</span>
          </div>

          <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
            {ADDONS.map((a) => (
              <PriceCard key={a.name} item={a} cta="Agregar a mi horario" />
            ))}
          </div>
        </div>
      </section>

      {/* TALENTO */}
      <section id="talento" style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
        <SectionLabel>Talento destacado</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ ...display, fontSize: "2.6rem", margin: 0 }}>Las voces que ya están al aire.</h2>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button onClick={prevTalent} className="lf-btn-outline" style={{ padding: "0.6rem", borderRadius: 6 }}><ChevronLeft size={18} /></button>
            <button onClick={nextTalent} className="lf-btn-outline" style={{ padding: "0.6rem", borderRadius: 6 }}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div style={{ marginTop: "2.5rem", display: "flex", gap: "1.5rem", overflow: "hidden" }}>
          {[0, 1, 2].map((offset) => {
            const t = TALENTO[(talentIdx + offset) % TALENTO.length];
            return (
              <div key={t.name + offset} className="lf-card" style={{ flex: "1 0 0", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "1.5rem", background: COLORS.surface, display: offset === 2 ? "none" : "block" }}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: `linear-gradient(135deg, rgba(255,106,57,0.3), rgba(51,199,232,0.25))`, marginBottom: "1rem" }} />
                <div style={{ ...display, fontSize: "1.4rem" }}>{t.name}</div>
                <div style={{ color: COLORS.muted, fontSize: "0.9rem" }}>{t.show}</div>
                <div style={{ color: COLORS.dusk, fontSize: "0.85rem", marginTop: 4 }}>{t.handle}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <SectionLabel>Lo que dice el talento</SectionLabel>
          <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            {TESTIMONIOS.map((t) => (
              <div key={t.name} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "1.8rem", background: COLORS.bg }}>
                <p style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ marginTop: "1.2rem", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 700 }}>{t.name}</span>
                  <span style={{ color: COLORS.muted, fontSize: "0.85rem" }}>{t.show}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "4.5rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ ...display, fontSize: "1.8rem" }}>No te pierdas ninguna transmisión.</div>
            <p style={{ color: COLORS.muted, marginTop: 4 }}>Un correo a la semana con la programación y los mejores reels.</p>
          </div>
          {subscribed ? (
            <div style={{ color: COLORS.dusk, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={18} /> Listo, ya estás suscrito.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true); }} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <input type="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              <button type="submit" className="lf-btn-primary" style={{ padding: "0.8rem 1.4rem", borderRadius: 6 }}>Suscribirme</button>
            </form>
          )}
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "6rem 1.5rem" }}>
          <div className="lf-grid-2" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "3rem" }}>
            <div>
              <SectionLabel>Aplica ahora</SectionLabel>
              <h2 style={{ ...display, fontSize: "2.6rem", margin: 0 }}>¿Listo para tener tu propio programa?</h2>
              <p style={{ color: COLORS.muted, marginTop: "1.2rem", lineHeight: 1.7 }}>
                Cuéntanos de qué quieres hablar y a quién le hablas. Te contactamos
                en menos de 48 horas para platicar horarios y planes.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "2rem", color: COLORS.muted }}>
                <MapPin size={18} color={COLORS.sunset} /> Estudio en Tijuana, Baja California
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.6rem", color: COLORS.muted }}>
                <Mail size={18} color={COLORS.dusk} /> hola@lineafrontera.stream
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "2rem", background: COLORS.surface }}>
              {formSent ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <Check size={32} color={COLORS.dusk} style={{ marginBottom: "0.8rem" }} />
                  <div style={{ ...display, fontSize: "1.5rem" }}>Recibimos tu solicitud.</div>
                  <p style={{ color: COLORS.muted, marginTop: 4 }}>Te escribimos pronto por correo.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setFormSent(true); }} style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <input required placeholder="Nombre" style={inputStyle} />
                    <input required type="email" placeholder="Correo" style={inputStyle} />
                  </div>
                  <input placeholder="Nombre de tu programa" style={inputStyle} />
                  <textarea required placeholder="Cuéntanos de qué trata tu programa" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                  <select style={inputStyle} defaultValue="">
                    <option value="" disabled>Plan de interés</option>
                    <option>Por Show</option>
                    <option>Horario Fijo Mensual</option>
                    <option>+ Paquete de Reels</option>
                    <option>+ Identidad Visual</option>
                    <option>Aún no sé</option>
                  </select>
                  <button type="submit" className="lf-btn-primary" style={{ padding: "0.9rem", borderRadius: 6, marginTop: "0.4rem" }}>Enviar solicitud</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "2.5rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ ...display, fontSize: "1.2rem" }}>LÍNEA FRONTERA NETWORK</div>
          <div style={{ display: "flex", gap: "1.2rem" }}>
            <Instagram size={18} color={COLORS.muted} />
            <Music2 size={18} color={COLORS.muted} />
            <Youtube size={18} color={COLORS.muted} />
            <Twitch size={18} color={COLORS.muted} />
          </div>
          <div style={{ color: COLORS.muted, fontSize: "0.85rem" }}>Tijuana, Baja California</div>
        </div>
      </footer>
    </div>
  );
}

const inputStyle = {
  padding: "0.8rem 1rem",
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.bg,
  color: COLORS.text,
  ...body,
  fontSize: "0.95rem",
  minWidth: 0,
};
