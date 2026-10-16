import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GachaAudio } from './audio'

const partnerName = 'Okta'
const cardMessage = 'Selalu jadi cahaya paling hangat di setiap petualangan.'
const bonusCards = [
  { title: 'Kejutan Capybara', icon: '✉', style: 'letter', image: '/okta-gacha-card-1.png', message: 'Kejutan lucu untuk petualangan kita.' },
  { title: 'Sentuhan Kasih', icon: '✦', style: 'star', image: '/okta-gacha-card-2.png', message: 'Kartu cinta penuh kelembutan.' },
  { title: 'Langkah Bersama', icon: '☀', style: 'sun', image: '/okta-gacha-card-3.png', message: 'Petualangan paling indah adalah bersamamu.' },
  { title: 'Penjelajah Malam', icon: '♡', style: 'heart', image: '/okta-gacha-card-4.png', message: 'Malam jadi seru saat kita bersama.' },
]

function App() {
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState(0)
  const [showLetter, setShowLetter] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioNotice, setAudioNotice] = useState('')
  const drawingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const packSoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioEnabled = useRef(true)
  const audioEngine = useRef<GachaAudio | null>(null)

  useEffect(() => {
    return () => audioEngine.current?.disable()
  }, [])

  const getAudioEngine = () => {
    if (!audioEngine.current) audioEngine.current = new GachaAudio()
    return audioEngine.current
  }

  const handleAudioError = (error: unknown) => {
    setIsAudioPlaying(false)
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      setAudioNotice('Browser menunggu interaksi sebelum audio dapat diputar.')
    } else {
      console.error('Audio gacha gagal diaktifkan.', error)
      setAudioNotice('Audio tidak dapat diputar di browser ini.')
    }
  }

  const startAudio = () => getAudioEngine().enable().then(() => {
    if (audioEnabled.current) {
      setIsAudioPlaying(true)
      setAudioNotice('')
    }
  })

  const playEffect = (effect: 'click' | 'pack', isRare = false) => {
    if (!audioEnabled.current) return

    void startAudio().then(() => {
      if (!audioEnabled.current) return
      if (effect === 'click') getAudioEngine().playClick()
      else getAudioEngine().playOpenPack(isRare)
    }).catch(handleAudioError)
  }

  const toggleAudio = () => {
    if (audioEnabled.current && isAudioPlaying) {
      audioEnabled.current = false
      setIsAudioPlaying(false)
      setAudioNotice('')
      audioEngine.current?.disable()
      if (packSoundTimer.current) clearTimeout(packSoundTimer.current)
      return
    }

    audioEnabled.current = true
    setAudioNotice('')
    void startAudio().catch(handleAudioError)
  }

  const drawCard = () => {
    if (isDrawing || hasDrawn) return
    const nextCount = revealedCount + 1
    playEffect('click')
    if (packSoundTimer.current) clearTimeout(packSoundTimer.current)
    packSoundTimer.current = setTimeout(() => playEffect('pack', nextCount === 5), 140)
    setIsDrawing(true)
    const revealDelay = nextCount === 5 ? 1650 : 700

    drawingTimer.current = setTimeout(() => {
      setRevealedCount(nextCount)
      setSelectedCard(nextCount)
      setIsDrawing(false)
      if (nextCount === 5) setHasDrawn(true)
    }, revealDelay)
  }

  const resetGacha = () => {
    if (drawingTimer.current) clearTimeout(drawingTimer.current)
    if (packSoundTimer.current) clearTimeout(packSoundTimer.current)
    setShowLetter(false)
    setIsDrawing(false)
    setRevealedCount(0)
    setSelectedCard(0)
    setHasDrawn(false)
  }

  const selectCard = (cardNumber: number) => {
    if (cardNumber <= revealedCount) setSelectedCard(cardNumber)
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#home" aria-label="Kapsul Cinta, beranda">
          <span className="brand-mark" aria-hidden="true">♡</span>
          <span>Kapsul Cinta</span>
        </a>
        <div className="topbar-actions">
          <div className="topbar-note">
            <span className="status-dot" />
            dibuat dengan sepenuh hati
          </div>
          <button
            className={`audio-toggle ${isAudioPlaying ? 'is-playing' : ''}`}
            type="button"
            aria-label={isAudioPlaying ? 'Matikan musik dan efek suara' : 'Nyalakan musik dan efek suara'}
            aria-pressed={isAudioPlaying}
            title={isAudioPlaying ? 'Matikan musik dan efek suara' : 'Nyalakan musik dan efek suara'}
            onClick={toggleAudio}
          >
            <span aria-hidden="true">{isAudioPlaying ? '♫' : '♪'}</span>
          </button>
          {audioNotice && <span className="audio-status" role="status">{audioNotice}</span>}
        </div>
      </header>

      <section className={`experience ${hasDrawn ? 'is-revealed' : ''}`} id="home">
        <div className="intro">
          <p className="eyebrow"><span>✦</span> a little surprise for you <span>✦</span></p>
          <h1>
            Satu tarikan,
            <br />
            <span>sejuta rasa.</span>
          </h1>
          <p className="intro-copy">
            Lima kejutan manis menunggumu di dalam kapsul ini.
            <br className="desktop-break" /> Kartu terakhir punya pesan spesial untukmu.
          </p>
        </div>

        <div className={`gacha-stage ${isDrawing ? 'is-drawing' : ''} ${isDrawing && revealedCount === 4 ? 'is-final-draw' : ''} ${selectedCard === 5 ? 'has-final-card' : ''}`}>
          <div className="stage-sparkle sparkle-left" aria-hidden="true">✳</div>
          <div className="stage-sparkle sparkle-right" aria-hidden="true">✦</div>
          <div className="stage-sparkle sparkle-top" aria-hidden="true">✧</div>

          {selectedCard === 0 && revealedCount === 0 && !isDrawing ? (
            <div className="machine-wrap" aria-label="Mesin gacha berbentuk kapsul hati">
              <div className="machine-halo" />
              <div className="machine">
                <div className="machine-top">
                  <div className="machine-shine" />
                  <div className="capsule">
                    <div className="capsule-top"><span>♡</span></div>
                    <div className="capsule-bottom" />
                    <div className="capsule-glint" />
                  </div>
                  <span className="machine-star star-a">✦</span>
                  <span className="machine-star star-b">✧</span>
                </div>
                <div className="machine-middle">
                  <span className="machine-label">LOVE</span>
                  <div className="machine-window">
                    <span className="window-heart">♥</span>
                    <span className="window-heart">♥</span>
                    <span className="window-heart">♥</span>
                  </div>
                  <span className="machine-label">GACHA</span>
                </div>
                <div className="machine-base">
                  <div className="machine-slot"><span /></div>
                  <div className="machine-knob"><span>♡</span></div>
                </div>
              </div>
              <div className="machine-shadow" />
            </div>
          ) : (
            <div className={`card-reveal ${isDrawing ? 'is-revealing' : ''} ${isDrawing && revealedCount === 4 ? 'final-reveal-pending' : ''} ${selectedCard === 5 ? 'final-reveal' : ''}`}>
              <div className="reveal-rays" aria-hidden="true" />
              {isDrawing && revealedCount === 4 && (
                <div className="final-flash" aria-hidden="true">
                  <span>✦</span><span>✧</span><span>♡</span><span>✦</span><span>✧</span>
                </div>
              )}
              {selectedCard < 5 ? (
                <article className={`bonus-card bonus-${bonusCards[selectedCard - 1]?.style ?? 'back'}`} key={selectedCard}>
                  {selectedCard > 0 ? (
                    <img
                      className="bonus-card-image"
                      src={bonusCards[selectedCard - 1]?.image}
                      alt={`${bonusCards[selectedCard - 1]?.title}: ${bonusCards[selectedCard - 1]?.message}`}
                    />
                  ) : (
                    <div className="bonus-card-back"><span>♡</span><small>LOVE GACHA</small></div>
                  )}
                </article>
              ) : (
                <article className="collectible-card" key="special-card">
                  <img
                    className="card-image"
                    src="/okta-special-card.png"
                    alt="Kartu hadiah spesial ulang tahun Okta, tarikan terakhir dari lima kartu"
                  />
                  <span className="final-card-ribbon">KARTU TERAKHIR · SUPER LANGKA</span>
                </article>
              )}
              <div className="card-progress" aria-label={`Menampilkan kartu ${selectedCard} dari 5`}>
                <span className="card-progress-label">
                  {isDrawing ? `MEMBUKA KARTU ${revealedCount + 1} DARI 5` : `KARTU ${selectedCard} DARI 5`}
                </span>
                <div className="card-progress-dots">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span className={index < revealedCount ? 'is-complete' : ''} key={index}>
                      {index + 1}
                    </span>
                  ))}
                </div>
              </div>
              <span className="reveal-burst burst-one" aria-hidden="true">✦</span>
              <span className="reveal-burst burst-two" aria-hidden="true">✧</span>
              <span className="reveal-burst burst-three" aria-hidden="true">♡</span>
            </div>
          )}
        </div>

        <div className="action-area">
          {!hasDrawn ? (
            <>
              <button className={`draw-button ${revealedCount === 4 ? 'final-draw-button' : ''}`} type="button" onClick={drawCard} disabled={isDrawing}>
                <span className="button-icon" aria-hidden="true">{isDrawing ? '✦' : revealedCount === 4 ? '★' : '♡'}</span>
                {isDrawing
                  ? revealedCount === 4 ? 'menyiapkan kartu paling langka...' : `membuka kartu ${revealedCount + 1} dari 5...`
                  : revealedCount === 0 ? 'buka kapsulmu' : revealedCount === 4 ? 'ungkap kartu paling langka' : 'buka kartu berikutnya'}
                {!isDrawing && <span className="button-arrow" aria-hidden="true">↗</span>}
              </button>
              <p className="button-hint">
                <span aria-hidden="true">✧</span>
                {isDrawing
                  ? 'sebentar ya, kejutanmu sedang disiapkan'
                  : revealedCount === 0
                    ? 'lima kartu manis menunggu untuk dibuka satu per satu'
                    : revealedCount < 4
                      ? `${5 - revealedCount} kartu lagi menunggu untuk dibuka`
                      : revealedCount === 4
                        ? 'tarikan terakhir... ada kartu super langka!'
                        : 'lima kartu sudah terbuka'}
              </p>
            </>
          ) : (
            <div className="revealed-actions">
              <p className="congratulations">Yay! Lima kartu terbuka, dan yang terakhir khusus untukmu—{cardMessage.toLowerCase()} <span>♡</span></p>
              <div className="action-buttons">
                <button className="draw-button letter-button" type="button" onClick={() => { playEffect('click'); setShowLetter((open) => !open) }}>
                  <span className="button-icon" aria-hidden="true">{showLetter ? '♡' : '✉'}</span>
                  {showLetter ? 'tutup pesannya' : 'ada pesan untukmu'}
                </button>
                <button className="again-button" type="button" onClick={() => { playEffect('click'); resetGacha() }}>
                  tarik lagi <span aria-hidden="true">↻</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {hasDrawn && (
          <div className="pull-trail">
            <p>Klik ikon untuk melihat kembali kartunya <span>♡</span></p>
            <div className="pull-trail-cards">
              {bonusCards.map((card, index) => (
                <button
                  className={`pull-trail-card trail-${card.style} ${selectedCard === index + 1 ? 'is-selected' : ''}`}
                  key={card.style}
                  type="button"
                  title={`Lihat kartu ${index + 1}: ${card.title}`}
                  aria-label={`Lihat kembali kartu ${index + 1}, ${card.title}`}
                  aria-pressed={selectedCard === index + 1}
                  onClick={() => { playEffect('click'); selectCard(index + 1) }}
                >
                  <span aria-hidden="true">{card.icon}</span>
                  <small>{index + 1}</small>
                </button>
              ))}
              <button
                className={`pull-trail-card trail-rare ${selectedCard === 5 ? 'is-selected' : ''}`}
                type="button"
                title="Lihat kartu 5: Kartu langka Okta"
                aria-label="Lihat kembali kartu 5, kartu langka Okta"
                aria-pressed={selectedCard === 5}
                onClick={() => { playEffect('click'); selectCard(5) }}
              >
                <span aria-hidden="true">★</span>
                <small>5</small>
              </button>
            </div>
          </div>
        )}

        {hasDrawn && showLetter && (
          <aside className="love-letter" aria-live="polite">
            <span className="letter-stamp" aria-hidden="true">♡</span>
            <p className="letter-kicker">a little note for you</p>
            <h2>Untuk {partnerName},</h2>
            <p className="letter-message">
              Setiap kali aku mengingat tanggal 21 Oktober 2004, rasanya aku ingin selalu bersyukur. Terima kasih karena kamu sudah lahir ke dunia ini, dan terima kasih karena semesta sudah mengizinkan kamu hadir menjadi bagian paling indah dalam hidupku.

Selamat ulang tahun, sayang!

Sebagai hadiah kecil, aku membuat 'Web Kapsul Cinta' ini khusus untukmu. Web ini aku buat dengan penuh rasa sayang dan cinta, walaupun aku tahu, karya ini nggak akan pernah bisa mengalahkan betapa spesialnya kehadiran kamu di hidupku. Terima kasih sudah jadi rumah paling nyaman buatku."
            </p>
            <p className="letter-signoff">selalu, orang yang sayang kamu <span>♥</span></p>
          </aside>
        )}
      </section>

      <footer className="footer">
        <span>made with <span className="footer-heart">♥</span> just for you</span>
        <span className="footer-divider">·</span>
        <span>your luckiest pull ever</span>
      </footer>
    </main>
  )
}

export default App
