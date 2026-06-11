// lounge-finder-v2.jsx — ELITE ASSIST · Lounge Finder
// Light brand system: #FAFAFA surfaces, #FAF6EC tiles, #F3EAD0 borders, gold #A8854C
// Interaction: city grid on page → click city → auto-scroll to lounge results below

(function () {
  const { useState, useEffect, useMemo, useRef } = React;

  const LOUNGES = window.EA_LOUNGES;
  const CITY_IMAGES = window.EA_CITY_IMAGES;
  const LOUNGE_IMGS = window.EA_LOUNGE_IMGS;
  const h32 = window.EA_HASH32;

  /* ───────────── Icons ───────────── */
  const Icon = ({ d, size = 18, sw = 1.7 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
  const I = {
    search: <g><circle cx="11" cy="11" r="6" /><path d="M21 21l-4.5-4.5" /></g>,
    check:  "M5 12l5 5 9-12",
    arrow:  "M5 12h14M13 5l7 7-7 7",
    x:      "M6 6l12 12M18 6L6 18",
    plane:  <g><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></g>,
    recliner: <g><path d="M5 18h14M5 18l-2 4M19 18l2 4M7 5h10a2 2 0 0 1 2 2v11H5V7a2 2 0 0 1 2-2zM12 5V2M9 2h6" /></g>,
    tv:       <g><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M8 20h8M12 18v2" /></g>,
    news:     <g><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12M3 14h6M3 18h6" /></g>,
    wifi:     <g><path d="M2 9C5.9 5 9.7 3 12 3s6.1 2 10 6M5.5 12.5C8 10 10 9 12 9s4 1 6.5 3.5M8.5 16C9.7 14.7 10.8 14 12 14s2.3.7 3.5 2" /><circle cx="12" cy="20" r="1.2" fill="currentColor" stroke="none" /></g>,
    buffet:   <g><path d="M18 2v20M15 5a3 3 0 0 0 6 0V2M6 2v6M4 2v6M8 2v6M6 8a2 2 0 0 0 2 2v10M4 10a2 2 0 0 0 2-2" /></g>,
    charge:   <g><polygon points="13 2 4.5 13.5 11 13.5 11 22 19.5 10.5 13 10.5 13 2" /></g>,
  };
  const AMENITIES = [
    { label: "Recliners", icon: I.recliner },
    { label: "TV",        icon: I.tv },
    { label: "Papers",    icon: I.news },
    { label: "Wi-Fi",     icon: I.wifi },
    { label: "Buffet",    icon: I.buffet },
    { label: "Charging",  icon: I.charge },
  ];

  /* ───────────── Derived data ───────────── */
  const CITIES = [...new Set(LOUNGES.map(l => l.city))].sort();
  const COUNTS = Object.fromEntries(CITIES.map(c => [c, LOUNGES.filter(l => l.city === c).length]));

  const gateLabel = (g) => g === "both" ? "Departure & Arrival" : g.charAt(0).toUpperCase() + g.slice(1);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ───────────── Fading image with fallback ───────────── */
  function Photo({ src, alt, className, onError: onErrorProp }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const handleError = () => { setFailed(true); if (onErrorProp) onErrorProp(); };
    if (failed) return <div className={"lf2-photo " + (className || "")} />;
    return (
      <div className={"lf2-photo " + (className || "")}>
        <img src={src} alt={alt || ""} loading="lazy"
          onLoad={() => setLoaded(true)} onError={handleError}
          style={{ opacity: loaded ? 1 : 0 }} />
      </div>
    );
  }

  /* ───────────── City tile ───────────── */
  const CITY_GRADIENTS = [
    ["#C8956C","#8A5A3A"], ["#6B8E6B","#3A5C3A"], ["#7B7BA8","#4A4A7A"],
    ["#A87B6B","#6B4A3A"], ["#6B9BA8","#3A6B7A"], ["#A8956B","#7A6A3A"],
    ["#8E6B8E","#5A3A5A"], ["#6B8E8E","#3A5C5C"], ["#A87B8E","#7A4A5C"],
  ];
  function cityGradient(city) {
    let h = 0;
    for (let i = 0; i < city.length; i++) h = (h * 31 + city.charCodeAt(i)) >>> 0;
    return CITY_GRADIENTS[h % CITY_GRADIENTS.length];
  }

  function CityTile({ city, selected, onSelect }) {
    const img = CITY_IMAGES[city];
    const [imgFailed, setImgFailed] = React.useState(false);
    const showGradient = !img || imgFailed;
    const [from, to] = cityGradient(city);
    return (
      <button
        className={"lf2-city-tile" + (selected ? " selected" : "")}
        onClick={() => onSelect(city)}>
        {showGradient ? (
          <div className="lf2-city-img lf2-city-gradient" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>
            <span className="lf2-city-initial">{city.charAt(0)}</span>
          </div>
        ) : (
          <Photo src={img} alt={city} className="lf2-city-img" onError={() => setImgFailed(true)} />
        )}
        {selected && (
          <span className="lf2-city-check">
            <Icon d={I.check} size={12} sw={3} />
          </span>
        )}
        <span className="lf2-city-name">{city}</span>
        <span className="lf2-city-count">{COUNTS[city]} lounge{COUNTS[city] > 1 ? "s" : ""}</span>
      </button>
    );
  }

  /* ───────────── Lounge card (grid) ───────────── */
  function LoungeCard({ l }) {
    const img = LOUNGE_IMGS[h32(l.city + l.name) % LOUNGE_IMGS.length];
    return (
      <div className="lf2-lounge-card">
        <div className="lf2-lounge-imgwrap">
          <Photo src={img} alt={l.name} className="lf2-lounge-img" />
          <span className="lf2-badge">{l.type === "domestic" ? "Domestic" : "International"}</span>
        </div>
        <div className="lf2-lounge-body">
          <div className="lf2-lounge-name">{l.name}</div>
          <div className="lf2-lounge-meta">
            {gateLabel(l.gate)} · {cap(l.location)} · Terminal {l.terminal.replace("T", "")}
          </div>
          <div className="lf2-amenities">
            {AMENITIES.map(a => (
              <span key={a.label} className="lf2-amenity" title={a.label}>
                <Icon d={a.icon} size={18} sw={1.6} />
                <span>{a.label}</span>
              </span>
            ))}
          </div>
          <a className="lf2-btn-gold" href={l.url} target="_blank" rel="noopener noreferrer">
            Access lounge
            <Icon d={I.arrow} size={15} sw={1.8} />
          </a>
        </div>
      </div>
    );
  }

  /* ───────────── Lounge row (list) ───────────── */
  function LoungeRow({ l }) {
    const img = LOUNGE_IMGS[h32(l.city + l.name) % LOUNGE_IMGS.length];
    return (
      <div className="lf2-lounge-row">
        <Photo src={img} alt={l.name} className="lf2-row-img" />
        <div className="lf2-row-main">
          <div className="lf2-lounge-name">{l.name}</div>
          <div className="lf2-lounge-meta">
            {gateLabel(l.gate)} · {cap(l.location)} · Terminal {l.terminal.replace("T", "")}
          </div>
          <div className="lf2-row-amenities">
            {AMENITIES.map(a => (
              <span key={a.label} className="lf2-amenity-mini" title={a.label}>
                <Icon d={a.icon} size={15} sw={1.6} />
              </span>
            ))}
          </div>
        </div>
        <div className="lf2-row-side">
          <span className="lf2-chip">{l.type === "domestic" ? "Domestic" : "International"}</span>
          <a className="lf2-btn-gold lf2-btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">
            Access
            <Icon d={I.arrow} size={13} sw={1.8} />
          </a>
        </div>
      </div>
    );
  }

  /* ───────────── Minimal lounge card (no photo) ───────────── */
  const LOUNGE_ACCENTS = [
    ["#A8854C","#FAF0DC"], ["#5C7E6A","#EAF4EE"], ["#6A6E9A","#EEEEF8"],
    ["#8A5A5A","#F8EAEA"], ["#4A7A8A","#E8F4F8"], ["#7A6A3A","#F8F4E8"],
  ];
  function loungeAccent(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return LOUNGE_ACCENTS[h % LOUNGE_ACCENTS.length];
  }

  function LoungeCardMinimal({ l }) {
    const [accent, bg] = loungeAccent(l.name);
    return (
      <div className="lf2-card-min">
        <div className="lf2-card-min-header" style={{ background: bg, borderColor: accent + "40" }}>
          <div className="lf2-card-min-type" style={{ color: accent }}>
            {l.type === "domestic" ? "Domestic" : "International"} · {l.gate === "both" ? "Dep & Arr" : cap(l.gate)}
          </div>
          <div className="lf2-card-min-name" style={{ color: accent }}>{l.name}</div>
          <div className="lf2-card-min-loc">
            <Icon d={I.plane} size={13} sw={1.6} />
            <span>Terminal {l.terminal.replace("T","")} · {cap(l.location)}</span>
          </div>
        </div>
        <div className="lf2-card-min-body">
          <div className="lf2-card-min-amenities">
            {AMENITIES.map(a => (
              <span key={a.label} className="lf2-card-min-amenity" style={{ color: accent }} title={a.label}>
                <Icon d={a.icon} size={17} sw={1.6} />
                <span>{a.label}</span>
              </span>
            ))}
          </div>
          <a className="lf2-btn-gold" href={l.url} target="_blank" rel="noopener noreferrer"
            style={{ background: accent }}>
            Access lounge
            <Icon d={I.arrow} size={15} sw={1.8} />
          </a>
        </div>
      </div>
    );
  }

  /* ───────────── Main app ───────────── */
  const LS_KEY = "ea-lf2-selection";

  function LoungeFinderV2({ cardStyle = "grid" }) {
    const initial = useMemo(() => {
      try {
        const s = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        return { city: CITIES.includes(s.city) ? s.city : null };
      } catch (e) { return { city: null }; }
    }, []);

    const [query, setQuery]       = useState("");
    const [selCity, setSelCity]   = useState(initial.city);
    const [terminal, setTerminal] = useState("all");
    const [type, setType]         = useState("all");
    const resultsRef = useRef(null);

    useEffect(() => {
      localStorage.setItem(LS_KEY, JSON.stringify({ city: selCity }));
    }, [selCity]);

    const filteredCities = useMemo(() => {
      const q = query.trim().toLowerCase();
      return q ? CITIES.filter(c => c.toLowerCase().includes(q)) : CITIES;
    }, [query]);

    const cityLounges = useMemo(
      () => selCity ? LOUNGES.filter(l => l.city === selCity) : [], [selCity]);
    const terminals = useMemo(
      () => [...new Set(cityLounges.map(l => l.terminal))].sort(), [cityLounges]);
    const types = useMemo(
      () => [...new Set(cityLounges.map(l => l.type))].sort(), [cityLounges]);
    const visible = useMemo(
      () => cityLounges.filter(l =>
        (terminal === "all" || l.terminal === terminal) &&
        (type === "all" || l.type === type)),
      [cityLounges, terminal, type]);
    const airport = cityLounges[0] ? cityLounges[0].airport : "";

    const selectCity = (city) => {
      const isNew = city !== selCity;
      setSelCity(city);
      setTerminal("all");
      setType("all");
      if (isNew) {
        setTimeout(() => {
          const el = resultsRef.current;
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }, 80);
      }
    };

    return (
      <div className="lf2-page">

        {/* ── Header ── */}
        <header className="lf2-header">
          <div className="lf2-header-inner">
            <img className="lf2-logo" src="elite-assist-logo.png" alt="Elite Assist" />
            <span className="lf2-header-rule" />
            <span className="lf2-header-label">
              {selCity
                ? <><span className="lf2-header-airport">{airport}</span><span className="lf2-header-meta">{selCity} · {cityLounges.length} lounge{cityLounges.length !== 1 ? "s" : ""}</span></>
                : <span className="lf2-header-meta">Lounge Finder</span>
              }
            </span>
          </div>
        </header>

        <main className="lf2-main">

          {/* ── Hero ── */}
          <section className="lf2-hero-simple">
            <div className="lf2-hero-eyebrow-simple">Lounge Finder</div>
            <h1 className="lf2-hero-title-simple">Find your lounge<br /><em>before you board</em></h1>
            <p className="lf2-hero-sub-simple">
              {LOUNGES.length} lounges across {CITIES.length} Indian airports.
              Choose your city below to see what's waiting past security.
            </p>
          </section>

          {/* ── City search ── */}
          <div className="lf2-city-search">
            <span className="lf2-city-search-icon"><Icon d={I.search} size={17} sw={2} /></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city…"
              spellCheck="false" autoComplete="off" />
            {query && (
              <button className="lf2-city-search-clear" onClick={() => setQuery("")} aria-label="Clear">
                <Icon d={I.x} size={13} sw={2.5} />
              </button>
            )}
          </div>

          {/* ── City grid ── */}
          <section className="lf2-city-section">
            {filteredCities.length ? (
              <div className="lf2-city-grid-inline">
                {filteredCities.map(city => (
                  <CityTile key={city} city={city} selected={city === selCity} onSelect={selectCity} />
                ))}
              </div>
            ) : (
              <div className="lf2-city-none">No cities match "{query.trim()}".</div>
            )}
          </section>

          {/* ── Results ── */}
          <section className="lf2-results" ref={resultsRef}>
            {!selCity ? (
              <div className="lf2-prompt">
                <div className="lf2-prompt-line" />
                <span className="lf2-prompt-text">Select a city above to see its lounges</span>
                <div className="lf2-prompt-line" />
              </div>
            ) : (
              <>
                {/* Airport hero banner */}
                <div className="lf2-hero">
                  <div className="lf2-hero-main">
                    <div className="lf2-hero-eyebrow">{selCity} · {visible.length} lounge{visible.length !== 1 ? "s" : ""} available</div>
                    <h2 className="lf2-hero-title">Lounges at<br />{airport}</h2>
                    <p className="lf2-hero-sub">Relax, recharge and grab a bite before boarding — included with your eligible card.</p>
                  </div>
                  <button className="lf2-hero-change" onClick={() => { setSelCity(null); setTerminal("all"); setType("all"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    <Icon d={I.x} size={14} sw={2} />
                    Change city
                  </button>
                </div>

                {/* Filters */}
                {(terminals.length > 1 || types.length > 1) && (
                  <div className="lf2-filters">
                    {terminals.length > 1 && (
                      <div className="lf2-filter-group">
                        <span className="lf2-filter-label">Terminal</span>
                        <div className="lf2-pills">
                          <button className={"lf2-pill" + (terminal === "all" ? " active" : "")} onClick={() => setTerminal("all")}>All</button>
                          {terminals.map(t => (
                            <button key={t} className={"lf2-pill" + (terminal === t ? " active" : "")} onClick={() => setTerminal(t)}>Terminal {t.replace("T", "")}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {types.length > 1 && (
                      <div className="lf2-filter-group">
                        <span className="lf2-filter-label">Travel</span>
                        <div className="lf2-pills">
                          <button className={"lf2-pill" + (type === "all" ? " active" : "")} onClick={() => setType("all")}>All</button>
                          {types.map(t => (
                            <button key={t} className={"lf2-pill" + (type === t ? " active" : "")} onClick={() => setType(t)}>{cap(t)}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Lounge list */}
                {visible.length ? (
                  cardStyle === "grid" ? (
                    <div className="lf2-lounge-grid">
                      {visible.map((l, i) => <LoungeCard key={l.url + i} l={l} />)}
                    </div>
                  ) : cardStyle === "minimal" ? (
                    <div className="lf2-card-min-grid">
                      {visible.map((l, i) => <LoungeCardMinimal key={l.url + i} l={l} />)}
                    </div>
                  ) : (
                    <div className="lf2-lounge-rows">
                      {visible.map((l, i) => <LoungeRow key={l.url + i} l={l} />)}
                    </div>
                  )
                ) : (
                  <div className="lf2-empty lf2-empty-small">
                    <div className="lf2-empty-title">No lounges match these filters.</div>
                    <div className="lf2-empty-sub">Try a different terminal or travel type.</div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <footer className="lf2-footer">Elite Assist · Lounge Finder</footer>
      </div>
    );
  }

  window.LoungeFinderV2 = LoungeFinderV2;
})();
