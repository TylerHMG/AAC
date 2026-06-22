import type { Tile, WordCategory } from '../types/module';
import type { WindowPreset } from '../types/windowLibrary';
import { coreVocab } from './coreVocab';

// Builtin window catalogue (the "Premade" section). Data-driven so it can grow.
// The topic grids emulate the category pages that mainstream symbol AAC apps ship
// (Proloquo2Go/Crescendo, TouchChat WordPower, Snap Core First, Grid 3 Super
// Core, LAMP): People, Actions, Describing, Places, Food, Feelings, Body,
// Animals, Play, Clothes, Colours, Numbers, Greetings, Questions, Self-care,
// School. Each grid carries its own tiles; AI/prediction carry only config.

let seq = 0;
function t(label: string, spokenText: string, symbolKeyword: string, category: WordCategory): Tile {
  seq += 1;
  return { id: `b.${seq}`, label, spokenText, symbolKeyword, category };
}

const PEOPLE: Tile[] = [
  t('I', 'I', 'i', 'pronoun'),
  t('you', 'you', 'you', 'pronoun'),
  t('mom', 'mom', 'mother', 'pronoun'),
  t('dad', 'dad', 'father', 'pronoun'),
  t('baby', 'baby', 'baby', 'pronoun'),
  t('boy', 'boy', 'boy', 'pronoun'),
  t('girl', 'girl', 'girl', 'pronoun'),
  t('friend', 'friend', 'friend', 'pronoun'),
  t('teacher', 'teacher', 'teacher', 'pronoun'),
  t('family', 'family', 'family', 'pronoun'),
];

const ACTIONS: Tile[] = [
  t('want', 'want', 'want', 'verb'),
  t('go', 'go', 'go', 'verb'),
  t('eat', 'eat', 'eat', 'verb'),
  t('drink', 'drink', 'drink', 'verb'),
  t('play', 'play', 'play', 'verb'),
  t('help', 'help', 'help', 'verb'),
  t('look', 'look', 'look', 'verb'),
  t('open', 'open', 'open', 'verb'),
  t('give', 'give', 'give', 'verb'),
  t('sit', 'sit', 'sit', 'verb'),
  t('sleep', 'sleep', 'sleep', 'verb'),
  t('wash', 'wash', 'wash', 'verb'),
];

const DESCRIBING: Tile[] = [
  t('big', 'big', 'big', 'describing'),
  t('little', 'little', 'little', 'describing'),
  t('hot', 'hot', 'hot', 'describing'),
  t('cold', 'cold', 'cold', 'describing'),
  t('fast', 'fast', 'fast', 'describing'),
  t('slow', 'slow', 'slow', 'describing'),
  t('happy', 'happy', 'happy', 'describing'),
  t('sad', 'sad', 'sad', 'describing'),
  t('good', 'good', 'good', 'describing'),
  t('loud', 'loud', 'loud', 'describing'),
  t('clean', 'clean', 'clean', 'describing'),
  t('new', 'new', 'new', 'describing'),
];

const PLACES: Tile[] = [
  t('home', 'home', 'home', 'place'),
  t('school', 'school', 'school', 'place'),
  t('park', 'park', 'park', 'place'),
  t('store', 'store', 'shop', 'place'),
  t('outside', 'outside', 'outside', 'place'),
  t('bathroom', 'bathroom', 'bathroom', 'place'),
  t('kitchen', 'kitchen', 'kitchen', 'place'),
  t('bedroom', 'bedroom', 'bedroom', 'place'),
  t('car', 'car', 'car', 'place'),
  t('playground', 'playground', 'playground', 'place'),
];

const FOOD: Tile[] = [
  t('eat', 'eat', 'eat', 'verb'),
  t('drink', 'drink', 'drink', 'verb'),
  t('water', 'water', 'water', 'noun'),
  t('juice', 'juice', 'juice', 'noun'),
  t('milk', 'milk', 'milk', 'noun'),
  t('snack', 'snack', 'snack', 'noun'),
  t('apple', 'apple', 'apple', 'noun'),
  t('cookie', 'cookie', 'cookie', 'noun'),
  t('more', 'more', 'more', 'describing'),
  t('hungry', 'I am hungry', 'hungry', 'describing'),
  t('done', 'all done', 'finished', 'social'),
];

const FEELINGS: Tile[] = [
  t('happy', 'I am happy', 'happy', 'describing'),
  t('sad', 'I am sad', 'sad', 'describing'),
  t('angry', 'I am angry', 'angry', 'describing'),
  t('scared', 'I am scared', 'scared', 'describing'),
  t('tired', 'I am tired', 'tired', 'describing'),
  t('hurt', 'I am hurt', 'hurt', 'describing'),
  t('sick', 'I feel sick', 'sick', 'describing'),
  t('excited', 'I am excited', 'excited', 'describing'),
  t('silly', 'I feel silly', 'silly', 'describing'),
  t('calm', 'I am calm', 'calm', 'describing'),
];

