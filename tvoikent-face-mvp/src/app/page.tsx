"use client";

import { useState } from "react";
import {
  emotionKeys,
  emotionLabels,
  type EmotionAnalysis,
  type EmotionName,
  type EmotionScores,
  type FaceState,
  type MuscleName,
} from "@/lib/fuzzy-core/types";
import { FaceSvg } from "@/lib/render/FaceSvg";

type ApiResponse = {
  message: string;
  analysis: EmotionAnalysis;
  face: FaceState;
};

const muscleLabels: Record<MuscleName, string> = {
  browRaise: "Подъём бровей",
  browLower: "Сведение бровей",
  singleBrowRaise: "Одна бровь вверх",
  eyeOpen: "Раскрытие глаз",
  eyeSquint: "Прищур",
  smile: "Улыбка",
  mouthDown: "Губы вниз",
  lipPress: "Сжатие губ",
  upperLipRaise: "Подъём верхней губы",
  jawDrop: "Открытие рта",
  mouthRound: "Круглый рот",
  mouthStretch: "Растянутый рот",
  asymmetry: "Асимметрия",
};

const emotionColors: Record<EmotionName, string> = {
  joy: "from-amber-300 via-yellow-300 to-orange-400",
  affection: "from-rose-300 via-pink-300 to-orange-300",
  humor: "from-lime-300 via-emerald-300 to-cyan-300",
  aggression: "from-red-400 via-orange-400 to-rose-500",
  sadness: "from-sky-300 via-blue-400 to-indigo-500",
  surprise: "from-cyan-300 via-sky-300 to-violet-400",
  confusion: "from-slate-300 via-zinc-300 to-slate-500",
  embarrassment: "from-rose-200 via-pink-300 to-orange-300",
  disgust: "from-emerald-400 via-lime-400 to-yellow-500",
  tension: "from-orange-300 via-amber-400 to-red-400",
  sarcasm: "from-fuchsia-300 via-pink-400 to-rose-500",
  fear: "from-indigo-300 via-violet-400 to-sky-500",
  contempt: "from-stone-300 via-zinc-400 to-orange-500",
  awe: "from-cyan-200 via-violet-300 to-fuchsia-300",
  curiosity: "from-teal-200 via-cyan-300 to-sky-400",
};

const presets = [
  {
    label: "Чистая злость",
    text: "Да заткнись уже, ты бесишь меня, это просто ужасно и отвратительно.",
  },
  {
    label: "Сарказм",
    text: "Ну да, конечно, гениальный план, просто блестяще всё развалил.",
  },
  {
    label: "Теплота",
    text: "Я очень тобой горжусь и правда рад, что у тебя всё получилось.",
  },
  {
    label: "Тревога",
    text: "Мне страшно, что всё сейчас пойдёт не так, я правда начинаю паниковать.",
  },
  {
    label: "Растерянность",
    text: "Что вообще происходит, почему это выглядит так странно и нелогично?",
  },
  {
    label: "Брезгливость",
    text: "Фу, это выглядит отвратительно, меня аж передёрнуло от этой мерзости.",
  },
  {
    label: "Смущение",
    text: "Ой, блин, как неловко вышло, я теперь даже не знаю куда смотреть.",
  },
  {
    label: "Вау",
    text: "Вау, это настолько красиво и неожиданно, что я аж дар речи потерял.",
  },
  {
    label: "Любопытство",
    text: "Хм, а почему оно так работает, можешь показать, что там внутри происходит?",
  },
];

const emotionCount = emotionKeys.length;
const muscleCount = Object.keys(muscleLabels).length;

function getSortedEmotionEntries(scores: EmotionScores): Array<[EmotionName, number]> {
  return emotionKeys
    .map((key) => [key, scores[key]] as [EmotionName, number])
    .sort((left, right) => right[1] - left[1]);
}

