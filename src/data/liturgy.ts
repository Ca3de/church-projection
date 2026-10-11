export interface LiturgyItem {
  id: string;
  title: string;
  shortTitle: string;
  type: 'hymn' | 'creed' | 'prayer';
  verses?: LiturgyVerse[];
  paragraphs?: string[];
}

export interface LiturgyVerse {
  number?: number;
  lines: string[];
  isRefrain?: boolean;
}

export const liturgyItems: LiturgyItem[] = [
  {
    id: 'introit',
    title: 'Introit',
    shortTitle: 'Introit',
    type: 'hymn',
    verses: [
      {
        number: 1,
        lines: [
          'Lord, speak to me, that I may speak',
          'In living echoes of Thy tone;',
          'As Thou hast sought, so let me seek',
          "Thy erring children lost and lone.",
        ],
      },
      {
        number: 2,
        lines: [
          'O lead me, Lord, that I may lead',
          'The wandering and the wavering feet;',
          'O feed me, Lord, that I may feed',
          'Thy hungering ones with manna sweet.',
        ],
      },
    ],
  },
  {
    id: 'introit-majesty',
    title: 'Majesty',
    shortTitle: 'Introit II',
    type: 'hymn',
    verses: [
      {
        number: 1,
        lines: [
          'Majesty, worship His Majesty',
          'Unto Jesus be all glory, honour and praise',
          'Majesty, kingdom authority,',
          'Flow from His throne unto His own, His anthem raise.',
        ],
      },
      {
        number: 2,
        lines: [
          'So exalt, lift up on High the name of Jesus,',
          'Magnify, come glorify, Christ Jesus the King',
          'Majesty, worship His Majesty',
          'Jesus who died, Now glorified, King of all kings.',
        ],
      },
    ],
  },
  {
    id: 'nicene-creed',
    title: 'Nicene Creed',
    shortTitle: 'Nicene',
    type: 'creed',
    paragraphs: [
      'We believe in one God, the Father, the almighty, maker of heaven and earth, of all that is, seen and unseen.',
      'We believe in one Lord, Jesus Christ, the only Son of God, eternally begotten of the Father, God from God, Light from Light, true God from true God, begotten, not made, of one being with the Father. Through him all things were made. For us men and for our salvation he came down from heaven; by the power of the Holy Spirit he became incarnate of the Virgin Mary, and was made man. For our sake he was crucified under Pontius Pilate; he suffered death and was buried.',
      'On the third day he rose again in accordance with the scriptures; he ascended into heaven and is seated at the right hand of the Father. He will come again in glory to judge the living and the dead, and his kingdom will have no end.',
      'We believe in the Holy Spirit, the Lord, the giver of life, who proceeds from the Father and the Son. With the Father and the Son he is worshipped and glorified. He has spoken through the Prophets.',
      'We believe in one holy catholic and apostolic Church. We acknowledge one baptism for the forgiveness of sins. We look for the resurrection of the dead, and the life of the world to come. Amen.',
    ],
  },
  {
    id: 'soul-of-my-saviour',
    title: 'Soul of My Saviour',
    shortTitle: 'Absolution',
    type: 'hymn',
    verses: [
      {
        number: 1,
        lines: [
          'Soul of my Saviour, sanctify my breast,',
          'Body of Christ, be thou my saving guest,',
          'Blood of my Saviour, bathe me in thy tide,',
          'Wash me with water flowing from thy side.',
        ],
      },
      {
        number: 2,
        lines: [
          'Strength and protection may thy Passion be,',
          'O blessed Jesus, hear and answer me;',
          'Deep in thy wounds, Lord, hide and shelter me,',
          'So shall I never, never part from thee.',
        ],
      },
      {
        number: 3,
        lines: [
          'Guard and defend me from the foe malign,',
          "In death's dread moments make me only thine;",
          'Call me and bid me come to thee on high',
          'Where I may praise thee with thy saints for ay.',
        ],
      },
    ],
  },
  {
    id: 'absolution-o-god-of-bethel',
    title: 'O God of Bethel',
    shortTitle: 'Absolution II',
    type: 'hymn',
    verses: [
      {
        number: 1,
        lines: [
          'O God of Bethel, by whose hand',
          'thy people still are fed,',
          'who through this weary pilgrimage',
          'hast all our fathers led;',
        ],
      },
      {
        number: 2,
        lines: [
          'Our vows, our prayers, we now present',
          'before thy throne of grace;',
          'God of our fathers, be the God',
          'of their succeeding race.',
        ],
      },
      {
        number: 3,
        lines: [
          'Through each perplexing path of life',
          'our wandering footsteps guide;',
          'give us each day our daily bread',
          'and raiment fit provide.',
        ],
      },
      {
        number: 4,
        lines: [
          'O spread thy covering wings around',
          'till all our wanderings cease,',
          "and at our Father's loved abode",
          'our souls arrive in peace. Amen',
        ],
      },
    ],
  },
  {
    id: 'apostles-creed',
    title: "Apostles' Creed",
    shortTitle: 'Apostles',
    type: 'creed',
    paragraphs: [
      'I believe in God, the Father almighty, creator of heaven and earth.',
      'I believe in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit and born of the virgin Mary. He suffered under Pontius Pilate, was crucified, died, and was buried; he descended to hell. The third day he rose again from the dead. He ascended to heaven and is seated at the right hand of God the Father almighty. From there he will come to judge the living and the dead.',
      'I believe in the Holy Spirit, the holy catholic church, the communion of saints, the forgiveness of sins, the resurrection of the body, and the life everlasting. Amen.',
    ],
  },
];

export function getLiturgyById(id: string): LiturgyItem | undefined {
  return liturgyItems.find((item) => item.id === id);
}
