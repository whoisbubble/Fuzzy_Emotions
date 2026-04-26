"use client";

import { useState } from "react";
import type { EmotionAnalysis, FaceState, MuscleName } from "@/lib/fuzzy-core/types";
import { FaceSvg } from "@/lib/render/FaceSvg";
import { smoothFaceState } from "@/lib/fuzzy-core/faceMemory";

type ApiResponse = {
  message: string;
  analysis: EmotionAnalysis;
  face: FaceState;
};

const muscleLabels: Record<MuscleName, string> = {
  browRaise: "Брови вверх",
  browLower: "Брови вниз",
  eyeOpen: "Глаза шире",
  eyeSquint: "Прищур",
  smile: "Улыбка",
  mouthDown: "Рот вниз",
  lipPress: "Сжатие губ",
  jawDrop: "Рот открыт",
  asymmetry: "Асимметрия",
};

export default function HomePage() {
  const [message, setMessage] = useState("Какой ужас, моя собака опять съела полмешка корма");
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [face, setFace] = useState<FaceState | null>(null);
  const [rawFace, setRawFace] = useState<FaceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Ошибка анализа");
      }

      const result = data as ApiResponse;

      setAnalysis(result.analysis);
      setRawFace(result.face);

      setFace((previous) => smoothFaceState(previous, result.face, 0.45));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <h1 className="text-3xl font-bold">TvoiKent Face MVP</h1>
          <p className="mt-2 text-zinc-400">
            Текст → 5 оценок Mistral → нечёткая дефаззификация → мышцы → SVG-лицо.
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-300">
              Сообщение
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 h-32 w-full resize-none rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-100 outline-none focus:border-zinc-400"
              placeholder="Напиши фразу для анализа..."
            />

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-4 rounded-2xl bg-zinc-100 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Анализирую..." : "Сгенерировать мимику"}
            </button>

            {error && (
              <p className="mt-4 rounded-2xl border border-red-900 bg-red-950 p-4 text-red-200">
                {error}
              </p>
            )}
          </div>

          {analysis && (
            <div className="mt-8 grid gap-5">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <h2 className="text-xl font-semibold">Оценки Mistral</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Главная эмоция: <b>{analysis.dominant}</b>, уверенность:{" "}
                  <b>{analysis.confidence.toFixed(2)}</b>
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {analysis.explanation}
                </p>

                <div className="mt-4 grid gap-3">
                  {Object.entries(analysis.scores).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{key}</span>
                        <span>{value.toFixed(2)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-100"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {rawFace && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <h2 className="text-xl font-semibold">Мышцы после дефаззификации</h2>

                  <div className="mt-4 grid gap-3">
                    {Object.entries(rawFace).map(([key, control]) => (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{muscleLabels[key as MuscleName]}</span>
                          <span>
                            power {control.power.toFixed(2)} / lcr {control.lcr.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-zinc-100"
                            style={{ width: `${control.power * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Лицо</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Это не Live2D, не магия и не “ИИ рисует лицо”. Это обычные координаты SVG,
            которые двигаются от чисел мышц.
          </p>

          <div className="mt-6 flex justify-center">
            <FaceSvg face={face} />
          </div>
        </aside>
      </div>
    </main>
  );
}