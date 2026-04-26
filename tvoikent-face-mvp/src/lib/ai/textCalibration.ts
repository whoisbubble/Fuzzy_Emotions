import {
  createEmptyEmotionScores,
  type EmotionName,
  type EmotionScores,
} from "@/lib/fuzzy-core/types";
import { clamp01 } from "@/lib/fuzzy-core/membership";

type CalibrationResult = {
  scores: EmotionScores;
  notes: string[];
};

type PatternMap = Record<EmotionName, RegExp[]>;

const emotionPatterns: PatternMap = {
  joy: [
    /\bура\b/u,
    /счастлив/u,
    /\bрад(а|ы)?\b/u,
    /классн/u,
    /круто/u,
    /супер/u,
    /здорово/u,
    /приятно/u,
  ],
  affection: [
    /люблю/u,
    /обожаю/u,
    /ценю/u,
    /дорог/u,
    /родн/u,
    /мил(ый|ая|ые|ое)/u,
    /дружище/u,
    /\bбро\b/u,
    /братан/u,
    /солнышк/u,
    /сердечк/u,
  ],
  humor: [
    /аха+|хаха+/u,
    /\bлол\b/u,
    /\bржу\b/u,
    /смешно/u,
    /шутк/u,
    /\bкек\b/u,
  ],
  aggression: [
    /заткнись/u,
    /бес(ишь|ит)/u,
    /ненавиж/u,
    /идиот/u,
    /туп(ой|ая|ые|ица)/u,
    /сволоч/u,
    /ублюд/u,
    /раздраж/u,
    /бляд|блять/u,
    /fuck|shit/i,
  ],
  sadness: [
    /груст/u,
    /печаль/u,
    /тоск/u,
    /плач/u,
    /\bжаль\b/u,
    /одинок/u,
    /подавлен/u,
  ],
  surprise: [
    /ничего себе/u,
    /\bвау\b/u,
    /\bого\b/u,
    /офигеть/u,
    /обалдеть/u,
    /вот это да/u,
    /не может быть/u,
  ],
  confusion: [
    /не понимаю/u,
    /что происходит/u,
    /что вообще/u,
    /странно/u,
    /нелогично/u,
    /непонятно/u,
    /запутан/u,
    /\bwtf\b/i,
    /\?\?\?+/,
  ],
  embarrassment: [
    /неловк/u,
    /смущ/u,
    /стыдно/u,
    /\bой\b/u,
    /\bблин\b/u,
    /извин(и|ите)/u,
    /awkward/i,
  ],
  disgust: [
    /\bфу\b/u,
    /мерзк/u,
    /отврат/u,
    /брезг/u,
    /тошнит/u,
    /гадость/u,
    /омерз/u,
  ],
  tension: [
    /напряж/u,
    /тревож/u,
    /нервнич/u,
    /стресс/u,
    /пережива/u,
    /конфликт/u,
    /не по себе/u,
  ],
  sarcasm: [
    /ну да[,]?\s*конечно/u,
    /ага[,]?\s*конечно/u,
    /гениальн/u,
    /блестяще/u,
    /спасибо огромное/u,
    /как же .*прекрасно/u,
    /сарказм/u,
  ],
  fear: [
    /страш/u,
    /боюсь/u,
    /паник/u,
    /опасаюсь/u,
    /ужас/u,
  ],
  contempt: [
    /жалк/u,
    /ничтож/u,
    /презира/u,
    /убог/u,
    /никчем/u,
    /смешон/u,
  ],
  awe: [
    /восхит/u,
    /потряса/u,
    /невероят/u,
    /волшеб/u,
    /изумит/u,
    /завораж/u,
    /божествен/u,
  ],
  curiosity: [
    /интересно/u,
    /любопыт/u,
    /почему/u,
    /как это/u,
    /\bхм\b/u,
    /\bхмм+\b/u,
    /покажи/u,
    /объясни/u,
    /что если/u,
  ],
};

