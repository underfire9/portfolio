/* 作品資料：新增或刪除作品只要改這個檔案。
   links: { label, href }；gallery: 點擊後開燈箱的截圖 [{ src, title }]
   cover 留空會自動用頭像色階產生封面。 */

// 舊作品的 prototype、履歷放在原 portfolio repo；網站和它們放在同一個 repo 時保持空字串即可
window.LEGACY_ROOT = window.LEGACY_ROOT || '';

window.WORKS = {
  // 「作品」：AI 模型生成的作品
  ai: [
    {
      title: 'Fireworker',
      tag: '軟體開發',
      desc: '',
      cover: '',
      links: [] // 例如 { label: 'Website', href: 'https://…' }
    },
    {
      title: 'Visual Dock',
      tag: '軟體開發',
      desc: '',
      cover: '',
      links: []
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
      desc: 'KKBOX 集團形象官網，設計、原型 prototype。此為作品集展示用的 prototype，並非 KKBOX 官方網站；頁面中 KKBOX 及投資方、合作夥伴的商標與 logo 均屬各自所有者。',
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
      title: '和多繽紛樂',
      desc: '已更名 FunSlots 繽紛樂，設計、原型 prototype',
      cover: 'img/handmade/bingo.webp',
      links: [{ label: 'Website', href: 'http://slot.miario.com/' }]
    },
    {
      title: '4Gamers',
      desc: '2006 與夥伴建立，4Gamers 前身，設計、原型 prototype、logo design',
      cover: 'img/handmade/4gamers.webp',
      gallery: [{ src: 'img/shots/4g-index.webp', title: '4Gamers 首頁' }]
    }
  ]
};
