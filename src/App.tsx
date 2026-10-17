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
const machineBallVariants = [4, 1, 6, 3, 2, 8, 9, 5, 7, 2, 6, 1, 4, 8, 3, 5, 7, 9, 1, 6, 4, 2, 8, 5]
const launchableBallVariants = [2, 3, 4, 5, 6, 7, 8, 9]

const loadAndDecodeImage = (source: string) => {
  const image = new Image()
  image.decoding = 'async'

  if (typeof image.decode === 'function') {
    image.src = source
    return image.decode().then(() => {
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error(`Kartu tidak memiliki ukuran gambar yang valid: ${source}`)
      }
    })
  }

  return new Promise<void>((resolve, reject) => {
    image.onload = () => {
      if (image.naturalWidth && image.naturalHeight) resolve()
      else reject(new Error(`Kartu tidak memiliki ukuran gambar yang valid: ${source}`))
    }
    image.onerror = () => reject(new Error(`Gambar kartu gagal dimuat: ${source}`))
    image.src = source
    if (image.complete) {
      if (image.naturalWidth && image.naturalHeight) resolve()
      else reject(new Error(`Gambar kartu gagal dimuat: ${source}`))
    }
  })
}

function App() {
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPreparingCard, setIsPreparingCard] = useState(false)
  const [cardLoadError, setCardLoadError] = useState('')
  const [areMachineBallsReady, setAreMachineBallsReady] = useState(false)
  const [isLoadingMachineBalls, setIsLoadingMachineBalls] = useState(true)
  const [machineBallLoadError, setMachineBallLoadError] = useState('')
  const [machineBallLoadAttempt, setMachineBallLoadAttempt] = useState(0)
  const [activeLaunchBall, setActiveLaunchBall] = useState('/love-ball.png')
  const [revealedCount, setRevealedCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState(0)
  const [showLetter, setShowLetter] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioNotice, setAudioNotice] = useState('')
  const drawingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const packSoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usedLaunchVariants = useRef(new Set<number>())
  const audioEnabled = useRef(true)
  const audioEngine = useRef<GachaAudio | null>(null)

  useEffect(() => {
    let isCurrentAttempt = true
    const sources = [...new Set([...launchableBallVariants, 1].map((variant) => `/pokeball-${variant}.png`))]
    sources.push('/love-ball.png')

    void Promise.all(sources.map(loadAndDecodeImage)).then(() => {
      if (isCurrentAttempt) setAreMachineBallsReady(true)
    }).catch((error: unknown) => {
      console.error('Gagal memuat gambar Poké Ball untuk mesin gacha.', error)
      if (isCurrentAttempt) {
        setMachineBallLoadError('Beberapa Poké Ball belum berhasil dimuat. Periksa koneksi lalu coba lagi.')
      }
    }).finally(() => {
      if (isCurrentAttempt) setIsLoadingMachineBalls(false)
    })

    return () => {
      isCurrentAttempt = false
    }
  }, [machineBallLoadAttempt])

  useEffect(() => {
    return () => {
      if (drawingTimer.current) clearTimeout(drawingTimer.current)
      if (packSoundTimer.current) clearTimeout(packSoundTimer.current)
      audioEngine.current?.disable()
    }
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

  const drawCard = async () => {
    if (isDrawing || hasDrawn || !areMachineBallsReady) return
    const nextCount = revealedCount + 1
    const imageSource = nextCount === 5 ? '/okta-special-card.png' : bonusCards[nextCount - 1].image
    const availableVariants = launchableBallVariants.filter((variant) => !usedLaunchVariants.current.has(variant))
    const launchVariant = nextCount === 5
      ? null
      : availableVariants[Math.floor(Math.random() * availableVariants.length)]
    const nextLaunchBall = launchVariant === null ? '/love-ball.png' : `/pokeball-${launchVariant}.png`
    setCardLoadError('')
    setIsPreparingCard(true)
    setIsDrawing(true)
    playEffect('click')

    try {
      await Promise.all([loadAndDecodeImage(imageSource), loadAndDecodeImage(nextLaunchBall)])
    } catch (error) {
      console.error(`Gagal menyiapkan gambar kartu atau Poké Ball untuk tarikan ${nextCount}.`, error)
      setCardLoadError('Gambar kartu atau Poké Ball belum berhasil dimuat. Periksa koneksi lalu tekan tombol untuk mencoba lagi.')
      setIsPreparingCard(false)
      setIsDrawing(false)
      return
    }

    if (launchVariant !== null) usedLaunchVariants.current.add(launchVariant)
    setActiveLaunchBall(nextLaunchBall)
    setIsPreparingCard(false)
    if (packSoundTimer.current) clearTimeout(packSoundTimer.current)
    packSoundTimer.current = setTimeout(() => playEffect('pack', nextCount === 5), 140)
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
    setCardLoadError('')
    setIsPreparingCard(false)
    setIsDrawing(false)
    usedLaunchVariants.current.clear()
    setRevealedCount(0)
    setSelectedCard(0)
    setHasDrawn(false)
  }

  const selectCard = (cardNumber: number) => {
    if (cardNumber <= revealedCount) setSelectedCard(cardNumber)
  }

  const retryMachineBalls = () => {
    setAreMachineBallsReady(false)
    setIsLoadingMachineBalls(true)
    setMachineBallLoadError('')
    setMachineBallLoadAttempt((attempt) => attempt + 1)
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

        <div className={`gacha-stage ${isDrawing ? 'is-drawing' : ''} ${isDrawing && !isPreparingCard ? 'is-ball-launching' : ''} ${isDrawing && revealedCount === 4 ? 'is-final-draw' : ''} ${selectedCard === 5 ? 'has-final-card' : ''}`}>
          <div className="stage-sparkle sparkle-left" aria-hidden="true">✳</div>
          <div className="stage-sparkle sparkle-right" aria-hidden="true">✦</div>
          <div className="stage-sparkle sparkle-top" aria-hidden="true">✧</div>

          {isDrawing || (selectedCard === 0 && revealedCount === 0) ? (
            <div className="machine-wrap" aria-label="Mesin gacha dengan berbagai jenis Poké Ball">
              <div className="machine-halo" />
              <div className="machine">
                <div className="machine-top">
                  <div className="machine-ball-pile">
                    {areMachineBallsReady ? machineBallVariants.map((variant, index) => (
                        <img
                          className="machine-ball"
                          src={`/pokeball-${variant}.png`}
                          alt=""
                          draggable={false}
                          key={`${variant}-${index}`}
                        />
                      ))
                      : (
                        <div className="machine-assets-loader" role={machineBallLoadError ? 'alert' : 'status'} aria-live="polite">
                          {machineBallLoadError ? (
                            <span>bola belum siap</span>
                          ) : (
                            <>
                              <span className="machine-loader-spinner" aria-hidden="true" />
                              <span>menyiapkan bola...</span>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                  <img className="machine-ball-launch" src={activeLaunchBall} alt="" aria-hidden="true" />
                  {isDrawing && revealedCount === 4 && (
                    <div className="machine-rare-flash" aria-hidden="true">
                      <span>✦</span><span>✧</span><span>★</span><span>✦</span><span>♡</span><span>✧</span>
                    </div>
                  )}
                  <div className="machine-shine" />
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
              {selectedCard === 5 && revealedCount === 5 && (
                <div className="birthday-fireworks" aria-hidden="true">
                  <span className="birthday-firework firework-left" />
                  <span className="birthday-firework firework-right" />
                  <span className="birthday-firework firework-center" />
                  <span className="birthday-confetti confetti-one">✦</span>
                  <span className="birthday-confetti confetti-two">✧</span>
                  <span className="birthday-confetti confetti-three">♡</span>
                  <span className="birthday-confetti confetti-four">✦</span>
                  <span className="birthday-confetti confetti-five">✧</span>
                </div>
              )}
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
              <button className={`draw-button ${revealedCount === 4 ? 'final-draw-button' : ''}`} type="button" onClick={drawCard} disabled={isDrawing || !areMachineBallsReady}>
                <span className="button-icon" aria-hidden="true">{isDrawing || isLoadingMachineBalls ? '✦' : revealedCount === 4 ? '★' : '♡'}</span>
                {isDrawing
                  ? isPreparingCard ? 'memuat gambar kartu...' : revealedCount === 4 ? 'menyiapkan kartu paling langka...' : `membuka kartu ${revealedCount + 1} dari 5...`
                  : isLoadingMachineBalls ? 'menyiapkan Poké Ball...'
                    : revealedCount === 0 ? 'buka kapsulmu' : revealedCount === 4 ? 'ungkap kartu paling langka' : 'buka kartu berikutnya'}
                {!isDrawing && areMachineBallsReady && <span className="button-arrow" aria-hidden="true">↗</span>}
              </button>
              <p className="button-hint">
                <span aria-hidden="true">✧</span>
                {isDrawing
                  ? isPreparingCard ? 'menyiapkan gambar agar kartu tampil sempurna' : 'sebentar ya, kejutanmu sedang disiapkan'
                  : isLoadingMachineBalls ? 'memuat semua variasi bola sebelum mesin siap'
                    : revealedCount === 0
                    ? 'lima kartu manis menunggu untuk dibuka satu per satu'
                    : revealedCount < 4
                      ? `${5 - revealedCount} kartu lagi menunggu untuk dibuka`
                      : revealedCount === 4
                        ? 'tarikan terakhir... ada kartu super langka!'
                        : 'lima kartu sudah terbuka'}
              </p>
              {machineBallLoadError && (
                <>
                  <p className="card-load-error" role="alert">{machineBallLoadError}</p>
                  <button
                    className="machine-assets-retry"
                    type="button"
                    onClick={retryMachineBalls}
                  >
                    Coba muat ulang Poké Ball
                  </button>
                </>
              )}
              {cardLoadError && <p className="card-load-error" role="alert">{cardLoadError}</p>}
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