function normalizeMessage(message: string): string {
  return message.toLowerCase().replaceAll("ё", "е");
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function raiseFloor(scores: EmotionScores, emotion: EmotionName, floor: number) {
  scores[emotion] = Math.max(scores[emotion], clamp01(floor));
}

function capScore(scores: EmotionScores, emotion: EmotionName, cap: number) {
  scores[emotion] = Math.min(scores[emotion], clamp01(cap));
}

function addNote(notes: string[], note: string) {
  if (!notes.includes(note)) {
    notes.push(note);
  }
}

export function calibrateEmotionScores(
  message: string,
  baseScores: EmotionScores
): CalibrationResult {
  const text = normalizeMessage(message);
  const scores = { ...baseScores };
  const notes: string[] = [];
  const counts = createEmptyEmotionScores();

  (Object.keys(emotionPatterns) as EmotionName[]).forEach((emotion) => {
    counts[emotion] = countMatches(text, emotionPatterns[emotion]);
  });

  const questionMarks = (message.match(/\?/g) ?? []).length;
  const exclamations = (message.match(/!/g) ?? []).length;
  const hasPositiveEmoticon =
    /(:\)|;\)|=\)|:d|xd|😊|😄|🙂|☺|❤|❤️|<3)/i.test(message);
  const hasNegativeEmoticon = /(:\(|😭|😢|☹|🙁)/i.test(message);
  const warmDirectAddress =
    /(люблю|обожаю|ценю|горжусь|рад(а|ы)?).*(тебя|тобой|дружище|бро|друг|братан)/u.test(text);
  const ownershipChallenge =
    /(украл|украду|забрал|отнял|стащил).*(тво(ю|й|е|и)|лучш)/u.test(text) ||
    /(тво(ю|й|е|и)|лучш).*(украл|украду|забрал|отнял|стащил)/u.test(text);
  const revengePrompt = /отомст(и|ить|им|ите|я)|мсти/u.test(text);
  const tauntingChallenge =
    /(ну же|давай|попробуй|осмелься|слабо)/u.test(text) &&
    /(отомст|ударь|напади|ответь|догоняй|верни)/u.test(text);
  const provokesConflict = tauntingChallenge || (ownershipChallenge && revengePrompt);
  const obviousAggression = counts.aggression > 0 || counts.contempt > 1 || provokesConflict;
  const obviousDisgust = counts.disgust > 0;
  const obviousFear = counts.fear > 0;
  const obviousSadness = counts.sadness > 0;
  const obviousSarcasm = counts.sarcasm > 0;
  const obviousContempt = counts.contempt > 0;
  const obviousWonder = counts.surprise > 0 || counts.awe > 0;
  const obviousConfusion = counts.confusion > 0;
  const obviousEmbarrassment = counts.embarrassment > 0;
  const obviousCuriosity = counts.curiosity > 0 || (questionMarks > 0 && !obviousAggression);
  const playfulPositiveTone =
    (counts.joy > 0 || hasPositiveEmoticon || counts.humor > 0) &&
    !obviousAggression &&
    !obviousDisgust &&
    !obviousSarcasm &&
    !obviousContempt;
  const obviousWarmth =
    warmDirectAddress ||
    ((counts.affection > 0 || counts.joy > 0) &&
      !obviousAggression &&
      !obviousDisgust &&
      !obviousSarcasm &&
      !obviousContempt) ||
    playfulPositiveTone;

  if (obviousWarmth) {
    raiseFloor(scores, "affection", warmDirectAddress ? 0.78 : 0.62 + counts.affection * 0.08);
    raiseFloor(
      scores,
      "joy",
      hasPositiveEmoticon ? 0.54 : counts.joy > 0 ? 0.46 : 0.34
    );
    raiseFloor(scores, "humor", hasPositiveEmoticon ? 0.08 : scores.humor);
    capScore(scores, "aggression", 0.14);
    capScore(scores, "disgust", 0.12);
    capScore(scores, "contempt", 0.12);
    capScore(scores, "tension", 0.24);

    if (!obviousWonder) {
      capScore(scores, "surprise", 0.16);
      capScore(scores, "awe", 0.22);
    }

    if (!obviousConfusion && !obviousCuriosity && !obviousEmbarrassment) {
      capScore(scores, "confusion", 0.18);
      capScore(scores, "curiosity", 0.18);
      capScore(scores, "embarrassment", 0.14);
    }

    addNote(notes, "Обнаружены явные маркеры теплоты и дружелюбия.");
  }

  if (counts.humor > 0) {
    raiseFloor(scores, "humor", 0.36 + Math.min(counts.humor, 2) * 0.12);
    if (!obviousSarcasm && !obviousContempt) {
      raiseFloor(scores, "joy", 0.28);
    }
    addNote(notes, "В тексте есть явные сигналы шутки или смеха.");
  }

  if (obviousAggression) {
    raiseFloor(
      scores,
      "aggression",
      provokesConflict ? 0.62 + Math.min(counts.aggression, 2) * 0.08 : 0.68 + Math.min(counts.aggression, 2) * 0.1
    );
    raiseFloor(scores, "tension", provokesConflict ? 0.6 : 0.58);
    capScore(scores, "affection", 0.18);
    capScore(scores, "joy", 0.2);
    if (!obviousSarcasm) {
      capScore(scores, "humor", 0.18);
    }
    addNote(notes, "Текст содержит прямые сигналы агрессии или нападения.");
  }

  if (provokesConflict) {
    raiseFloor(scores, "aggression", 0.64);
    raiseFloor(scores, "tension", 0.6);
    raiseFloor(scores, "contempt", 0.22);
    capScore(scores, "affection", 0.14);
    capScore(scores, "joy", 0.16);
    addNote(notes, "Есть явная провокация, подначивание или вызов на конфликт.");
  }

  if (obviousDisgust) {
    raiseFloor(scores, "disgust", 0.68 + Math.min(counts.disgust, 2) * 0.1);
    capScore(scores, "joy", 0.18);
    capScore(scores, "affection", 0.16);
    addNote(notes, "Есть явные маркеры брезгливости или отвращения.");
  }

  if (obviousFear) {
    raiseFloor(scores, "fear", 0.64 + Math.min(counts.fear, 2) * 0.08);
    raiseFloor(scores, "tension", 0.56);
    capScore(scores, "joy", 0.18);
    addNote(notes, "Обнаружены слова страха или паники.");
  }

  if (obviousSadness) {
    raiseFloor(scores, "sadness", 0.58 + Math.min(counts.sadness, 2) * 0.08);
    capScore(scores, "joy", 0.18);
    addNote(notes, "Есть явные маркеры печали или подавленности.");
  }

  if (obviousWonder) {
    if (counts.awe > 0) {
      raiseFloor(scores, "awe", 0.6 + Math.min(counts.awe, 2) * 0.08);
      raiseFloor(scores, "surprise", 0.42);
      addNote(notes, "В тексте есть сигналы восторга или восхищённого удивления.");
    } else {
      raiseFloor(scores, "surprise", 0.58 + Math.min(counts.surprise, 2) * 0.08);
      addNote(notes, "Есть явные маркеры удивления.");
    }
  } else if (exclamations === 0 && obviousWarmth) {
    capScore(scores, "surprise", 0.14);
  }

  if (obviousConfusion) {
    raiseFloor(scores, "confusion", 0.56 + Math.min(counts.confusion, 2) * 0.08);
    if (questionMarks > 0) {
      raiseFloor(scores, "curiosity", 0.22);
    }
    addNote(notes, "Обнаружены маркеры растерянности или непонимания.");
  }

  if (obviousEmbarrassment) {
    raiseFloor(scores, "embarrassment", 0.6 + Math.min(counts.embarrassment, 2) * 0.08);
    raiseFloor(scores, "tension", 0.24);
    addNote(notes, "Есть сигналы неловкости или смущения.");
  }

  if (obviousCuriosity) {
    raiseFloor(scores, "curiosity", counts.curiosity > 0 ? 0.56 : 0.34 + Math.min(questionMarks, 2) * 0.05);
    if (questionMarks > 1 && !obviousWarmth && !obviousAggression) {
      raiseFloor(scores, "confusion", 0.28);
    }
    addNote(notes, "В тексте есть маркеры интереса или вопросительного поиска.");
  }

  if (obviousSarcasm) {
    raiseFloor(scores, "sarcasm", 0.66 + Math.min(counts.sarcasm, 2) * 0.08);
    raiseFloor(scores, "contempt", 0.3);
    capScore(scores, "affection", 0.24);
    capScore(scores, "joy", 0.26);
    addNote(notes, "Есть явные маркеры сарказма.");
  }

  if (counts.contempt > 0 && !obviousWarmth) {
    raiseFloor(scores, "contempt", 0.54 + Math.min(counts.contempt, 2) * 0.08);
    capScore(scores, "affection", 0.18);
    capScore(scores, "joy", 0.24);
    addNote(notes, "Есть сигналы презрения или уничижительного превосходства.");
  }

  if ((obviousSarcasm || obviousContempt) && !warmDirectAddress) {
    capScore(scores, "affection", 0.26);
    if (!hasPositiveEmoticon) {
      capScore(scores, "joy", 0.28);
    }
  }

  if (hasNegativeEmoticon && !obviousWarmth) {
    raiseFloor(scores, "sadness", 0.32);
  }

  (Object.keys(scores) as EmotionName[]).forEach((emotion) => {
    scores[emotion] = clamp01(scores[emotion]);
  });

  return {
    scores,
    notes: notes.slice(0, 4),
  };
}
