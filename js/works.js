/* 作品資料：新增或刪除作品只要改這個檔案。
   links: { label, href }；features: 條列重點；gallery: 點擊後開燈箱的截圖 [{ src, title }]
   cover 留空會自動用頭像色階產生封面；motion + logo 會改用動態封面（js/covers.js）。 */

// 舊作品的 prototype、履歷放在原 portfolio repo；網站和它們放在同一個 repo 時保持空字串即可
window.LEGACY_ROOT = window.LEGACY_ROOT || '';

window.WORKS = {
  // 「作品」：AI 模型生成的作品，新的放上面
  ai: [
    {
      title: 'Tron City',
      tag: 'Three.js 效果',
      date: '2026.10.23', // 日期，顯示在標題下方
      desc: 'Tron: Legacy 是非常喜歡的電影之一，Neo-Cyberpunk 風格強烈，在 Three.js 技術下很適合拿來練嘴 :)',
      cover: 'img/ai/tron-city-cover.webp',
      links: [{ label: '觀看作品', href: 'tron-city/' }] // 另開新視窗，完整版在 tron-city/index.html
    },
    {
      title: 'Cloud',
      subtitle: 'on the lake', // 標題下方的小字
      tag: 'Three.js 效果',
      date: '2026.10.21', // 日期，顯示在標題下方
      desc: '亂晃逛到 [Deep White Gallery](https://www.deepwhite-gallery.com/) 數位藝術畫廊網站，hero 超現實的畫面看了好久，原始技術是影片循環播放，想想 Three.js 應該可以做到，顧及硬體效能只做到七分但意境有了。', // [文字](網址) 會變成另開新視窗的連結
      cover: '',
      motion: 'cloud', // 封面是降低效能負擔的版本，見 js/cloud.js
      fullscreen: true, // 封面右下角的全螢幕按鈕，點了播放原始版本
      links: []
    },
    {
      title: 'Visual Dock',
      tag: '軟體開發',
      date: '2026.09.15', // 日期，顯示在標題下方
      status: '持續開發中', // 日期旁的註記，選填
      desc: 'Visual Dock 是完全個人化的 Windows 桌面應用程式，用 Electron 包裝網頁介面而成，把動態視覺畫面、應用程式啟動列和常用系統控制整合在同一個全螢幕畫面裡，完全覆蓋原生系統工具列，滿足了宅宅愛亂改桌面的慾望，取代原生系統醜怪的視窗，空檔之餘還可以看著動態視窗放鬆。',
      features: [
        '視覺舞台：可以在 CSS／JS、Three.js、影片和音樂視覺化這幾個分類之間切換畫面。目前內容可更換背景的雨窗、3D 場景、串流播放的 Aerial 空拍影片，以及 Butterchurn 和 projectM 音樂視覺化。',
        '音樂：可以連接 Spotify 播放並控制歌曲，也可以擷取系統音訊或載入本機音檔來驅動視覺化效果。',
        '工具列：可以啟動常用應用程式，複製原生系統行為，也有資料夾捷徑、VPN 開關和輸入法狀態顯示。工具列上還會顯示 Claude 或 ChatGPT 的 5 小時用量與本週用量。',
        '主題：提供 Light、Dark、Deep Dark 三種主題，可以隨時切換。'
      ],
      note: '介面構想、規劃、設計都還是人類手工，UI/UX、功能定案後再交由 Agent + Figma 執行後續。', // 條列後的補充說明
      cover: '',
      motion: 'rings', // 動態封面，見 js/covers.js
      logo: 'img/ai/visualdock-logo.svg',
      tagline: '',
      shot: '',
      gallery: [ // 有 thumb 會排成縮圖格
        { src: 'img/shots/vd-1.webp', thumb: 'img/shots/vd-1-sm.webp', title: 'Light 主題' },
        { src: 'img/shots/vd-2.webp', thumb: 'img/shots/vd-2-sm.webp', title: 'Aerial 空拍影片' },
        { src: 'img/shots/vd-3.webp', thumb: 'img/shots/vd-3-sm.webp', title: '雨窗時鐘與天氣 · Deep Dark' },
        { src: 'img/shots/vd-4.webp', thumb: 'img/shots/vd-4-sm.webp', title: 'projectM 音樂視覺化' }
      ],
      links: []
    },
    {
      title: 'Fireworker',
      tag: '軟體開發',
      date: '2026.08.20', // 日期，顯示在標題下方
      desc: '這是給設計師用的 Windows 桌面 prototype 工具，延續自 Fire.app。用 ERB 和 SCSS 寫頁面，存檔後瀏覽器預覽會自動更新，完成後輸出成靜態 HTML。',
      features: [ // 條列重點，選填
        '建立專案時，可以從空白、形象頁或後台列表範本開始',
        '內建中、英、日假文，以及假圖與常用 helper，不必準備真實內容',
        '語法或 SCSS 有錯時，直接顯示在預覽頁上',
        '預覽網址固定',
        '一鍵輸出靜態網站並壓縮成 zip',
        '提供命令列與 AGENTS.md，AI agent 也能直接建立、檢查、輸出專案'
      ],
      cover: '',
      motion: 'embers', // 動態封面，見 js/covers.js
      logo: 'img/ai/fireworker-logo.svg',
      tagline: '', // 封面上 logo 旁的一句話
      shot: '', // 封面右側的產品截圖，留空時 logo 置中
      links: [] // 例如 { label: 'Website', href: 'https://…' }
    }
  ],

  // 「手工年代」：原始網站的作品
  handmade: [
    {
      title: 'KKTIX',
      desc: 'KKTIX 售票系統，前後台介面與視覺設計、原型 prototype、圖示設計、css3 動畫、KKTIX app (v1)、印刷品',
      cover: 'img/handmade/kktix.webp',
      links: [{ label: 'Website', href: 'https://kktix.com/' }]
    },
    {
      title: 'KKBOX Inc.',
      desc: 'KKBOX 集團形象官網，設計、原型 prototype',
      note: '此為作品集展示用的 prototype，並非 KKBOX 官方網站；頁面中 KKBOX 及投資方、合作夥伴的商標與 logo 均屬各自所有者。',
      cover: 'img/handmade/kkbox-inc.webp',
      links: [{ label: 'Prototype', href: '@portfolio/kkbox-inc/index.html' }]
    },
    {
      title: 'Fire.app',
      desc: '和多開發的原型製作工具，針對 command line 苦手的設計師。主角、設計、logo、原型 prototype',
      cover: 'img/handmade/fireapp.webp',
      links: [{ label: 'Website', href: 'https://fireapp.kkbox.com/' }]
    },
    {
      title: '和多 Handlino',
      desc: '和多公司網站，架設於 tumblr，設計、原型 prototype',
      cover: 'img/handmade/handlino.webp',
      links: [{ label: 'Prototype', href: '@portfolio/handlino/index.html' }]
    },
    {
      title: 'KKBOX',
      desc: 'KKBOX 官網 (2009)，全站設計',
      cover: 'img/handmade/kkbox.webp',
      gallery: [
        { src: 'img/shots/kkbox-index.webp', title: 'KKBOX 首頁' },
        { src: 'img/shots/kkbox-channel.webp', title: '頻道' },
        { src: 'img/shots/kkbox-artist_theme.webp', title: '藝人首頁 dark theme' },
        { src: 'img/shots/kkbox-billboard.webp', title: '排行榜' },
        { src: 'img/shots/kkbox-vote.webp', title: '投票' }
      ]
    },
    {
      title: 'CHALLENGE Taiwan',
      desc: '設計、原型 prototype',
      cover: 'img/handmade/challenge-taiwan.webp',
      gallery: [
        { src: 'img/shots/ct-index.webp', title: 'CHALLENGE Taiwan 首頁' },
        { src: 'img/shots/ct-article.webp', title: '文章' },
        { src: 'img/shots/ct-mobile.webp', title: '行動裝置' }
      ]
    },
    {
      title: '4Gamers',
      desc: '2006 與夥伴建立，4Gamers 前身，設計、原型 prototype、logo design',
      cover: 'img/handmade/4gamers.webp',
      gallery: [{ src: 'img/shots/4g-index.webp', title: '4Gamers 首頁' }]
    }
  ]
};
