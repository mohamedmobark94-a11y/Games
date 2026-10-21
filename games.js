/* =====================================================================
   ✏️ قائمة الألعاب — كل لعبة جديدة = سطر جديد هنا + ملفها داخل فولدر games/
   الحقول:
     file  : اسم الملف داخل games/ (اتركه '' = «قريبًا»)
     date  : تاريخ الإضافة YYYY-MM-DD (الأحدث يظهر أولًا، وآخر ٧ أيام عليها شارة «جديد»)
     ico   : إيموجي
     ar/en : الاسم بالعربي والإنجليزي
     age   : ['kids'] أطفال  /  ['teens'] مراهقين  /  ['adults'] كبار  (ممكن أكثر من واحد)
     subj  : 'tajweed' تجويد / 'hifz' حفظ / 'arabic' لغة عربية / 'islamic' إسلاميات / 'nahw' نحو / 'class' للحلقة (ألعاب تسلية)
     desc  : جملة أو جملتان: ماذا يفعل الطالب
     book  : الكتاب المصدر (والصفحات)
   ===================================================================== */
window.SITE = {
  // رقم الواتساب للحجز بالكود الدولي (أرقام فقط، مثل '2010xxxxxxxx'). فاضي = زر الحجز مخفي
  contact: {whatsapp:'201551578000'},
  // كتاب الأسبوع — يتحدّث مع كل أسبوع جديد
  bookOfWeek: {ar:'النحو الواضح في قواعد اللغة العربية', by:'علي الجارم ومصطفى أمين', subj:'arabic', since:'2026-10-19',
               note:'أسبوع اللغة العربية: الجملة المفيدة، أنواع الكلمة، الفعل، الفاعل، المبتدأ والخبر…'}
};

/* التخصصات (تُستعمل في الصفحة الرئيسية ولوحة المعلم) — أول تخصص في كل لعبة هو القسم الذي تظهر فيه */
window.SUBJECTS={tajweed:{ar:'التجويد',en:'Tajweed',ico:'📖',c:'var(--tajweed)',
    d:['أحكام التلاوة: المخارج والصفات والمد والنون والمد والوقف.','Rules of recitation: articulation points, characteristics, madd, nūn & mīm, stopping.']},
  hifz:{ar:'الحفظ',en:'Memorisation',ico:'🧠',c:'var(--hifz)',
    d:['طرق الحفظ والمراجعة والسند وإتقان الآيات.','Methods for memorising, reviewing and mastering verses.']},
  arabic:{ar:'اللغة العربية',en:'Arabic language',ico:'✍️',c:'var(--arabic)',
    d:['الحروف والمفردات والكلمات لمن يبدأ القراءة والكتابة.','Letters, vocabulary and words for those starting to read and write.']},
  nahw:{ar:'النحو',en:'Grammar (Naḥw)',ico:'🧩',c:'#C39BD3',
    d:['الجملة وأنواع الكلمة والفعل والفاعل والمبتدأ والخبر.','The sentence, kinds of words, verbs, subjects and predicates.']},
  islamic:{ar:'الإسلاميات',en:'Islamic studies',ico:'🕌',c:'var(--islamic)',
    d:['الفقه والأخلاق والعقيدة بالأدلة، ومواقف من الحياة.','Fiqh, character and belief with evidence, and real-life situations.']},
  class:{ar:'للحلقة',en:'For the class',ico:'🎉',c:'#FF8FB1',
    d:['ألعاب تسلية للاستراحة وتنشيط الحلقة بين الفقرات.','Fun games for a break and to keep the class lively between activities.']}};