const BODY: Tile[] = [
  t('head', 'head', 'head', 'noun'),
  t('hair', 'hair', 'hair', 'noun'),
  t('eye', 'eye', 'eye', 'noun'),
  t('ear', 'ear', 'ear', 'noun'),
  t('nose', 'nose', 'nose', 'noun'),
  t('mouth', 'mouth', 'mouth', 'noun'),
  t('hand', 'hand', 'hand', 'noun'),
  t('arm', 'arm', 'arm', 'noun'),
  t('leg', 'leg', 'leg', 'noun'),
  t('foot', 'foot', 'foot', 'noun'),
  t('tummy', 'tummy', 'stomach', 'noun'),
  t('teeth', 'teeth', 'teeth', 'noun'),
];

const ANIMALS: Tile[] = [
  t('dog', 'dog', 'dog', 'noun'),
  t('cat', 'cat', 'cat', 'noun'),
  t('bird', 'bird', 'bird', 'noun'),
  t('fish', 'fish', 'fish', 'noun'),
  t('cow', 'cow', 'cow', 'noun'),
  t('horse', 'horse', 'horse', 'noun'),
  t('pig', 'pig', 'pig', 'noun'),
  t('duck', 'duck', 'duck', 'noun'),
  t('rabbit', 'rabbit', 'rabbit', 'noun'),
  t('bear', 'bear', 'bear', 'noun'),
  t('lion', 'lion', 'lion', 'noun'),
  t('elephant', 'elephant', 'elephant', 'noun'),
];

const PLAY: Tile[] = [
  t('ball', 'ball', 'ball', 'noun'),
  t('blocks', 'blocks', 'blocks', 'noun'),
  t('doll', 'doll', 'doll', 'noun'),
  t('car', 'car', 'car', 'noun'),
  t('puzzle', 'puzzle', 'puzzle', 'noun'),
  t('bubbles', 'bubbles', 'bubbles', 'noun'),
  t('book', 'book', 'book', 'noun'),
  t('game', 'game', 'game', 'noun'),
  t('swing', 'swing', 'swing', 'noun'),
  t('slide', 'slide', 'slide', 'noun'),
  t('bike', 'bike', 'bicycle', 'noun'),
  t('crayons', 'crayons', 'crayons', 'noun'),
];

const CLOTHES: Tile[] = [
  t('shirt', 'shirt', 'shirt', 'noun'),
  t('pants', 'pants', 'trousers', 'noun'),
  t('shoes', 'shoes', 'shoes', 'noun'),
  t('socks', 'socks', 'socks', 'noun'),
  t('coat', 'coat', 'coat', 'noun'),
  t('hat', 'hat', 'hat', 'noun'),
  t('dress', 'dress', 'dress', 'noun'),
  t('jacket', 'jacket', 'jacket', 'noun'),
  t('gloves', 'gloves', 'gloves', 'noun'),
  t('pajamas', 'pajamas', 'pyjamas', 'noun'),
];

const COLOURS: Tile[] = [
  t('red', 'red', 'red', 'describing'),
  t('blue', 'blue', 'blue', 'describing'),
  t('green', 'green', 'green', 'describing'),
  t('yellow', 'yellow', 'yellow', 'describing'),
  t('orange', 'orange', 'orange', 'describing'),
  t('purple', 'purple', 'purple', 'describing'),
  t('pink', 'pink', 'pink', 'describing'),
  t('black', 'black', 'black', 'describing'),
  t('white', 'white', 'white', 'describing'),
  t('brown', 'brown', 'brown', 'describing'),
];

const NUMBERS: Tile[] = [
  t('one', 'one', 'one', 'describing'),
  t('two', 'two', 'two', 'describing'),
  t('three', 'three', 'three', 'describing'),
  t('four', 'four', 'four', 'describing'),
  t('five', 'five', 'five', 'describing'),
  t('six', 'six', 'six', 'describing'),
  t('seven', 'seven', 'seven', 'describing'),
  t('eight', 'eight', 'eight', 'describing'),
  t('nine', 'nine', 'nine', 'describing'),
  t('ten', 'ten', 'ten', 'describing'),
];

const GREETINGS: Tile[] = [
  t('hi', 'hi', 'hello', 'social'),
  t('bye', 'bye', 'goodbye', 'social'),
  t('please', 'please', 'please', 'social'),
  t('thank you', 'thank you', 'thanks', 'social'),
  t('sorry', 'sorry', 'sorry', 'social'),
  t('yes', 'yes', 'yes', 'social'),
  t('no', 'no', 'no', 'social'),
  t('good morning', 'good morning', 'morning', 'social'),
  t('good night', 'good night', 'night', 'social'),
  t('my turn', "it's my turn", 'turn', 'social'),
];