export default function HomePage() {
  const [message, setMessage] = useState(
    "Да заткнись уже, это бесит и вообще не смешно."
  );
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [face, setFace] = useState<FaceState | null>(null);
  const [rawFace, setRawFace] = useState<FaceState | null>(null);
  const [debug, setDebug] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(
    "Готово. Введи фразу, и я прогоню её через 10 экспертных оценок, centroid defuzzification и новый SVG-рендер без смешивания с прошлым запросом."
  );
  const [error, setError] = useState("");

  const topSignals = analysis ? getSortedEmotionEntries(analysis.scores).slice(0, 3) : [];

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setStatus("1/5 Отправляю текст в API-маршрут...");
    setDebug(null);

    try {
      setStatus("2/5 Mistral собирает 10 экспертных взглядов...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      setStatus("3/5 Агрегирую консенсус и разбираю JSON...");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Ошибка анализа");
      }

      const result = data as ApiResponse;

      setStatus("4/5 Перевожу эмоции в мышцы и строю лицо заново...");
      setAnalysis(result.analysis);
      setRawFace(result.face);
      setFace(result.face);
      setDebug(result);
      setStatus("5/5 Готово: консенсус экспертов → fuzzy inference → новое лицо.");
    } catch (err) {
      const text = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(text);
      setStatus(
        text.includes("AI сервер сейчас занят")
          ? "AI сервер занят другим расчётом. Подожди немного и попробуй ещё раз."
          : "Ошибка. Что-то сломалось между текстом, моделью и нечеткой логикой."
      );
      setDebug({ error: text });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-16 h-56 w-56 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-rose-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/12 bg-[rgba(8,14,28,0.78)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur xl:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_320px] xl:items-end">
            <div>
              <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100/80">
                fuzzyemotions.bostoncrew.ru
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Нормальная лаборатория эмоций вместо случайной улыбки на ярости.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Теперь пайплайн собирает 10 экспертных оценок от Mistral, агрегирует
                их в консенсус, переводит эмоции в мышцы через centroid
                defuzzification и уже потом рисует лицо.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Эксперты
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">10</div>
                <p className="mt-1 text-slate-400">Независимых оценок вместо одной догадки.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Эмоции
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">{emotionCount}</div>
                <p className="mt-1 text-slate-400">Теперь есть отдельные каналы для смущения, восторга и любопытства.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Нечеткая логика
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">COG</div>
                <p className="mt-1 text-slate-400">Плюс Elvis-бровь и более устойчивый рендер лица.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(10,17,32,0.84)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur xl:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">Пульт анализа</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Вставь фразу, где раньше система ошибалась, и сравни консенсус с лицом.
                </p>
              </div>
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                Проверка злости, сарказма, тревоги и теплоты
              </div>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-300">
              Сообщение для анализа
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-3 h-40 w-full resize-none rounded-[28px] border border-white/10 bg-slate-950/80 px-5 py-4 text-base leading-7 text-slate-50 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
              placeholder="Например: Ну да, просто великолепно, ты опять всё испортил..."
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMessage(preset.text)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || !message.trim()}
                className="rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-400 px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? "Считаю..." : "Рассчитать эмоцию"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnalysis(null);
                  setFace(null);
                  setRawFace(null);
                  setDebug(null);
                  setError("");
                  setStatus("Сбросил состояние. Можно прогонять новую фразу с чистого листа.");
                }}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10"
              >
                Сбросить
              </button>
            </div>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Статус пайплайна
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-200">{status}</p>
            </div>

            {error && (
              <div className="mt-4 rounded-[28px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                <b>Ошибка:</b> {error}
              </div>
            )}

            {analysis && (
              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Консенсус
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topSignals.map(([key, value]) => (
                      <div
                        key={key}
                        className={`rounded-full bg-gradient-to-r px-3 py-2 text-sm font-medium text-slate-950 ${emotionColors[key]}`}
                      >
                        {emotionLabels[key]} {value.toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {analysis.explanation}
                  </p>
                  {analysis.calibrationNotes.length > 0 && (
                    <p className="mt-3 text-xs leading-6 text-cyan-200/85">
                      Калибровка текста: {analysis.calibrationNotes.join(" ")}
                    </p>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Итог
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {analysis.dominant === "mixed"
                      ? "Смешанное состояние"
                      : emotionLabels[analysis.dominant]}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-rose-400"
                        style={{ width: `${analysis.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {analysis.confidence.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Учитываются 10 экспертных взглядов и степень согласия между ними.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[32px] border border-white/10 bg-[rgba(13,20,36,0.86)] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur xl:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">Сцена лица</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Здесь лучше видно, подавилась ли улыбка у злости.
                </p>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                SVG live render
              </div>
            </div>

            <div className="mt-6 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(247,178,103,0.16),_transparent_40%),rgba(2,6,14,0.92)] p-4">
              <FaceSvg face={face} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Рендер
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Каждый новый запрос теперь рисуется с нуля. Предыдущее лицо больше не
                  подмешивается, поэтому отвращение, злость и тревога не наследуют улыбку
                  от прошлой фразы.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Правила рта
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  По умолчанию рот рисуется одной чёрной линией. Для удивления, восторга и
                  любопытства рендер автоматически переключается на чёрный эллипс, если
                  реально нужен открытый рот.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[32px] border border-white/10 bg-[rgba(11,18,34,0.84)] p-5 backdrop-blur xl:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">Карта эмоций</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Итоговый консенсус по шкалам и уровень расхождения между экспертами.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {emotionCount} каналов
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {analysis ? (
                getSortedEmotionEntries(analysis.scores).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-white">{emotionLabels[key]}</span>
                      <span className="font-mono text-slate-300">
                        {value.toFixed(2)} / disagreement {analysis.disagreement[key].toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${emotionColors[key]}`}
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-400">
                  После первого запуска здесь появится карта эмоций, чтобы было видно,
                  какие сигналы реально победили в консенсусе.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[rgba(11,18,34,0.84)] p-5 backdrop-blur xl:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">Мышцы лица</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Что именно выдаёт fuzzy-core после centroid defuzzification.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {muscleCount} мышц
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {rawFace ? (
                (Object.entries(rawFace) as Array<[MuscleName, FaceState[MuscleName]]>).map(
                  ([key, control]) => (
                    <div
                      key={key}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-white">{muscleLabels[key]}</span>
                        <span className="font-mono text-slate-300">
                          power {control.power.toFixed(2)} | lcr {control.lcr.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-rose-400"
                          style={{ width: `${control.power * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-400">
                  После анализа здесь будет видно, какие мышцы активировались и насколько.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[rgba(11,18,34,0.84)] p-5 backdrop-blur xl:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">10 экспертных взглядов</h2>
              <p className="mt-1 text-sm text-slate-400">
                Сырые экспертные оценки, из которых собирается общий консенсус.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              Mistral multi-assessment
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analysis ? (
              analysis.experts.map((expert) => {
                const topExpertSignals = getSortedEmotionEntries(expert.scores).slice(0, 3);

                return (
                  <article
                    key={expert.expert}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-white">{expert.expert}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{expert.focus}</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                        {expert.confidence.toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {topExpertSignals.map(([key, value]) => (
                        <span
                          key={key}
                          className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-medium text-slate-950 ${emotionColors[key]}`}
                        >
                          {emotionLabels[key]} {value.toFixed(2)}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">{expert.explanation}</p>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-400 md:col-span-2 xl:col-span-3">
                После первого запроса здесь появятся 10 отдельных экспертных карт, и можно
                будет смотреть, где модель согласна, а где спорит сама с собой.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[rgba(11,18,34,0.84)] p-5 backdrop-blur xl:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Debug</h2>
              <p className="mt-1 text-sm text-slate-400">
                Полный JSON ответа API, если захочешь крутить правила дальше.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              raw payload
            </div>
          </div>

          <pre className="mt-5 max-h-[420px] overflow-auto rounded-[28px] border border-white/10 bg-slate-950/90 p-4 text-xs leading-6 text-emerald-200">
            {debug ? JSON.stringify(debug, null, 2) : "Пока пусто. Запусти анализ."}
          </pre>
        </section>
      </div>
    </main>
  );
}