window.GAMES = [
  {file:'xo-showdown.html', date:'2026-10-21', ico:'⭕', ar:'إِكْس أُو: مُنَافَسَةُ الفَصْل', en:'XO: The Class Showdown', age:['kids','teens','adults'], subj:'class',
   desc:'إكس أو للاستراحة: العبوا الكلاسيكية، أو اكسبوا كل خانة بسؤال سريع في الحروف والإسلاميات والعربية. فريقان أو ضد الكمبيوتر.', book:'لعبة تسلية'},
  {file:'memory-match.html', date:'2026-10-21', ico:'🧠', ar:'لُعْبَةُ الذَّاكِرَة', en:'Memory Match', age:['kids','teens'], subj:['arabic','class'],
   desc:'اقلب بطاقتين: كلمة عربية وصورتها. فريقان يتنافسان على الأزواج، أو طالب واحد يحاول بأقل محاولات.', book:'لعبة تسلية (مفردات الحياة اليومية)'},
  {file:'guess-the-word.html', date:'2026-10-21', ico:'🔤', ar:'خَمِّنِ الكَلِمَة', en:'Guess the Word', age:['kids','teens','adults'], subj:['arabic','class'],
   desc:'كلمة عربية مخفية: اختر الحروف قبل أن تفقد قلوبك الستة، مع تلميح بالصورة والمعنى.', book:'لعبة تسلية (مفردات الحياة اليومية)'},
  {file:'sentence-train.html', date:'2026-10-19', ico:'🚂', ar:'قِطَارُ الجُمْلَة', en:'The Sentence Train', age:['kids'], subj:'nahw',
   desc:'الجملة قطار وكل كلمة عربة: ضع لافتة الاسم أو الفعل أو الحرف، واعرف المفيدة من الناقصة، واصنع جملك بنفسك.', book:'النحو الواضح ج١ (ص ١٧–٣٠)'},
  {file:'page-map.html', date:'2026-10-18', ico:'🗺️', ar:'خَرِيطَةُ الصَّفْحَة', en:'The Page Map', age:['teens','adults'], subj:'hifz',
   desc:'صوّر الصفحة بعينك ثم أجب: أين تبدأ الآية؟ مفاتيح الأسطر تختفي تدريجيًا، وخريطة الضعف لكل سطر.', book:'كيف تحفظ القرآن الكريم (ص ٦١–٧٤)'},
  {file:'dabt-keys.html', date:'2026-10-17', ico:'🧰', ar:'كَنْزُ الضَّبْط', en:'The Ḍabṭ Treasure', age:['kids','adults'], subj:'hifz',
   desc:'كل آية صندوق بخمسة أقفال: اسمع، افهم، احفظ من الآخر، ثبّت، أدِّ.', book:'كيف تحفظ القرآن الكريم (ص ٤٥–٦١)'},
  {file:'hifz-chain.html', date:'2026-10-13', ico:'🔗', ar:'سِلْسِلَةُ الحُفَّاظ', en:'The Golden Chain of Huffāẓ', age:['teens','adults'], subj:'hifz',
   desc:'رتّب السند من جبريل إليك، خمّن الحافظ من الأدلة، وسمّع بالتبادل مع زميلك (المعارضة).', book:'كيف تحفظ القرآن الكريم (ص ٢٦–٤٢)'},
  {file:'quran-stars.html', date:'2026-10-12', ico:'🌟', ar:'نُجُومُ القُرْآن', en:'Quran Stars', age:['kids'], subj:'hifz',
   desc:'رتّب كلمات الآية نجومًا، كرّرها ثلاثًا، ثم احفظها والنجوم تختفي واحدة واحدة.', book:'كيف تحفظ القرآن الكريم (ص ٢٠–٢٥)'},
  {file:'waqf-lights.html', date:'2026-10-11', ico:'🚦', ar:'إِشَارَاتُ الوَقْف', en:'Waqf Traffic Lights', age:['teens','adults'], subj:'tajweed',
   desc:'أين أقف؟ ومن أين أبدأ؟ الوقف والابتداء والسكت وهمزة الوصل بإشارة المرور.', book:'الوجيز في علم التجويد (ص ٤١–٤٥، ٥٧–٥٩)'},
  {file:'fat-thin-letters.html', date:'2026-10-10', ico:'🐡', ar:'السَّمِينُ وَالنَّحِيف', en:'Puffy & Skinny Letters', age:['kids'], subj:'tajweed',
   desc:'التفخيم والترقيق بشخصيتين وحركات، ولعبة ذاكرة للحروف المتشابهة، وبالونات مراتب التفخيم.', book:'الوجيز في علم التجويد (ص ٣٤–٣٧)'},
  {file:'madd-ladder.html', date:'2026-10-09', ico:'🪜', ar:'سُلَّمُ المُدُود', en:'The Madd Ladder', age:['teens','adults'], subj:'tajweed',
   desc:'شخّص المد بأسئلة المحقق، رتّب سلم القوة، وقِس طول المد بالحركات.', book:'الوجيز في علم التجويد (ص ٢٨–٣٤)'},
  {file:'sun-moon-wheel.html', date:'2026-10-08', ico:'☀️', ar:'عَجَلَةُ الشَّمْسِ وَالقَمَر', en:'Sun & Moon Wheel', age:['kids'], subj:'tajweed',
   desc:'لِفّ العجلة واقرأ الكلمة: اللام قمرية أم شمسية؟ مع حركة لكل واحدة.', book:'الوجيز في علم التجويد (ص ٢٢–٢٤)'},
  {file:'nun-mim-scale.html', date:'2026-10-07', ico:'⚖️', ar:'مِيزَانُ النُّونِ وَالمِيم', en:'The Nūn & Mīm Scale', age:['teens','adults'], subj:'tajweed',
   desc:'ما الحكم؟ ولماذا؟ أحكام النون والميم الساكنتين على عبارات قرآنية حقيقية.', book:'الوجيز في علم التجويد (ص ١٦–٢٢)'},
  {file:'sifat-houses.html', date:'2026-10-06', ico:'🏠', ar:'بُيُوتُ الصِّفَات', en:'Sifat Houses', age:['kids','teens'], subj:'tajweed',
   desc:'صفات الحروف شخصيات بحركات وأصوات؛ اسحب كل حرف إلى بيته، ومعركة القوة للكبار.', book:'الوجيز في علم التجويد (ص ١٠–١٥)'},
  {file:'letter-journey.html', date:'2026-10-05', ico:'🌬️', ar:'رِحْلَةُ الحَرْف', en:"The Letter's Journey", age:['teens','adults'], subj:'tajweed',
   desc:'مخارج الحروف على خريطة رحلة الهواء من الصدر إلى الشفتين.', book:'الوجيز في علم التجويد (ص ٤–١٠)'},
  {file:'confidence-bet.html', date:'2026-10-05', ico:'🪙', ar:'رِهَانُ الثِّقَة', en:'Confidence Bet', age:['teens','adults'], subj:'islamic',
   desc:'مواقف من حياة الشباب بأدلتها: اختر الإجابة وراهن على ثقتك.', book:'القرآن والسنة (بالمصدر في كل سؤال)'},
  {file:'open-the-box.html', date:'2026-10-04', ico:'🎁', ar:'افْتَحِ الصُّنْدُوق!', en:'Open the Box', age:['kids'], subj:'arabic',
   desc:'صناديق مفاجآت لمفردات البيت والطعام والعائلة والحيوانات، مع بطاقات أدب.', book:'مفردات الحياة اليومية'},
  {file:'letter-freeze.html', date:'2026-10-04', ico:'🧊', ar:'قِفْ يَا حَرْف!', en:'Letter Freeze', age:['kids'], subj:'arabic',
   desc:'امشِ مع الصوت، وعند «قِفْ!» اعمل حركة الحرف حسب نقطه وصفّق بعددها.', book:'الحروف المفردة (نور البيان)'},
  {file:'letter-balloons.html', date:'2026-10-04', ico:'🎈', ar:'بَالُونَاتُ الحُرُوف', en:'Letter Balloons', age:['kids'], subj:'arabic',
   desc:'بالونات الحروف تطير من التلال: اصطد الحرف المطلوب قبل أن يطير.', book:'الحروف المفردة'},
];

