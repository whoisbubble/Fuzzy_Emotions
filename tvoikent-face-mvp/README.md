# FuzzyEmotions App

Основная документация проекта находится уровнем выше: [../README.md](../README.md).

Этот каталог содержит сам Next.js-приложение:

- `src/app` — интерфейс, layout, API route.
- `src/lib/ai` — промпт, Mistral API, локальная калибровка текста.
- `src/lib/fuzzy-core` — fuzzy inference, centroid defuzzification, перевод эмоций в мышцы.
- `src/lib/render` — SVG-рендер лица.

Быстрый старт:

```bash
npm install
npm run dev
```

Нужен `.env.local` с `MISTRAL_API_KEY`.
