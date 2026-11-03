# Stickers for the live class

Drop transparent PNG files here (about 600 px wide, made in Canva with "Transparent background"),
then list each one in `stickers.json`:

```json
[
  {"file": "great-job.png", "ar": "أحسنت", "en": "Great job", "sound": "ok"},
  {"file": "star.png",      "ar": "نجم",   "en": "Star",      "sound": "win"}
]
```

`sound`: `ok` (cheer + voice), `win` (celebration), `bad` (gentle try-again), `tap` (soft click),
or the name of any voice file in `assets/voice/george/` (for example `read_alone`).
They show first in the sticker tray (live/ and the mushaf corrector), draggable, with the student's name under them.
No student names or photos here: this folder is public.
