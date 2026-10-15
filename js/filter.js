// ============================================================
//  DEAD MAN'S HAND — name filter (no rude names in the saloon)
// ============================================================
'use strict';

const NameFilter = (() => {
  // checked anywhere inside the name
  const ANY = [
    // Hungarian
    'fasz', 'pina', 'punci', 'picsa', 'kurv', 'geci', 'buzi', 'basz', 'bassz', 'baszd', 'segg', 'anyad', 'anyjat',
    'kocsog', 'csicska', 'ribanc', 'lotyo', 'szopo', 'szopj', 'szopd', 'kuki', 'fityma', 'here', 'csocs', 'hugy',
    'nyomorek', 'retkes', 'fos',
    // English
    'fuck', 'fuk', 'shit', 'cunt', 'dick', 'pussy', 'bitch', 'whore', 'slut', 'nigg', 'nigga', 'fagg', 'retard',
    'asshole', 'bastard', 'penis', 'vagina', 'porn', 'wank', 'jerkoff', 'dildo', 'boob', 'twat', 'prick', 'bollock',
    'hitler', 'nazi', 'rape'
  ];
  // only as a whole word (they appear inside normal words too)
  const WORD = ['szar', 'ass', 'cock', 'fag', 'tit', 'tits', 'cum', 'sex', 'anal', 'nig', 'hoe', 'kur'];
  // a few innocent words that contain a blocked piece
  const ALLOW = ['here', 'hereford', 'sherif', 'sheriff', 'cherie', 'theresa', 'therese', 'heresy', 'fosco', 'boobie'];

  function normalize(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/0/g, 'o').replace(/1|!|\|/g, 'i').replace(/3/g, 'e').replace(/4|@/g, 'a').replace(/5|\$/g, 's').replace(/7/g, 't').replace(/8/g, 'b');
  }

  function isBad(name) {
    const n = normalize(name);
    const words = n.split(/[^a-z]+/).filter(Boolean);
    const joined = words.join('');
    const cleanWords = words.filter(w => !ALLOW.includes(w));
    // 'here' is a rude word in Hungarian only on its own
    for (const bad of ANY) {
      if (bad === 'here' || bad === 'fos') { if (cleanWords.includes(bad)) return true; continue; }
      if (cleanWords.some(w => w.includes(bad))) return true;
      // also catch "f.a.s.z" / "f a s z" style tricks
      if (joined.includes(bad) && !ALLOW.some(a => joined.includes(a))) return true;
    }
    for (const bad of WORD) if (cleanWords.includes(bad)) return true;
    return false;
  }

  return { isBad };
})();