/* =====================================================================
   📘 الدروس العامة (بدون أسماء طلاب) — الملف داخل فولدر lessons/
   نفس الحقول + min (مدة الدرس بالدقائق إن وُجدت)
   ===================================================================== */
window.LESSONS = [
  {file:'hats-sounds.html', date:'2026-10-19', ico:'🎩', ar:'قُبَّعَاتُ الحُرُوف', en:'Hats and Sounds', age:['kids'], subj:'arabic',
   desc:'الحرف له اسم وله صوت: ثلاث «قبعات» (فتحة، كسرة، ضمة) وثلاثة أصوات، مع ألعاب استماع وحركة.', book:'نور البيان'},
  {file:'appearance.html', date:'2026-10-11', ico:'🪞', ar:'المَظْهَرُ وَالزِّينَة', en:'Appearance & Adornment', age:['teens'], subj:'islamic',
   desc:'آداب المظهر والنظافة والزينة للشباب بالأدلة، مع مواقف وأسئلة.', book:'فقه الشباب في سؤال وجواب'},
  {file:'fiqh-quiz.html', date:'2026-10-04', ico:'📝', ar:'اخْتِبَارُ فِقْهِ الشَّبَاب', en:'Youth Fiqh Quiz', age:['teens'], subj:'islamic',
   desc:'اختبار تفاعلي في فقه الشباب ومراتب الدين.', book:'فقه الشباب في سؤال وجواب'},
  {file:'three-levels-deen.html', date:'2026-10-04', ico:'🪜', ar:'مَرَاتِبُ الدِّين', en:'The Three Levels of Deen', age:['kids','teens'], subj:'islamic',
   desc:'الإسلام والإيمان والإحسان من حديث جبريل، بأنشطة وأسئلة.', book:'حديث جبريل (صحيح مسلم)'},
  {file:'allah-watching.html', date:'2026-10-04', ico:'👁️', ar:'اللهُ يَرَانِي', en:'Allah Is Watching Me', age:['kids'], subj:'islamic',
   desc:'درس المراقبة للأطفال: الله يراني ويسمعني في كل مكان، بقصص ومواقف.', book:'القرآن والسنة'},
  {file:'aynuk-amana.html', date:'2026-10-04', ico:'🛡️', ar:'عَيْنُكَ أَمَانَة', en:'Your Eyes Are a Trust', age:['teens'], subj:'islamic',
   desc:'غض البصر وحفظ الفرج للشباب بأسلوب عرض تفاعلي، مع القلم والسبورة.', book:'فقه الشباب في سؤال وجواب'},
  {file:'ghadd-albasar.html', date:'2026-10-03', ico:'👀', ar:'غَضُّ البَصَر', en:'Lowering the Gaze', age:['teens'], subj:'islamic',
   desc:'درس ٣٠ دقيقة بمحطات: الحكم والدليل والمواقف واختبار.', book:'فقه الشباب في سؤال وجواب', min:30},
  {file:'ahkam-almadd.html', date:'2026-10-03', ico:'〰️', ar:'أَحْكَامُ المَدّ', en:'The Rules of Madd', age:['kids','teens'], subj:'tajweed',
   desc:'درس ٤٠ دقيقة للمبتدئين: المد الطبيعي والفرعي بأمثلة وألعاب.', book:'التجويد للمبتدئين', min:40},
  {file:'reciters-road.html', date:'2026-09-14', ico:'🛣️', ar:'طَرِيقُ القَارِئ', en:"The Reciter's Road", age:['teens','adults'], subj:'tajweed',
   desc:'علامات الوقف الست في المصحف وعلامات أخرى ستراها، بأمثلة.', book:'علامات المصحف'},
];

