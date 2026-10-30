# Мемы для урока

Мемы — не украшение: каждый несёт **одно** правило или одну ошибку, и ученик должен понять
грамматику, даже если посмотрел только на мем. Скачивать чужие картинки из интернета нельзя
(сеть может быть закрыта, а у шаблонов-фото есть правообладатели) — поэтому мемы рисуются
самостоятельно: HTML-карточка 1080×1080 с крупными эмодзи вместо фото, рендер в PNG через
`scripts/render-memes.mjs`.

## Как сделать

1. Создайте рабочую папку, скопируйте туда `assets/memes/base.css`.
2. На каждый мем — `mN.html` по образцу из `assets/memes/travelling-conditionals/`
   (в образцах `href=../base.css`; в своей папке пишите `href=base.css`).
3. `node scripts/render-memes.mjs <папка>`.
4. **Откройте каждый PNG и посмотрите** — типовые дефекты: ряд эмодзи переносится на вторую
   строку (лечится `white-space:nowrap` и меньшим `font-size`), эмодзи наезжает на подпись внизу,
   «500 ₽» разрывается по строкам.
5. Загрузите: `node scripts/holst-mcp.mjs upload <boardId> <папка>/m*.png` → assetId.

## Классы из base.css

- `.badge` — бордовая плашка с названием правила (вверху слева);
- `.hl` — жёлтая подсветка грамматики (как `hl()` на доске);
- `.no` — красное зачёркивание ошибки;
- `.e` — блок эмодзи (Apple Color Emoji на Mac, Segoe UI Emoji на Windows — рисунок эмодзи
  будет разный, это нормально);
- `.tag` — маленькая подпись в правом нижнем углу.
Внизу каждого мема — серая строка-формула («If + Past, would + V»): мем работает как шпаргалка.

## Форматы и под что они подходят

| Формат | Раскладка | Для какой грамматики |
|---|---|---|
| **Nobody: / Me:** | «Nobody: / Literally nobody: / Me at every airport:» + фраза | привычки, факты, Present Simple, zero conditional |
| **Drake** (🙅‍♀️ / 💁‍♀️) | 2×2: эмодзи слева, неправильно (зачёркнуто) сверху, правильно снизу | **типичная ошибка**: will после if, didn't went, more better |
| **Expectation vs Reality** | две половины, синяя/розовая | планы и прогнозы: first conditional, going to, will |
| **Me vs also me** | мечта крупно + «Also me, checking my bank account: 👁️👄👁️ 500 ₽» | нереальное: second conditional, wish |
| **This is fine** (🔥🐶☕🔥) | ряд эмодзи, «This is fine.», фраза-сожаление | сожаления: third conditional, should have, Past Perfect |
| **Then / Now** | верх — «если бы тогда…», низ — «Me now:» | связь прошлого и настоящего: mixed conditional, Present Perfect |
| **POV:** | «POV: you …» + сцена эмодзи | Present Continuous, ситуации |
| **How it started / How it's going** | две половины | Past Simple vs Present Perfect/Continuous |
| **Distracted (👀➡️)** | «Me 👀 → new word / my old habit» | used to, would для привычек в прошлом |

Сюжет мема — из темы урока и из жизни взрослого ученика: аэропортовый кофе за 900 ₽, пять
чемоданов «на всякий случай», биткоин в 2017. Один мем на правило + один мем-заготовка
«Your turn» для говорения.
