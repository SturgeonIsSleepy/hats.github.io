<!DOCTYPE html><html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HATS 人格测试</title>
  <style>
    :root{
      --bg:#eef3ee;
      --card:#ffffff;
      --text:#1f2a23;
      --muted:#6f7f74;
      --line:#e6ebe7;
      --brand:#5f7f63;
      --brand-dark:#4c6751;
      --soft:#eaf2ec;
      --soft-2:#dfeadf;
      --shadow: 0 18px 50px rgba(31,42,35,.08);
      --radius: 28px;
    }*{box-sizing:border-box}
body{
  margin:0;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  background: radial-gradient(circle at top, #f7faf7 0%, var(--bg) 55%, #e8efe8 100%);
  color:var(--text);
  min-height:100vh;
}

.app{
  max-width: 520px;
  margin: 0 auto;
  padding: 22px 16px 28px;
}

.topbar{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-bottom: 18px;
  color: #a66d58;
  font-size: 15px;
  letter-spacing:.2px;
  user-select:none;
}

.hero,
.quiz,
.result{
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.7);
  box-shadow: var(--shadow);
  border-radius: 36px;
  overflow:hidden;
}

.hero-inner,
.quiz-inner,
.result-inner{
  padding: 28px 18px 24px;
}

.hero{
  min-height: calc(100vh - 74px);
  display:flex;
  align-items:center;
}

.hero-inner{
  width:100%;
  text-align:center;
}

.title{
  font-size: 34px;
  line-height:1.12;
  font-weight: 800;
  letter-spacing: -0.8px;
  margin: 12px 0 18px;
}

.btn{
  appearance:none;
  border:none;
  cursor:pointer;
  font: inherit;
  font-weight:700;
  border-radius: 20px;
  padding: 16px 28px;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease, opacity .15s ease;
}
.btn:active{transform: scale(.98)}

.btn-primary{
  background: var(--brand);
  color: #fff;
  box-shadow: 0 10px 24px rgba(95,127,99,.24);
  min-width: 132px;
}
.btn-primary:hover{background: var(--brand-dark)}

.meta{
  margin-top: 26px;
  font-size: 18px;
  line-height: 1.7;
  color: #2a332d;
}
.meta .row{
  display:flex;
  justify-content:center;
  gap: 10px;
  flex-wrap:wrap;
  margin: 0;
}
.meta .label{
  color:#2c2f2d;
  white-space:nowrap;
}
.meta .value{
  font-weight:400;
  text-decoration:none;
  color:#1f57c7;
}

.progress-wrap{
  padding: 18px 18px 0;
}
.progress-meta{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 14px;
}
.progress-bar{
  width:100%;
  height: 14px;
  background: #edf2ee;
  border-radius: 999px;
  overflow:hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.04);
}
.progress-fill{
  width:0%;
  height:100%;
  background: linear-gradient(90deg, #91b397, #6e8f74);
  border-radius:999px;
  transition: width .25s ease;
}

.quiz{
  margin-top: 18px;
}

.question-card{
  margin: 18px 18px 0;
  padding: 18px 16px 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(31,42,35,.04);
}

.q-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  margin-bottom: 14px;
}

.q-badge{
  display:inline-flex;
  align-items:center;
  border-radius:999px;
  padding: 7px 12px;
  background: var(--soft);
  color: #5d6f60;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid #dde7de;
  white-space:nowrap;
}

.q-state{
  color:#839187;
  font-size: 13px;
  white-space:nowrap;
  padding-top: 2px;
}

.q-text{
  font-size: 22px;
  line-height:1.38;
  font-weight: 700;
  margin: 2px 0 16px;
  letter-spacing:-.2px;
}

.options{display:grid; gap: 10px;}

.option{
  display:flex;
  align-items:center;
  gap: 12px;
  width:100%;
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid #dde4de;
  background:#fff;
  cursor:pointer;
  text-align:left;
  transition: background .15s ease, border-color .15s ease, transform .15s ease;
  user-select:none;
}
.option:hover{
  background:#f6faf7;
  border-color:#cfd9d1;
}
.option:active{transform: scale(.995)}

.radio{
  width:20px;
  height:20px;
  border-radius:50%;
  border:2px solid #aab8ae;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex: 0 0 auto;
  background:#fff;
}
.radio::after{
  content:"";
  width:10px;
  height:10px;
  border-radius:50%;
  background: transparent;
  transform: scale(0);
  transition: transform .15s ease, background .15s ease;
}
.option.selected{
  border-color: #b8c8ba;
  background: #f4f8f4;
  box-shadow: inset 0 0 0 1px rgba(95,127,99,.05);
}
.option.selected .radio{
  border-color: var(--brand);
}
.option.selected .radio::after{
  background: var(--brand);
  transform: scale(1);
}

.opt-label{
  font-weight: 700;
  color:#415047;
  min-width: 30px;
}
.opt-text{
  font-size: 17px;
  line-height:1.35;
  color:#1e2a22;
  font-weight: 600;
  flex:1;
}

