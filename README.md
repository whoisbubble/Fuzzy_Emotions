# FUZZY_EMOTIONS

Экспериментальный проект с AI-анализом текста, нечеткой логикой и SVG-мимикой лица. Репозиторий устроен так, что само приложение живёт в каталоге [`tvoikent-face-mvp`](./tvoikent-face-mvp/), а этот README описывает проект целиком.

## Что делает проект

1. Берёт пользовательское сообщение.
2. Просит Mistral вернуть 10 экспертных оценок эмоций.
3. Агрегирует их в общий консенсус.
4. Локально калибрует результат по явным текстовым маркерам.
5. Переводит эмоции в мышечные каналы через fuzzy inference.
6. Делает centroid defuzzification.
7. Рисует SVG-лицо.

## Стек

- Next.js 16
- React 19
- TypeScript
- Mistral API
- Самописный fuzzy-core

## Главные эмоции

Сейчас система учитывает:

- `joy`
- `affection`
- `humor`
- `aggression`
- `sadness`
- `surprise`
- `confusion`
- `embarrassment`
- `disgust`
- `tension`
- `sarcasm`
- `fear`
- `contempt`
- `awe`
- `curiosity`

## Как считается лицо

В `src/lib/fuzzy-core/emotionToMuscles.ts` эмоции переводятся в 13 каналов лица:

- брови вверх и вниз
- одна поднятая бровь
- раскрытие и прищур глаз
- улыбка
- уголки губ вниз
- сжатие губ
- подъём верхней губы
- открытие рта
- округление рта
- растяжение рта
- асимметрия

Важно: теперь мышца не включается “наполовину” только потому, что где-то слабо сработало правило `medium`. Центр тяжести по-прежнему используется как база defuzzification, но сила мимики дополнительно масштабируется поддержкой правил, чтобы лицо не плыло в полуслучайные полувыражения.

## Логика рта

- По умолчанию рот рисуется одной чёрной линией.
- Для `surprise`, `awe` и части `curiosity` может включаться чёрный эллипс.
- Для `disgust` и `contempt` важнее перекос, подъём верхней губы и асимметрия, а не “улыбка”.

## Где что лежит

- [`tvoikent-face-mvp/src/lib/ai`](./tvoikent-face-mvp/src/lib/ai/) — промпт, Mistral, калибровка текста.
- [`tvoikent-face-mvp/src/lib/fuzzy-core`](./tvoikent-face-mvp/src/lib/fuzzy-core/) — membership, defuzzification, fuzzy rules.
- [`tvoikent-face-mvp/src/lib/render/FaceSvg.tsx`](./tvoikent-face-mvp/src/lib/render/FaceSvg.tsx) — финальная отрисовка лица.
- [`tvoikent-face-mvp/src/app/page.tsx`](./tvoikent-face-mvp/src/app/page.tsx) — основной интерфейс.
- [`tvoikent-face-mvp/src/app/api/analyze/route.ts`](./tvoikent-face-mvp/src/app/api/analyze/route.ts) — API анализа и защита от параллельной перегрузки AI.

## Запуск

Перейди в приложение:

```bash
cd tvoikent-face-mvp
npm install
```

Создай `.env.local`:

```env
MISTRAL_API_KEY=your_key_here
MISTRAL_MODEL=mistral-small-latest
```

Запуск в dev-режиме:

```bash
npm run dev
```

Проверки:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Текущее поведение

- Новый запрос больше не смешивается с предыдущим лицом.
- Favicon подключён через `src/app/icon.svg` и `favicon.ico`.
- Если AI уже обрабатывает один запрос, следующий пользователь получит сообщение, что сервер занят.

## Куда смотреть дальше

- добавить сохранение истории тестовых сообщений;
- вынести пресеты эмоций в отдельный JSON;
- сделать набор regression-тестов для известных фраз;
- добавить ручную панель подкрутки мышц рядом с AI-анализом.
