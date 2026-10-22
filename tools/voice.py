#!/usr/bin/env python3
"""Make the recorded voice lines used by tq-fx.js (a warm, calm male English voice; Kokoro TTS, runs offline).

  pip install kokoro-onnx soundfile        (ffmpeg must be installed)
  python3 tools/voice.py bank                                  # the shared lines: praise, oops, class phrases
  python3 tools/voice.py lesson madd-asli-fari lines.json      # one lesson: {"s1": "text", ...} -> assets/voice/<voice>/lessons/<name>/s1.mp3

Model files are downloaded once into ~/.cache/tq-voice from the kokoro-onnx GitHub release.
Arabic is not spoken by this voice: Qur'an audio is Husary from everyayah.com (TQFX.ayah).
"""
import json, os, subprocess, sys, tempfile, urllib.request

VOICE_ID, VOICE_DIR, LANG, SPEED = 'bm_george', 'george', 'en-gb', 0.9
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser('~/.cache/tq-voice')
REL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
FILES = {'kokoro.onnx': REL + 'kokoro-v1.0.int8.onnx', 'voices.bin': REL + 'voices-v1.0.bin'}

BANK = {
    'great_job': 'Great job!', 'excellent': 'Excellent!', 'thats_right': "That's right!", 'well_done': 'Well done!',
    'masha_allah': 'Mashaa Allah! Well done.', 'perfect': 'Perfect!', 'brilliant': 'Brilliant!',
    'oops_try_again': 'Oops! Try again.', 'not_quite': 'Not quite. Have another look.', 'almost': 'Almost! Try once more.',
    'look_again': 'Hmm, look again.',
    'you_did_it': 'You did it! Amazing work.', 'amazing_work': 'Wonderful! You finished it all.',
    'listen_carefully': 'Listen carefully.', 'repeat_after_me': 'Repeat after me.', 'read_alone': 'Now, read alone.',
}

def model():
    os.makedirs(CACHE, exist_ok=True)
    for name, url in FILES.items():
        p = os.path.join(CACHE, name)
        if not os.path.exists(p):
            print('downloading', name); urllib.request.urlretrieve(url, p)
    from kokoro_onnx import Kokoro
    return Kokoro(os.path.join(CACHE, 'kokoro.onnx'), os.path.join(CACHE, 'voices.bin'))

def make(lines, out_dir):
    import soundfile as sf
    k = model(); os.makedirs(out_dir, exist_ok=True)
    for key, text in lines.items():
        samples, sr = k.create(text, voice=VOICE_ID, speed=SPEED, lang=LANG)
        with tempfile.NamedTemporaryFile(suffix='.wav') as w:
            sf.write(w.name, samples, sr)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w.name, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                            '-ac', '1', '-b:a', '48k', os.path.join(out_dir, key + '.mp3')], check=True)
        print(key, '·', text)

if __name__ == '__main__':
    base = os.path.join(ROOT, 'assets', 'voice', VOICE_DIR)
    if len(sys.argv) >= 2 and sys.argv[1] == 'bank':
        make(BANK, base)
    elif len(sys.argv) == 4 and sys.argv[1] == 'lesson':
        make(json.load(open(sys.argv[3], encoding='utf-8')), os.path.join(base, 'lessons', sys.argv[2]))
    else:
        print(__doc__)