.q-footer{
  padding: 16px 18px 18px;
  display:flex;
  gap: 12px;
}
.btn-secondary{
  background:#eff4ef;
  color:#42504a;
  border:1px solid #dde5df;
  flex:1;
}
.btn-secondary:hover{background:#e8eee9}
.btn-next{flex:1.1}

.hint{
  margin: 12px 18px 0;
  color:#738176;
  font-size: 13px;
  line-height:1.5;
}

.result{
  margin-top: 18px;
}
.result-inner{
  text-align:center;
  padding-top: 30px;
}
.result-title{
  font-size: 20px;
  color:#5b6960;
  margin-bottom: 12px;
  font-weight: 700;
}
.result-type{
  font-size: 38px;
  line-height:1.1;
  margin: 0;
  font-weight: 900;
  letter-spacing: -1px;
}
.result-type-en{
  margin-top: 6px;
  font-size: 22px;
  color: var(--brand);
  font-weight: 800;
}
.badge{
  display:inline-block;
  margin-top: 18px;
  padding: 10px 16px;
  background: var(--soft-2);
  color:#57705c;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  border: 1px solid #d3e1d5;
}
.result-desc{
  margin: 18px auto 0;
  max-width: 420px;
  text-align:left;
  color:#39433d;
  line-height:1.85;
  font-size: 16px;
  background: #fafcfb;
  border: 1px solid #e5ebe6;
  border-radius: 22px;
  padding: 16px 16px 14px;
}
.result-actions{
  display:flex;
  gap:12px;
  margin-top: 18px;
  padding-bottom: 4px;
}
.result-actions .btn{flex:1}

.toast-wrap{
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  pointer-events:none;
  z-index: 9999;
  width: min(92vw, 420px);
  display:flex;
  justify-content:center;
}
.toast{
  background: rgba(31,42,35,.92);
  color:#fff;
  border-radius: 999px;
  padding: 12px 16px;
  box-shadow: 0 16px 40px rgba(0,0,0,.18);
  font-size: 14px;
  line-height: 1.3;
  max-width: 100%;
  opacity: 0;
  transform: translateY(10px) scale(.98);
  transition: opacity .18s ease, transform .18s ease;
  text-align:center;
}
.toast.show{
  opacity: 1;
  transform: translateY(0) scale(1);
}

.hidden{display:none !important}

@media (max-width: 420px){
  .title{font-size: 30px}
  .q-text{font-size: 20px}
  .opt-text{font-size: 16px}
  .hero, .quiz, .result{border-radius: 30px}
  .hero{min-height: calc(100vh - 64px)}
}

  </style>
</head>
<body>
  <div class="app">
    <div class="topbar">作词: Dan Ray</div><section id="home" class="hero">
  <div class="hero-inner">
    <div class="title">HATS已经过时，<br>HATS来了。</div>
    <button class="btn btn-primary" id="startBtn">开始测试</button>
    <div class="meta">
      <div class="row"><span class="label">原作者：</span><span class="value">中华鲟</span></div>
    </div>
  </div>
</section>

<section id="quizView" class="quiz hidden">
  <div class="progress-wrap">
    <div class="progress-meta">
      <span id="progressText">0 / 0</span>
      <span id="progressPercent">0%</span>
    </div>
    <div class="progress-bar" aria-label="作答进度">
      <div id="progressFill" class="progress-fill"></div>
    </div>
  </div>
  <div id="questionArea"></div>
  <div class="hint">已选择的题目会直接显示你的选项，不影响继续作答。</div>
  <div class="q-footer">
    <button class="btn btn-secondary" id="prevBtn">上一题</button>
    <button class="btn btn-primary btn-next" id="nextBtn">下一题</button>
  </div>
</section>

<section id="resultView" class="result hidden">
  <div class="result-inner">
    <div class="result-title">你的主类型</div>
    <h1 class="result-type" id="resultTypeCN">HATS</h1>
    <div class="result-type-en" id="resultTypeEN">HATS</div>
    <div class="badge" id="resultBadge">匹配度 83% · 精准命中 10/15 维</div>
    <div class="result-desc" id="resultDesc"></div>
    <div class="result-actions">
      <button class="btn btn-secondary" id="restartBtn">重新测试</button>
    </div>
  </div>
</section>

  </div>  <div class="toast-wrap" aria-live="polite" aria-atomic="true">
    <div id="toast" class="toast"></div>
  </div>  <script>
    const resultPool = [
      "叛徒", "特务", "大军阀", "反党分子", "野心家", "走资派", "投降派", "修正主义",
      "大恶霸", "黑线人物", "不革命", "黑秀才", "黑手", "黑帮凶", "经验主义", "民主派",
      "中庸之道", "变色龙", "绊脚石", "墙头草", "老好人", "小修苗", "造谣公司", "传话筒",
      "逆流", "邪风", "小爬虫", "新兴的资产阶级分子", "藏在群众队伍里的坏人"
    ];

    const questions = [
      {
        text: "我做决定比较果断，不喜欢犹豫",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我在任何关系里都很重视个人空间",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我更相信规则，而不是情绪",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我喜欢掌控局面，而不是被局面推着走",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我经常会琢磨事情背后的真实动机",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我更喜欢观察现场，而不是立刻冲进去参与",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我认为中华鲟很美味",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我认为人活着就是为了去码头整点薯片",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我对‘大家都这么想’这件事通常保持怀疑",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我喜欢独立行动，不太依赖别人安排",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我更愿意把话说清楚，而不是绕来绕去",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我常常一边听人说话，一边判断对方有没有隐藏信息",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我认为集体意见并不总是正确的",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我喜欢在变化中保持灵活，而不是死守一种立场",
        options: ["不认同", "中立", "认同"]
      },
      {
        text: "我更愿意做个旁观者，先把局势看明白",
        options: ["不认同", "中立", "认同"]
      }
    ];

    const typeDescriptions = {
      default: [
        "你的答题模式显示，你不是那种只看表面的人。",
        "你会在局势、关系、规则之间来回衡量，倾向于先看清再行动。",
        "这个结果更像是一种娱乐性的标签匹配，不代表真实身份。"
      ]
    };

    const state = {
      started: false,
      current: 0,
      answers: Array(questions.length).fill(null)
    };

    const home = document.getElementById('home');
    const quizView = document.getElementById('quizView');
    const resultView = document.getElementById('resultView');
    const questionArea = document.getElementById('questionArea');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const toast = document.getElementById('toast');

    let toastTimer = null;

    function showToast(message){
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 1200);
    }

    function showView(view){
      home.classList.add('hidden');
      quizView.classList.add('hidden');
      resultView.classList.add('hidden');
      view.classList.remove('hidden');
    }

    function startTest(){
      state.started = true;
      state.current = 0;
      state.answers = Array(questions.length).fill(null);
      showView(quizView);
      renderQuestion();
      updateProgress();
    }

    function renderQuestion(){
      const q = questions[state.current];
      const currentAnswer = state.answers[state.current];
      const total = questions.length;

      questionArea.innerHTML = `
        <div class="question-card">
          <div class="q-head">
            <div class="q-badge">第 ${state.current + 1} 题</div>
            <div class="q-state">${currentAnswer === null ? '维度已隐藏' : '已作答：' + q.options[currentAnswer]}</div>
          </div>
          <div class="q-text">${q.text}</div>
          <div class="options" id="options"></div>
        </div>
      `;

      const optionsEl = document.getElementById('options');
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option' + (currentAnswer === idx ? ' selected' : '');
        btn.type = 'button';
        btn.innerHTML = `
          <span class="radio" aria-hidden="true"></span>
          <span class="opt-label">${String.fromCharCode(65 + idx)}</span>
          <span class="opt-text">${opt}</span>
        `;
        btn.addEventListener('click', () => {
          state.answers[state.current] = idx;
          renderQuestion();
          updateProgress();
          showToast(`已选择：${opt}`);
        });
        optionsEl.appendChild(btn);
      });

      prevBtn.disabled = state.current === 0;
      nextBtn.textContent = state.current === total - 1 ? '查看结果' : '下一题';
      nextBtn.disabled = state.answers[state.current] === null;
    }

    function updateProgress(){
      const total = questions.length;
      const answered = state.answers.filter(v => v !== null).length;
      const percent = Math.round((answered / total) * 100);
      progressFill.style.width = percent + '%';
      progressText.textContent = `${answered} / ${total}`;
      progressPercent.textContent = percent + '%';
      nextBtn.disabled = state.answers[state.current] === null;
    }

    function goPrev(){
      if (state.current > 0){
        state.current -= 1;
        renderQuestion();
        updateProgress();
      }
    }

    function goNext(){
      if (state.answers[state.current] === null) return;
      if (state.current < questions.length - 1){
        state.current += 1;
        renderQuestion();
        updateProgress();
        return;
      }
      showResult();
    }

    function showResult(){
      const score = state.answers.reduce((sum, val) => sum + (val ?? 0) + 1, 0);
      const idx = score % resultPool.length;
      const type = resultPool[idx];
      const match = 80 + (score % 16); // 80-95
      const hit = Math.min(15, 8 + (score % 8));

      document.getElementById('resultTypeCN').textContent = type;
      document.getElementById('resultTypeEN').textContent = type;
      document.getElementById('resultBadge').textContent = `匹配度 ${match}% · 精准命中 ${hit}/15 维`;
      document.getElementById('resultDesc').innerHTML = `
        <p>${typeDescriptions.default[0]}</p>
        <p>${typeDescriptions.default[1]}</p>
        <p>${typeDescriptions.default[2]}</p>
      `;
      showView(resultView);
    }

    startBtn.addEventListener('click', startTest);
    restartBtn.addEventListener('click', startTest);
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    // 初始状态：显示首页
    showView(home);
  </script></body>
</html>