const QUESTIONS: Tile[] = [
  t('what', 'what', 'question', 'social'),
  t('where', 'where', 'where', 'social'),
  t('who', 'who', 'who', 'social'),
  t('when', 'when', 'when', 'social'),
  t('why', 'why', 'why', 'social'),
  t('how', 'how', 'how', 'social'),
  t('which', 'which', 'which', 'social'),
];

const SELFCARE: Tile[] = [
  t('toilet', 'I need the toilet', 'toilet', 'noun'),
  t('wash hands', 'wash hands', 'wash', 'verb'),
  t('soap', 'soap', 'soap', 'noun'),
  t('towel', 'towel', 'towel', 'noun'),
  t('brush teeth', 'brush my teeth', 'toothbrush', 'verb'),
  t('potty', 'potty', 'potty', 'noun'),
  t('flush', 'flush', 'flush', 'verb'),
  t('all done', 'all done', 'finished', 'social'),
];

const SCHOOL: Tile[] = [
  t('teacher', 'teacher', 'teacher', 'pronoun'),
  t('book', 'book', 'book', 'noun'),
  t('pencil', 'pencil', 'pencil', 'noun'),
  t('paper', 'paper', 'paper', 'noun'),
  t('desk', 'desk', 'desk', 'noun'),
  t('computer', 'computer', 'computer', 'noun'),
  t('lunch', 'lunch', 'lunch', 'noun'),
  t('backpack', 'backpack', 'backpack', 'noun'),
  t('scissors', 'scissors', 'scissors', 'noun'),
  t('glue', 'glue', 'glue', 'noun'),
];

const QUICK_PHRASES: Tile[] = [
  t('I want', 'I want', 'want', 'verb'),
  t('help me', 'help me please', 'help', 'verb'),
  t('my turn', "it's my turn", 'turn', 'social'),
  t('stop', 'stop please', 'stop', 'verb'),
  t('all done', 'all done', 'finished', 'social'),
  t('thank you', 'thank you', 'thanks', 'social'),
  t("I don't like that", "I don't like that", 'no', 'social'),
  t("let's go", "let's go", 'go', 'verb'),
];

function gridPreset(id: string, name: string, hint: string, tiles: Tile[]): WindowPreset {
  return { id, name, source: 'builtin', type: 'grid', hint, tiles };
}

export const BUILTIN_PRESETS: WindowPreset[] = [
  gridPreset('builtin.coreWords', 'Core words', 'General high-frequency words', coreVocab.map((tile) => ({ ...tile }))),
  { id: 'builtin.blankGrid', name: 'Blank grid', source: 'builtin', type: 'grid', hint: 'Empty grid to fill yourself', tiles: [] },
  gridPreset('builtin.people', 'People', 'Family, friends, who', PEOPLE),
  gridPreset('builtin.actions', 'Actions', 'Things to do', ACTIONS),
  gridPreset('builtin.describing', 'Describing words', 'How things are', DESCRIBING),
  gridPreset('builtin.places', 'Places', 'Where to go', PLACES),
  gridPreset('builtin.food', 'Food & drink', 'Snacks, meals, drinks', FOOD),
  gridPreset('builtin.feelings', 'Feelings', 'How I feel', FEELINGS),
  gridPreset('builtin.body', 'Body parts', 'Point to where it is', BODY),
  gridPreset('builtin.animals', 'Animals', 'Pets and wild animals', ANIMALS),
  gridPreset('builtin.play', 'Play & toys', 'Toys and games', PLAY),
  gridPreset('builtin.clothes', 'Clothes', 'Getting dressed', CLOTHES),
  gridPreset('builtin.colours', 'Colours', 'Colour words', COLOURS),
  gridPreset('builtin.numbers', 'Numbers', 'Counting 1–10', NUMBERS),
  gridPreset('builtin.greetings', 'Greetings & social', 'Hello, please, thank you', GREETINGS),
  gridPreset('builtin.questions', 'Questions', 'Asking words', QUESTIONS),
  gridPreset('builtin.selfcare', 'Self-care', 'Bathroom and washing', SELFCARE),
  gridPreset('builtin.school', 'School', 'Classroom words', SCHOOL),
  gridPreset('builtin.quickPhrases', 'Quick phrases', 'Whole phrases in one tap', QUICK_PHRASES),
  {
    id: 'builtin.aiWords',
    name: 'AI words',
    source: 'builtin',
    type: 'aiGrid',
    hint: 'Suggestions for a situation',
    config: { aiCount: 9 },
  },
  {
    id: 'builtin.prediction',
    name: 'Word prediction',
    source: 'builtin',
    type: 'autocomplete',
    hint: 'Likely next words',
    config: { predictCount: 10 },
  },
];
