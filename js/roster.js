// ============================================================
//  DEAD MAN'S HAND — the saloon regulars (looks + AI personality)
//  t = tight (folds more), a = aggressive, b = bluff chance
// ============================================================
'use strict';

const ROSTER = [
  { name: 'Whiskey Pete',     t: 0.30, a: 0.70, b: 0.16,
    skin: '#e8a77c', hat: 'cowboy', hatC: '#7a4a24', hair: '#5a3a1e', face: 'stubble', nose: 'red',
    coat: '#6b3b2a', shirt: '#d8c79a', neck: 'none', smoke: 'cigar', build: 'normal', extra: 'drunk' },
  { name: 'Mustache Bill',    t: 0.50, a: 0.55, b: 0.08,
    skin: '#f0b98e', hat: 'cowboy', hatC: '#efe6cf', hair: '#2b1d12', face: 'handlebar', nose: 'big',
    coat: '#3d5a80', shirt: '#f2efe6', neck: 'bowtie', smoke: 'cigar', build: 'normal', vest: '#8c2f2f' },
  { name: 'One-Eyed Jack',    t: 0.35, a: 0.80, b: 0.20,
    skin: '#d9976b', hat: 'cowboy', hatC: '#1f1a17', hair: '#111', face: 'stubble', nose: 'normal',
    coat: '#2d2d34', shirt: '#9b2d2d', neck: 'bandana', smoke: 'toothpick', build: 'normal', eye: 'patch', extra: 'scar' },
  { name: 'Cactus Kate',      t: 0.45, a: 0.60, b: 0.18,
    skin: '#f6c9a6', hat: 'feather', hatC: '#6d2a6e', hair: '#c4421a', face: 'lady', nose: 'small',
    coat: '#7d2b7e', shirt: '#f2d0e0', neck: 'pearls', smoke: 'holder', build: 'lady' },
  { name: 'Old Gus',          t: 0.70, a: 0.35, b: 0.05,
    skin: '#e3a985', hat: 'floppy', hatC: '#6e5a3e', hair: '#e8e8e8', face: 'longbeard', nose: 'big',
    coat: '#5d6b3a', shirt: '#b0884f', neck: 'none', smoke: 'pipe', build: 'normal', extra: 'goldtooth' },
  { name: 'Mortimer Grimm',   t: 0.80, a: 0.40, b: 0.04,
    skin: '#d8d4c8', hat: 'tophat', hatC: '#141414', hair: '#222', face: 'none', nose: 'long',
    coat: '#1b1b1f', shirt: '#e8e8e8', neck: 'tie', smoke: null, build: 'thin', eye: 'sad' },
  { name: 'Slim Jim',         t: 0.25, a: 0.30, b: 0.06,
    skin: '#f3c19b', hat: 'bigcowboy', hatC: '#c08a3e', hair: '#e0b040', face: 'freckles', nose: 'small',
    coat: '#4f7a4a', shirt: '#e6dcc0', neck: 'bandana', smoke: 'straw', build: 'thin' },
  { name: 'Big Hank',         t: 0.60, a: 0.75, b: 0.08,
    skin: '#f0a98a', hat: 'bowler', hatC: '#2b2b2b', hair: '#6b4a2a', face: 'mutton', nose: 'big',
    coat: '#3a3a52', shirt: '#f2efe6', neck: 'tie', smoke: 'cigar', build: 'fat', eye: 'monocle', vest: '#b38b2e' },
  { name: 'Rattlesnake Ruth', t: 0.55, a: 0.50, b: 0.14,
    skin: '#efc4a6', hat: 'bun', hatC: '#bdbdbd', hair: '#bdbdbd', face: 'granny', nose: 'small',
    coat: '#5a3d5c', shirt: '#e8dcc8', neck: 'shawl', smoke: 'pipe', build: 'lady', eye: 'glasses' },
  { name: 'Lefty Lou',        t: 0.30, a: 0.70, b: 0.15,
    skin: '#d39a72', hat: 'flat', hatC: '#141414', hair: '#141414', face: 'pencil', nose: 'normal',
    coat: '#202024', shirt: '#f2efe6', neck: 'bowtie', smoke: 'cig', build: 'thin', vest: '#a12a2a' },
  { name: 'Dusty Dan',        t: 0.40, a: 0.45, b: 0.10,
    skin: '#d79d77', hat: 'furcap', hatC: '#7a5230', hair: '#6b4426', face: 'beard', nose: 'big',
    coat: '#7d5b3a', shirt: '#a0784a', neck: 'none', smoke: null, build: 'fat', extra: 'dirty' },
  { name: 'Sheriff Buck',     t: 0.65, a: 0.50, b: 0.06,
    skin: '#e6ad84', hat: 'cowboy', hatC: '#8f8a80', hair: '#8a8a8a', face: 'mustache', nose: 'normal',
    coat: '#7a5a3a', shirt: '#cfc2a0', neck: 'bandana', smoke: 'chew', build: 'normal', extra: 'badge' }
];
