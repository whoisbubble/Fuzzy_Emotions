import { NextRequest, NextResponse } from "next/server";
import { analyzeWithMistral } from "@/lib/ai/mistral";
import { generateFaceState } from "@/lib/fuzzy-core/emotionToMuscles";

declare global {
  var __fuzzyEmotionsAiBusy: boolean | undefined;
}

function tryAcquireAiSlot(): boolean {
  if (globalThis.__fuzzyEmotionsAiBusy) {
    return false;
  }

  globalThis.__fuzzyEmotionsAiBusy = true;
  return true;
}

function releaseAiSlot(): void {
  globalThis.__fuzzyEmotionsAiBusy = false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Сообщение пустое" }, { status: 400 });
    }

    if (!tryAcquireAiSlot()) {
      return NextResponse.json(
        {
          error: "AI сервер сейчас занят другим расчётом. Попробуйте ещё раз через несколько секунд.",
        },
        {
          status: 503,
          headers: {
            "Retry-After": "3",
          },
        }
      );
    }

    try {
      const analysis = await analyzeWithMistral(message);
      const face = generateFaceState(analysis);

      return NextResponse.json({
        message,
        analysis,
        face,
      });
    } finally {
      releaseAiSlot();
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неизвестная ошибка сервера" },
      { status: 500 }
    );
  }
}
