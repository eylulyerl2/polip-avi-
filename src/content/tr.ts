/**
 * ALL PLAYER-FACING TEXT LIVES HERE (Turkish).
 *
 * Tıp öğrencileri için not: Bu dosyadaki metinleri serbestçe düzenleyebilirsiniz.
 *  - Tırnak içindeki Türkçe metinleri değiştirin; `{ad}` biçimindeki süslü parantezli
 *    yer tutucuları (ör. {oran}) silmeyin, oyun bunları sayılarla doldurur.
 *  - "TODO: medical review" yazan her satır, tıbbi doğruluğu henüz kontrol edilmemiş
 *    bir ifadedir. Kontrol edince o yorumu silin.
 *  - Kaynaklı iki bilgi (Lancet 2025 ve Gastrointestinal Endoscopy 2025) kaynağıyla birlikte
 *    verilmiştir; sayıları değiştirmeden önce makaleyi kontrol edin.
 */

export const GAME_NAME = "Polip Avı";
export const GAME_SUBTITLE = "Yapay zeka ile ikinci göz";

/** Replaces `{key}` placeholders in a template. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export const tr = {
  meta: {
    title: `${GAME_NAME} · ${GAME_SUBTITLE}`,
    description:
      "Kolonoskopide yapay zekanın nasıl yardım ettiğini, nerede yanıldığını ve ona alışınca neler olduğunu kendi telefonunda dene.",
  },

  start: {
    description:
      "Kolon tünelinde ilerle, polipleri yakala; yapay zekanın neye yardım ettiğini ve nerede yanıldığını kendi gözlerinle gör.",
    play: "Oyna",
    howTo: "Nasıl oynanır: Tünelde beliren polipe dokun. Hava kabarcıklarına ve kıvrım gölgelerine dokunma!",
  },

  disclaimer:
    "Bu bir eğitim oyunudur; tanı koymaz ve gerçek bir tıbbi değerlendirmenin yerine geçmez.",

  hud: {
    seedLabel: "tohum",
    score: "Puan",
    aiBadge: "Yapay zeka açık",
  },

  /** What each object is, shown on the results screen. */
  objects: {
    polyp: {
      name: "Polip",
      // TODO: medical review
      explanation: "Bağırsak duvarından yüzeye doğru kabaran, yuvarlak ve belirgin doku çıkıntısı.",
    },
    flat: {
      name: "Yassı polip",
      // TODO: medical review
      explanation:
        "Duvardan neredeyse hiç kabarmayan, rengi ve dokusu çevreye çok benzeyen lezyon. Fark etmesi en zor olanıdır.",
    },
    bubble: {
      name: "Hava kabarcığı",
      // TODO: medical review
      explanation: "Parlak ve şeffaf görünür; polip gibi görünebilir ama bir lezyon değildir.",
    },
    fold: {
      name: "Kıvrım gölgesi",
      // TODO: medical review
      explanation: "Bağırsak kıvrımlarının oluşturduğu koyu, kavisli gölge. Lezyon değildir.",
    },
  },

  levels: [
    {
      title: "Isınma",
      oneLiner: "Yavaş akış, büyük ve net poliplere dokun.",
      intro: "Önce elini ısıt: tünel yavaş akıyor, polipler büyük ve belirgin.",
    },
    {
      title: "Gerçek hayat",
      oneLiner: "Hızlı akış. Yassı polipler, hava kabarcıkları ve kıvrım gölgeleri de var.",
      intro:
        "Gerçek bir muayeneye daha yakın: akış hızlandı, yassı polipler ortaya çıktı ve bazı şeyler polip gibi görünüyor ama değil.",
    },
    {
      title: "Yapay zeka asistanı",
      oneLiner: "Yapay zeka şüpheli yerlere kutu çizer. Ona ne kadar güvenirsin?",
      intro:
        "Bu bölümde yapay zeka sana yardım ediyor ve şüpheli gördüğü yerlere kutu çiziyor. Ama o da kusursuz değil: bazı poliplerini kaçırır, bazen de olmayan yere kutu çizer.",
    },
    {
      title: "Asistan kapandı",
      oneLiner: "Yapay zeka kapatıldı. Aynı zorluk, bu kez yardımsız.",
      intro:
        "Yapay zeka asistanı kapatıldı. Zorluk 2. bölümle aynı; kutular yok. Gözlerine güven!",
    },
  ],

  interstitial: {
    levelLabel: "Bölüm {n} / {total}",
    duration: "{seconds} sn",
    ready: "Hazırım",
    countdownGo: "Başla!",
    aiOffBanner: "Yapay zeka devre dışı",
  },

  results: {
    title: "Sonuçların",
    total: "Toplam puan",
    perLevel: "Bölüm puanları",
    best: "Mümkün olan en yüksek puan: {max}",
    detection: {
      title: "Tespit oranı",
      // TODO: medical review
      explanation:
        "Tespit oranı = yakaladığın polip sayısı / toplam polip sayısı. Gerçek kolonoskopide bunun karşılığı adenom tespit oranıdır (ADR); kolonoskopi kalitesini ölçen en önemli göstergelerden biridir.",
      caught: "{caught} / {total} polip",
    },
    comparison: {
      title: "Yapay zekadan önce ve sonra",
      line: "2. bölüm (yapay zekasız): {before} → 4. bölüm (yapay zeka kapandıktan sonra): {after}",
      deskilling:
        "Yapay zeka kapandıktan sonra tespit oranın düştü. Gerçek hayatta da benzer bir şey görüldü: Polonya'daki 4 merkezde yapılan bir çalışmada, yapay zekaya alışan hekimlerin yapay zekasız adenom tespit oranı 3 ayda %28,4'ten %22,4'e düştü (Lancet Gastroenterology & Hepatology, 2025).",
      neutral:
        "Senin oyununda yapay zeka kapandıktan sonra tespit oranın düşmedi, harika! Yine de gerçek hayatta bu risk var: Polonya'daki 4 merkezde yapılan bir çalışmada, yapay zekaya alışan hekimlerin yapay zekasız adenom tespit oranı 3 ayda %28,4'ten %22,4'e düştü (Lancet Gastroenterology & Hepatology, 2025).",
    },
    ai: {
      title: "Yapay zeka bölümünde neler oldu?",
      // Source supplied by the organisers.
      fact: "Yapay zeka destekli kolonoskopi küçük adenomları yakalamada etkili, ancak yassı (sessile serrated) lezyonlarda belirgin bir fark gösterilemedi (meta-analiz, Gastrointestinal Endoscopy, 2025).",
      boxedCaught: "Yapay zekanın kutu çizdiği poliplerin {caught} / {total} tanesini yakaladın.",
      unboxedCaught: "Kutu çizilmeyen poliplerin {caught} / {total} tanesini yakaladın.",
      unboxedWarning:
        "Kutu olmayan yer güvenli yer demek değildir: yapay zeka bazı polipleri hiç işaretlemez.",
      falseBoxes: "Yapay zeka {n} tane polip olmayan yere kutu çizdi.",
    },
    missed: {
      title: "Kaçırdıkların",
      regular: "Kaçırılan polip: {n}",
      flat: "Kaçırılan yassı polip: {n}",
      none: "Hiç polip kaçırmadın!",
      // TODO: medical review
      flatLesson:
        "Yassı lezyonlar duvardan çok az kabarır ve rengi çevreye benzer; bu yüzden hem gözle hem yapay zekayla kaçırılma olasılığı daha yüksektir.",
      // TODO: medical review
      regularLesson:
        "Belirgin polipleri kaçırmak çoğunlukla dikkat ve hızla ilgilidir: akış hızlandığında göz ayrıntıyı yakalamakta zorlanır.",
      falsePositives: "Polip olmayan {n} şeye dokundun.",
      // TODO: medical review
      costLesson:
        "Oyunda kaçırılan polip (−15), yanlış dokunuştan (−5) daha pahalı. Bu bilerek böyle: tıpta kaçırılan lezyon en pahalı hatadır; yanlış alarm ise genellikle ek bir inceleme demektir.",
    },
    share: {
      button: "Paylaş",
      saved: "Kart indirildi",
      text: "{game} oyununda {score} puan aldım! Tespit oranım: {rate}. {subtitle}.",
      cardTotal: "puan",
      cardRate: "tespit oranı",
      cardSeed: "tohum",
    },
    replay: "Tekrar oyna",
    home: "Ana sayfa",
  },
} as const;

export type Tr = typeof tr;