/* =====================================================================
   🌐 English descriptions (optional) — key = file name. If a file is missing here the Arabic desc is shown.
   ===================================================================== */
window.DESC_EN = {
  'xo-showdown.html':'A fun break game: play classic XO, or win each square with a quick question on letters, Islam basics or Arabic. Two teams or against the computer.',
  'memory-match.html':'Flip two cards: an Arabic word and its picture. Two teams compete for pairs, or one student tries to finish in the fewest moves.',
  'guess-the-word.html':'A hidden Arabic word: pick the letters before you lose six hearts, with a picture and English hint.',
  'sentence-train.html':'The sentence is a train and each word is a carriage: label nouns, verbs and particles, tell complete sentences from incomplete ones, and build your own.',
  'page-map.html':'Photograph the page with your eyes, then answer: where does the verse start? Line cues fade away step by step, and a weakness map shows each line.',
  'dabt-keys.html':'Every verse is a chest with five locks: listen, understand, memorise from the end, consolidate, recite.',
  'hifz-chain.html':'Order the chain of transmission from Jibreel to you, guess the memoriser from clues, and recite in turns with a classmate.',
  'quran-stars.html':'Arrange the words of a verse as stars, repeat it three times, then memorise it as the stars disappear one by one.',
  'waqf-lights.html':'Where do I stop? Where do I restart? Stopping, starting, the brief pause and connecting hamzas, shown as traffic lights.',
  'fat-thin-letters.html':'Heavy and light letters through two characters with movements, a memory game for look-alike letters, and balloons for the levels of heaviness.',
  'madd-ladder.html':'Diagnose each madd with detective questions, order the strength ladder, and measure madd length in counts.',
  'sun-moon-wheel.html':'Spin the wheel and read the word: is the lam solar or lunar? Each has its own movement.',
  'nun-mim-scale.html':'What is the rule, and why? Rules of silent nūn and mīm on real Qur’anic phrases.',
  'sifat-houses.html':'Letter characteristics as characters with movements and sounds; drag each letter to its house, with a strength battle for older learners.',
  'letter-journey.html':'Points of articulation on a map that follows the breath from the chest to the lips.',
  'confidence-bet.html':'Real-life situations for young people, answered with evidence: choose, then bet on how sure you are.',
  'open-the-box.html':'Surprise boxes for vocabulary about home, food, family and animals, with manners cards.',
  'letter-freeze.html':'Move to the sound; at “Freeze!” strike the pose of the letter’s vowel by its dots and clap its count.',
  'letter-balloons.html':'Letter balloons float up from the hills: catch the requested letter before it flies away.',
  'hats-sounds.html':'A letter has a name and a sound: three “hats” (fatha, kasra, damma) and three sounds, with listening and movement games.',
  'appearance.html':'Etiquette of appearance, cleanliness and adornment for teens, with evidence, situations and questions.',
  'fiqh-quiz.html':'An interactive quiz on youth fiqh and the levels of the religion.',
  'three-levels-deen.html':'Islam, Īmān and Iḥsān from the Hadith of Jibreel, with activities and questions.',
  'allah-watching.html':'A lesson on mindfulness for children: Allah sees me and hears me everywhere, through stories and situations.',
  'aynuk-amana.html':'Lowering the gaze and guarding chastity for teens, in an interactive presentation with pen and whiteboard.',
  'ghadd-albasar.html':'A 30-minute lesson in stations: the ruling, the evidence, situations and a quiz.',
  'ahkam-almadd.html':'A 40-minute beginner lesson: natural and secondary madd with examples and games.',
  'reciters-road.html':'The six stop signs in the muṣḥaf and other marks you will meet, with examples.'
};
