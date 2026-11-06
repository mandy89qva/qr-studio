import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  ArrowDownToLine, ArrowRight, Check, Crown, ExternalLink,
  Globe, History, Link2, LockKeyhole, Menu, Palette, QrCode,
  ShieldCheck, Sparkles, X
} from 'lucide-react'

type QrRecord = {
  id: string
  value: string
  title: string
  createdAt: string
  dataUrl: string
  color: string
}

const STORAGE_KEY = 'qr-studio-records-v1'
const PRO_KEY = 'qr-studio-pro-preview'

function readRecords(): QrRecord[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as QrRecord[] }
  catch { return [] }
}

function App() {
  const [records, setRecords] = useState<QrRecord[]>(readRecords)
  const [value, setValue] = useState('')
  const [title, setTitle] = useState('')
  const [color, setColor] = useState('#171827')
  const [qrData, setQrData] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState<'home' | 'history' | 'pro'>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isProPreview, setIsProPreview] = useState(localStorage.getItem(PRO_KEY) === 'true')
  const [created, setCreated] = useState(false)

  const remaining = isProPreview ? 'Ilimitados' : `${Math.max(0, 3 - records.length)} de 3`
  const hasReachedLimit = !isProPreview && records.length >= 3

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const canGenerate = useMemo(() => value.trim().length > 0 && !hasReachedLimit, [value, hasReachedLimit])

  async function generateQr() {
    setError('')
    setCreated(false)
    if (!value.trim()) {
      setError('Escribe un enlace o texto para crear tu código QR.')
      return
    }
    if (hasReachedLimit) {
      setView('pro')
      return
    }
    try {
      const dataUrl = await QRCode.toDataURL(value.trim(), {
        width: 720,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: color, light: '#FFFFFF' },
      })
      setQrData(dataUrl)
    } catch {
      setError('No se pudo generar el código. Revisa el contenido e inténtalo de nuevo.')
    }
  }

  function saveQr() {
    if (!qrData) return
    if (hasReachedLimit) {
      setView('pro')
      return
    }
    const record: QrRecord = {
      id: crypto.randomUUID(),
      value: value.trim(),
      title: title.trim() || 'Mi código QR',
      createdAt: new Date().toISOString(),
      dataUrl: qrData,
      color,
    }
    setRecords(prev => [...prev, record])
    setCreated(true)
  }

  function downloadQr(dataUrl = qrData, fileTitle = title || 'qr-studio') {
    if (!dataUrl) return
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = `${fileTitle.trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'qr-studio'}.png`
    anchor.click()
  }

  function activatePreview() {
    // Demo-only switch: not a real payment or verified subscription.
    const next = !isProPreview
    setIsProPreview(next)
    localStorage.setItem(PRO_KEY, String(next))
    setView('home')
  }

  function startNew() {
    setValue('')
    setTitle('')
    setQrData('')
    setError('')
    setCreated(false)
    setView('home')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); startNew() }}>
          <span className="brand-mark"><QrCode size={23} strokeWidth={2.4} /></span>
          <span>QR <b>Studio</b></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <button className={view === 'home' ? 'nav-link active' : 'nav-link'} onClick={startNew}>Crear QR</button>
          <button className={view === 'history' ? 'nav-link active' : 'nav-link'} onClick={() => setView('history')}>Mis códigos</button>
          <button className="nav-pro" onClick={() => setView('pro')}><Crown size={15}/> QR Studio Pro</button>
        </nav>
        <div className="top-actions">
          <span className="plan-pill"><span className="status-dot"/>{isProPreview ? 'Pro (demo)' : 'Plan gratis'}</span>
          <button className="mobile-menu" aria-label="Abrir menú" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
      </header>

      {mobileMenu && <div className="mobile-nav">
        <button onClick={() => { startNew(); setMobileMenu(false) }}>Crear QR</button>
        <button onClick={() => { setView('history'); setMobileMenu(false) }}>Mis códigos</button>
        <button onClick={() => { setView('pro'); setMobileMenu(false) }}>QR Studio Pro</button>
      </div>}

      <main className="main-content">
        {view === 'home' && <>
          <section className="hero">
            <div className="eyebrow"><Sparkles size={14}/> SIMPLE. RÁPIDO. PERSONALIZADO.</div>
            <h1>Todo empieza con<br/><span>un código QR.</span></h1>
            <p className="hero-copy">Convierte cualquier enlace o texto en un código QR listo para compartir.</p>
          </section>

          <section className="workspace">
            <div className="form-panel">
              <div className="section-heading">
                <div><span className="step-label">CREADOR DE QR</span><h2>Crear código</h2></div>
                <span className="usage"><QrCode size={14}/>{remaining} QR</span>
              </div>

              {hasReachedLimit && <div className="limit-banner">
                <LockKeyhole size={18}/><div><b>Ya utilizaste tus 3 QR gratuitos</b><span>Con QR Studio Pro podrás crear todos los que necesites.</span></div>
                <button onClick={() => setView('pro')}>Ver Pro <ArrowRight size={14}/></button>
              </div>}

              <label htmlFor="qr-title">Nombre del código <span className="optional">OPCIONAL</span></label>
              <input id="qr-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Mi página web" maxLength={48}/>

              <label htmlFor="qr-value">Enlace o texto <span className="required">*</span></label>
              <div className="input-wrap"><Link2 size={17}/><input id="qr-value" value={value} onChange={e => setValue(e.target.value)} placeholder="https://tusitio.com" maxLength={1500}/></div>
              <p className="field-help">Puede ser una URL, un mensaje o cualquier texto.</p>

              <div className="label-row"><label>Color del código</label><span className="hex-value">{color.toUpperCase()}</span></div>
              <div className="color-row">
                {['#171827', '#6656E8', '#167C68', '#2563EB', '#C45A36'].map(c => <button key={c} aria-label={`Color ${c}`} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => { setColor(c); setQrData(''); setCreated(false) }}/>)}
                <label className="custom-color" title="Elegir otro color"><Palette size={16}/><input aria-label="Elegir color personalizado" type="color" value={color} onChange={e => { setColor(e.target.value); setQrData(''); setCreated(false) }}/></label>
              </div>

              {error && <p className="error-text">{error}</p>}
              {created && <p className="success-text"><Check size={16}/> ¡Tu código se guardó correctamente!</p>}
              <button className="primary-button" onClick={qrData ? saveQr : generateQr} disabled={!qrData && !canGenerate}>
                {qrData ? <><Check size={17}/> Guardar mi QR</> : <><QrCode size={17}/> Generar código QR</>}
                <ArrowRight size={17}/>
              </button>
              <p className="privacy-note"><ShieldCheck size={14}/> Tu contenido se procesa en este dispositivo.</p>
            </div>

            <div className="preview-panel">
              <div className="preview-top"><span>VISTA PREVIA</span><span className="live-tag"><span/> EN VIVO</span></div>
              <div className="qr-stage">
                {qrData ? <img className="qr-image" src={qrData} alt="Vista previa del código QR generado"/> :
                  <div className="empty-qr"><div className="empty-qr-icon"><QrCode size={48}/></div><b>Tu QR aparecerá aquí</b><span>Introduce un enlace o texto<br/>para comenzar.</span></div>}
              </div>
              <div className="preview-caption"><div><b>{title.trim() || 'Tu nuevo código QR'}</b><span>{qrData ? 'Listo para guardar' : 'Personaliza y genera tu código'}</span></div>
                {qrData && <button className="download-button" onClick={() => downloadQr()}><ArrowDownToLine size={16}/> PNG</button>}
              </div>
              <div className="preview-footer"><span><span className="mini-dot"/> Alta resolución</span><span>PNG · 720 × 720</span></div>
            </div>
          </section>

          <section className="bottom-info">
            <div className="info-card"><span className="info-icon"><Globe size={18}/></span><div><b>Fácil de compartir</b><span>Un QR para abrir tu contenido al instante.</span></div></div>
            <div className="info-card"><span className="info-icon"><LockKeyhole size={18}/></span><div><b>Privacidad primero</b><span>Tu contenido no sale de tu dispositivo.</span></div></div>
            <div className="info-card"><span className="info-icon"><Sparkles size={18}/></span><div><b>Sin complicaciones</b><span>Diseñado para hacer una cosa muy bien.</span></div></div>
          </section>
        </>}

        {view === 'history' && <section className="subpage">
          <div className="page-kicker"><History size={15}/> TU COLECCIÓN</div>
          <h1>Mis <span>códigos QR.</span></h1>
          <p className="subpage-copy">Aquí encontrarás los códigos que has guardado en este dispositivo.</p>
          {records.length === 0 ? <div className="empty-history"><div className="empty-qr-icon"><QrCode size={38}/></div><b>Aún no tienes códigos guardados</b><span>Crea tu primer QR y aparecerá aquí.</span><button className="primary-button compact" onClick={startNew}>Crear mi primer QR <ArrowRight size={16}/></button></div> :
            <div className="history-list">{records.map(record => <article className="history-item" key={record.id}><img src={record.dataUrl} alt="Código QR"/><div className="history-details"><b>{record.title}</b><span>{record.value}</span><small>{new Date(record.createdAt).toLocaleDateString('es')}</small></div><button className="icon-button" aria-label="Descargar QR" onClick={() => downloadQr(record.dataUrl, record.title)}><ArrowDownToLine size={18}/></button></article>)}</div>}
        </section>}

        {view === 'pro' && <section className="pro-page">
          <div className="pro-glow"><Crown size={29}/></div>
          <div className="page-kicker pro-kicker">MÁS POSIBILIDADES, UN SOLO LUGAR</div>
          <h1>Desbloquea todo<br/><span>tu potencial QR.</span></h1>
          <p className="subpage-copy">Crea tantos códigos como necesites y organiza tus ideas sin límites.</p>
          <div className="pro-card">
            <div className="pro-card-top"><span className="pro-icon"><Crown size={19}/></span><span className="pro-label">QR STUDIO PRO</span></div>
            <h2>Más QR. Más posibilidades.</h2>
            <ul><li><Check/> Códigos QR ilimitados</li><li><Check/> Historial de tus códigos</li><li><Check/> Personalización de colores</li><li><Check/> Descargas en PNG</li><li><Check/> Próximas funciones premium</li></ul>
            <button className="primary-button pro-button" onClick={() => alert('La compra Pro estará disponible cuando conectemos la autenticación y los pagos oficiales de QvaPay. Esta versión es una demostración y no realiza cobros.')}>Próximamente en QvaPay <ExternalLink size={16}/></button>
            <p className="demo-note">Todavía no se realizan pagos. Esta es una vista previa del plan Pro.</p>
          </div>
          <button className="text-button" onClick={activatePreview}>{isProPreview ? 'Desactivar vista previa Pro' : 'Vista previa de funciones Pro (demo)'}</button>
        </section>}
      </main>

      <footer className="footer"><a className="footer-brand" href="#" onClick={e => e.preventDefault()}><QrCode size={17}/> QR Studio</a><span>Hecho para compartir ideas.</span><span>v1.0 · Demo</span></footer>
    </div>
  )
}

export default App
