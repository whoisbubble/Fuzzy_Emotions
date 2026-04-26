import { NextRequest, NextResponse } from "next/server";
import { analyzeWithMistral } from "@/lib/ai/mistral";
import { generateFaceState } from "@/lib/fuzzy-core/emotionToMuscles";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Сообщение пустое" },
        { status: 400 }
      );
    }

    const analysis = await analyzeWithMistral(message);
    const face = generateFaceState(analysis);

    return NextResponse.json({
      message,
      analysis,
      face,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Неизвестная ошибка сервера",
      },
      { status: 500 }
    );
  }
}